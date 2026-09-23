"""
Serializers for Cart, CartItem, Order, OrderItem, and Checkout.
"""
from decimal import Decimal

from rest_framework import serializers

from apps.products.serializers import ProductListSerializer

from .models import Cart, CartItem, Order, OrderItem, Payment, PaymentMethod


# ──────────────────────────────────────────────────────────────────────────────
# Cart
# ──────────────────────────────────────────────────────────────────────────────

class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    unit_price = serializers.DecimalField(
        source="product.price", max_digits=10, decimal_places=2, read_only=True
    )
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    product_status = serializers.CharField(source="product.status", read_only=True)
    available_stock = serializers.IntegerField(source="product.stock_quantity", read_only=True)
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            "id", "product", "product_name", "product_sku", "product_status",
            "quantity", "unit_price", "subtotal", "available_stock", "product_image",
        ]
        read_only_fields = ["id", "product_name", "product_sku", "unit_price", "subtotal",
                            "product_status", "available_stock", "product_image"]

    def get_product_image(self, obj):
        request = self.context.get("request")
        if obj.product.image:
            if request:
                return request.build_absolute_uri(obj.product.image.url)
            return obj.product.image.url
        return None


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "items", "subtotal", "total", "item_count", "updated_at"]
        read_only_fields = fields

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        subtotal = instance.subtotal
        # For PoC: total == subtotal (no tax/shipping)
        rep["subtotal"] = subtotal
        rep["total"] = subtotal
        rep["item_count"] = instance.item_count
        return rep


class AddCartItemSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)

    def validate(self, attrs):
        from apps.products.models import Product
        try:
            product = Product.objects.get(pk=attrs["product_id"])
        except Product.DoesNotExist:
            raise serializers.ValidationError({"product_id": "Product not found."})

        if product.status != "ACTIVE":
            raise serializers.ValidationError({"product_id": "This product is not available."})

        if attrs["quantity"] > product.stock_quantity:
            raise serializers.ValidationError(
                {"quantity": f"Only {product.stock_quantity} unit(s) available."}
            )

        attrs["product"] = product
        return attrs


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)

    def validate(self, attrs):
        cart_item = self.context.get("cart_item")
        if cart_item and attrs["quantity"] > cart_item.product.stock_quantity:
            raise serializers.ValidationError(
                {"quantity": f"Only {cart_item.product.stock_quantity} unit(s) available."}
            )
        return attrs


# ──────────────────────────────────────────────────────────────────────────────
# Order
# ──────────────────────────────────────────────────────────────────────────────

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "product_sku", "quantity", "unit_price", "subtotal"]
        read_only_fields = fields


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["amount", "method", "status", "reference", "created_at"]
        read_only_fields = fields


class OrderListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    customer_email = serializers.CharField(source="customer.email", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "customer", "customer_name", "customer_email",
            "total_amount", "payment_method", "payment_status", "order_status", "created_at",
        ]
        read_only_fields = fields


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    customer_email = serializers.CharField(source="customer.email", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "customer", "customer_name", "customer_email",
            "total_amount", "payment_method", "payment_status", "order_status",
            "notes", "items", "payment", "created_at", "updated_at",
        ]
        read_only_fields = fields


class CheckoutSerializer(serializers.Serializer):
    """Request body for POST /api/orders/checkout/"""

    payment_method = serializers.ChoiceField(choices=PaymentMethod.choices)
    notes = serializers.CharField(required=False, default="", allow_blank=True)


class OrderStatusUpdateSerializer(serializers.Serializer):
    """Request body for PATCH /api/orders/{id}/status/"""

    status = serializers.ChoiceField(choices=Order.order_status.field.choices if hasattr(Order, 'order_status') else [
        ("PENDING", "Pending"),
        ("CONFIRMED", "Confirmed"),
        ("PROCESSING", "Processing"),
        ("READY_FOR_COLLECTION", "Ready for Collection"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    ])
