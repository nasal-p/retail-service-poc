"""
Serializers for Inventory.
"""
from rest_framework import serializers

from apps.products.serializers import ProductListSerializer

from .models import Inventory, InventoryTransaction


class InventorySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    stock_quantity = serializers.IntegerField(source="product.stock_quantity", read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Inventory
        fields = [
            "product", "product_name", "product_sku",
            "stock_quantity", "low_stock_threshold", "is_low_stock", "last_updated",
        ]
        read_only_fields = ["product", "product_name", "product_sku", "stock_quantity", "is_low_stock", "last_updated"]


class InventoryAdjustSerializer(serializers.Serializer):
    """Used for manual stock adjustments by admin."""

    new_quantity = serializers.IntegerField(min_value=0)
    note = serializers.CharField(max_length=255, required=False, default="")


class InventoryTransactionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)

    class Meta:
        model = InventoryTransaction
        fields = ["id", "transaction_type", "quantity", "note", "created_by", "created_by_name", "created_at"]
        read_only_fields = fields
