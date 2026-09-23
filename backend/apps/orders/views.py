"""
Views for Cart, Checkout, and Orders.
"""
from drf_spectacular.utils import extend_schema
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.permissions import IsAdminOrStaff, IsCustomer
from core.responses import created_response, error_response, success_response

from apps.inventory.services import InsufficientStockError

from .models import Cart, CartItem, Order, OrderStatus
from .serializers import (
    AddCartItemSerializer,
    CartSerializer,
    CheckoutSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
    OrderStatusUpdateSerializer,
    UpdateCartItemSerializer,
)
from .services import checkout


# ──────────────────────────────────────────────────────────────────────────────
# Cart
# ──────────────────────────────────────────────────────────────────────────────

class CartView(APIView):
    """
    GET /api/cart/

    Returns the current customer's cart with computed totals.
    Auto-creates a cart if the customer doesn't have one yet.
    """

    permission_classes = [IsAuthenticated, IsCustomer]

    @extend_schema(tags=["Cart"], summary="Get current customer cart")
    def get(self, request):
        cart, _ = Cart.objects.get_or_create(customer=request.user)
        serializer = CartSerializer(cart, context={"request": request})
        return success_response(data=serializer.data, message="Cart retrieved.")


class CartItemCreateView(APIView):
    """
    POST /api/cart/items/

    Add a product to the cart (or increase quantity if already present).
    """

    permission_classes = [IsAuthenticated, IsCustomer]

    @extend_schema(tags=["Cart"], request=AddCartItemSerializer, summary="Add item to cart")
    def post(self, request):
        serializer = AddCartItemSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Validation failed.", errors=serializer.errors)

        product = serializer.validated_data["product"]
        quantity = serializer.validated_data["quantity"]

        cart, _ = Cart.objects.get_or_create(customer=request.user)

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={"quantity": quantity},
        )

        if not created:
            new_qty = cart_item.quantity + quantity
            if new_qty > product.stock_quantity:
                return error_response(
                    "Insufficient stock.",
                    errors={"quantity": f"Only {product.stock_quantity} unit(s) available."},
                    status=400,
                )
            cart_item.quantity = new_qty
            cart_item.save(update_fields=["quantity"])

        cart.refresh_from_db()
        return created_response(
            data=CartSerializer(cart, context={"request": request}).data,
            message="Item added to cart.",
        )


class CartItemDetailView(APIView):
    """
    PATCH  /api/cart/items/{id}/  — update quantity
    DELETE /api/cart/items/{id}/  — remove item
    """

    permission_classes = [IsAuthenticated, IsCustomer]

    def _get_item(self, request, pk):
        return get_object_or_404(CartItem, pk=pk, cart__customer=request.user)

    @extend_schema(tags=["Cart"], request=UpdateCartItemSerializer, summary="Update cart item quantity")
    def patch(self, request, pk):
        cart_item = self._get_item(request, pk)
        serializer = UpdateCartItemSerializer(
            data=request.data,
            context={"cart_item": cart_item},
        )
        if not serializer.is_valid():
            return error_response("Validation failed.", errors=serializer.errors)

        cart_item.quantity = serializer.validated_data["quantity"]
        cart_item.save(update_fields=["quantity"])

        cart = cart_item.cart
        cart.refresh_from_db()
        return success_response(data=CartSerializer(cart, context={"request": request}).data, message="Cart updated.")

    @extend_schema(tags=["Cart"], summary="Remove item from cart")
    def delete(self, request, pk):
        cart_item = self._get_item(request, pk)
        cart = cart_item.cart
        cart_item.delete()
        cart.refresh_from_db()
        return success_response(data=CartSerializer(cart, context={"request": request}).data, message="Item removed from cart.")


class CartClearView(APIView):
    """
    DELETE /api/cart/clear/

    Remove all items from the customer's cart.
    """

    permission_classes = [IsAuthenticated, IsCustomer]

    @extend_schema(tags=["Cart"], summary="Clear all items from cart")
    def delete(self, request):
        try:
            cart = Cart.objects.get(customer=request.user)
            cart.items.all().delete()
            return success_response(message="Cart cleared.")
        except Cart.DoesNotExist:
            return success_response(message="Cart is already empty.")


# ──────────────────────────────────────────────────────────────────────────────
# Checkout
# ──────────────────────────────────────────────────────────────────────────────

class CheckoutView(APIView):
    """
    POST /api/orders/checkout/

    Full atomic checkout: validates stock, creates order, deducts inventory.
    Only customers can checkout.
    """

    permission_classes = [IsAuthenticated, IsCustomer]

    @extend_schema(
        tags=["Orders"],
        request=CheckoutSerializer,
        summary="Checkout — create order from cart",
    )
    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Validation failed.", errors=serializer.errors)

        try:
            order = checkout(
                customer=request.user,
                payment_method=serializer.validated_data["payment_method"],
                notes=serializer.validated_data.get("notes", ""),
            )
        except ValueError as e:
            return error_response(str(e), status=400)
        except InsufficientStockError as e:
            return error_response(
                "Insufficient stock.",
                errors={"product": f"Only {e.available} unit(s) available for requested product."},
                status=400,
            )
        except Exception as e:
            return error_response("Checkout failed. Please try again.", status=500)

        order_data = OrderDetailSerializer(order, context={"request": request}).data
        return created_response(data=order_data, message="Order created successfully.")


# ──────────────────────────────────────────────────────────────────────────────
# Orders
# ──────────────────────────────────────────────────────────────────────────────

class OrderListView(APIView):
    """
    GET /api/orders/

    Customers see only their own orders.
    Staff/Admin see all orders (with optional ?customer= filter).
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Orders"], summary="List orders")
    def get(self, request):
        user = request.user
        if user.role in ("ADMIN", "STAFF"):
            qs = Order.objects.select_related("customer").order_by("-created_at")
            # Optional filters for admin
            status_filter = request.query_params.get("status")
            if status_filter:
                qs = qs.filter(order_status=status_filter.upper())
        else:
            qs = Order.objects.filter(customer=user).order_by("-created_at")

        from core.pagination import StandardResultsPagination
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = OrderListSerializer(page, many=True)
        return success_response(
            data={
                "count": paginator.page.paginator.count,
                "next": paginator.get_next_link(),
                "previous": paginator.get_previous_link(),
                "results": serializer.data,
            },
            message="Orders retrieved.",
        )


class OrderDetailView(APIView):
    """
    GET /api/orders/{id}/

    Customers can only access their own orders.
    Staff/Admin can access any order.
    """

    permission_classes = [IsAuthenticated]

    def _get_order(self, request, pk):
        user = request.user
        if user.role in ("ADMIN", "STAFF"):
            return get_object_or_404(Order, pk=pk)
        return get_object_or_404(Order, pk=pk, customer=user)

    @extend_schema(tags=["Orders"], summary="Retrieve order details")
    def get(self, request, pk):
        order = self._get_order(request, pk)
        serializer = OrderDetailSerializer(order, context={"request": request})
        return success_response(data=serializer.data)


class OrderStatusUpdateView(APIView):
    """
    PATCH /api/orders/{id}/status/

    Update the order status. Staff and Admin only.
    """

    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    @extend_schema(
        tags=["Orders"],
        request=OrderStatusUpdateSerializer,
        summary="Update order status (Staff/Admin)",
    )
    def patch(self, request, pk):
        order = get_object_or_404(Order, pk=pk)
        serializer = OrderStatusUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Validation failed.", errors=serializer.errors)

        new_status = serializer.validated_data["status"]

        # Guard: cannot update a completed or cancelled order
        if order.order_status in (OrderStatus.COMPLETED, OrderStatus.CANCELLED):
            return error_response(
                f"Cannot update a {order.order_status.lower()} order.",
                status=400,
            )

        order.order_status = new_status
        order.save(update_fields=["order_status", "updated_at"])

        return success_response(
            data=OrderDetailSerializer(order).data,
            message=f"Order status updated to {new_status}.",
        )
