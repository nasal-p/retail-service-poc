"""
Django admin for products app.
"""
from django.contrib import admin

from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["name"]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name", "brand", "sku", "category", "price", "stock_quantity", "status"]
    list_filter = ["status", "category", "brand"]
    search_fields = ["name", "brand", "sku", "model"]
    readonly_fields = ["id", "created_at", "updated_at"]
    list_editable = ["status"]
