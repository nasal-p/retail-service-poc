"""
URL routes for the orders app.
"""
from django.urls import path

from .views import (
    CartClearView,
    CartItemCreateView,
    CartItemDetailView,
    CartView,
    CheckoutView,
    OrderDetailView,
    OrderListView,
    OrderStatusUpdateView,
)

urlpatterns = [
    # Cart
    path("cart/", CartView.as_view(), name="cart"),
    path("cart/items/", CartItemCreateView.as_view(), name="cart-item-create"),
    path("cart/items/<int:pk>/", CartItemDetailView.as_view(), name="cart-item-detail"),
    path("cart/clear/", CartClearView.as_view(), name="cart-clear"),

    # Checkout
    path("orders/checkout/", CheckoutView.as_view(), name="checkout"),

    # Orders
    path("orders/", OrderListView.as_view(), name="order-list"),
    path("orders/<uuid:pk>/", OrderDetailView.as_view(), name="order-detail"),
    path("orders/<uuid:pk>/status/", OrderStatusUpdateView.as_view(), name="order-status-update"),
]
