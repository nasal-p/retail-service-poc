"""
URL routes for the inventory app.
"""
from django.urls import path

from .views import InventoryAdjustView, InventoryDetailView, InventoryListView, InventoryTransactionsView

urlpatterns = [
    path("", InventoryListView.as_view(), name="inventory-list"),
    path("<uuid:product_id>/", InventoryDetailView.as_view(), name="inventory-detail"),
    path("<uuid:product_id>/adjust/", InventoryAdjustView.as_view(), name="inventory-adjust"),
    path("<uuid:product_id>/transactions/", InventoryTransactionsView.as_view(), name="inventory-transactions"),
]
