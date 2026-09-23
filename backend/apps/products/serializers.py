"""
Serializers for Category and Product.
"""
from rest_framework import serializers

from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "description", "is_active", "product_count", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at", "product_count"]

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        # product_count is annotated in the queryset; fall back if not present
        if not hasattr(instance, "product_count"):
            rep["product_count"] = instance.products.filter(status="ACTIVE").count()
        return rep


class ProductListSerializer(serializers.ModelSerializer):
    """Compact serializer for list views."""

    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "name", "brand", "model", "sku", "category", "category_name",
            "price", "stock_quantity", "in_stock", "status", "image", "created_at",
        ]
        read_only_fields = fields


class ProductDetailSerializer(serializers.ModelSerializer):
    """Full serializer for detail views."""

    category_name = serializers.CharField(source="category.name", read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "name", "brand", "model", "sku", "category", "category_name",
            "description", "price", "cost_price", "stock_quantity", "in_stock",
            "image", "status", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "in_stock", "created_at", "updated_at"]


class ProductWriteSerializer(serializers.ModelSerializer):
    """Serializer for creating / updating products (Admin only)."""

    class Meta:
        model = Product
        fields = [
            "name", "brand", "model", "sku", "category",
            "description", "price", "cost_price", "stock_quantity", "image", "status",
        ]

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return value

    def validate_cost_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Cost price cannot be negative.")
        return value

    def validate_stock_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError("Stock quantity cannot be negative.")
        return value

    def validate_sku(self, value):
        return value.upper().strip()
