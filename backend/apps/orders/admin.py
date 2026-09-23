"""
Django admin for orders app.
"""
from django.contrib import admin

from .models import Cart, CartItem, Order, OrderItem, Payment


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["product", "quantity", "unit_price", "subtotal"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["order_number", "customer", "total_amount", "order_status", "payment_status", "created_at"]
    list_filter = ["order_status", "payment_status", "payment_method"]
    search_fields = ["order_number", "customer__email", "customer__full_name"]
    readonly_fields = ["id", "order_number", "created_at", "updated_at"]
    inlines = [OrderItemInline]


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ["customer", "item_count", "updated_at"]
    search_fields = ["customer__email"]
