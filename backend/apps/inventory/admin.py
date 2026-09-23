"""
Django admin for inventory app.
"""
from django.contrib import admin

from .models import Inventory, InventoryTransaction


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ["product", "get_stock", "low_stock_threshold", "is_low_stock", "last_updated"]
    search_fields = ["product__name", "product__sku"]
    readonly_fields = ["last_updated"]

    @admin.display(description="Stock Quantity")
    def get_stock(self, obj):
        return obj.product.stock_quantity


@admin.register(InventoryTransaction)
class InventoryTransactionAdmin(admin.ModelAdmin):
    list_display = ["inventory", "transaction_type", "quantity", "created_by", "created_at"]
    list_filter = ["transaction_type"]
    readonly_fields = ["created_at"]
