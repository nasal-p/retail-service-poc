"""
URL routes for the products app.
"""
from django.urls import path

from .views import CategoryDetailView, CategoryListCreateView, ProductDetailView, ProductListCreateView

urlpatterns = [
    # Categories
    path("categories/", CategoryListCreateView.as_view(), name="category-list"),
    path("categories/<int:pk>/", CategoryDetailView.as_view(), name="category-detail"),

    # Products
    path("products/", ProductListCreateView.as_view(), name="product-list"),
    path("products/<uuid:pk>/", ProductDetailView.as_view(), name="product-detail"),
]
