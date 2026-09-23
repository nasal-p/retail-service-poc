"""
Views for Category and Product CRUD.
"""
from django.db.models import Count
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.pagination import StandardResultsPagination
from core.permissions import IsAdmin, IsAdminOrStaffOrReadOnly
from core.responses import created_response, error_response, success_response

from .filters import ProductFilter
from .models import Category, Product
from .serializers import (
    CategorySerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    ProductWriteSerializer,
)


# ──────────────────────────────────────────────────────────────────────────────
# Category views
# ──────────────────────────────────────────────────────────────────────────────

class CategoryListCreateView(APIView):
    """
    GET  /api/categories/  — list all active categories (authenticated users)
    POST /api/categories/  — create a category (admin only)
    """

    permission_classes = [IsAuthenticated, IsAdminOrStaffOrReadOnly]

    @extend_schema(tags=["Categories"], summary="List categories")
    def get(self, request):
        qs = Category.objects.annotate(product_count=Count("products")).order_by("name")
        serializer = CategorySerializer(qs, many=True)
        return success_response(data=serializer.data, message="Categories retrieved.")

    @extend_schema(tags=["Categories"], request=CategorySerializer, summary="Create category")
    def post(self, request):
        if request.user.role != "ADMIN":
            return error_response("Only admins can create categories.", status=403)
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return created_response(data=serializer.data, message="Category created.")
        return error_response("Validation failed.", errors=serializer.errors)


class CategoryDetailView(APIView):
    """
    GET    /api/categories/{id}/
    PATCH  /api/categories/{id}/
    DELETE /api/categories/{id}/
    """

    permission_classes = [IsAuthenticated, IsAdminOrStaffOrReadOnly]

    def _get_object(self, pk):
        return get_object_or_404(Category, pk=pk)

    @extend_schema(tags=["Categories"], summary="Retrieve category")
    def get(self, request, pk):
        category = self._get_object(pk)
        serializer = CategorySerializer(category)
        return success_response(data=serializer.data)

    @extend_schema(tags=["Categories"], request=CategorySerializer, summary="Update category")
    def patch(self, request, pk):
        if request.user.role != "ADMIN":
            return error_response("Only admins can update categories.", status=403)
        category = self._get_object(pk)
        serializer = CategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return success_response(data=serializer.data, message="Category updated.")
        return error_response("Validation failed.", errors=serializer.errors)

    @extend_schema(tags=["Categories"], summary="Delete category")
    def delete(self, request, pk):
        if request.user.role != "ADMIN":
            return error_response("Only admins can delete categories.", status=403)
        category = self._get_object(pk)
        if category.products.exists():
            return error_response(
                "Cannot delete a category that has products. Deactivate it instead.",
                status=400,
            )
        category.delete()
        return success_response(message="Category deleted.")


# ──────────────────────────────────────────────────────────────────────────────
# Product views
# ──────────────────────────────────────────────────────────────────────────────

class ProductListCreateView(APIView):
    """
    GET  /api/products/  — list products with filtering/search/pagination
    POST /api/products/  — create product (admin only)
    """

    permission_classes = [IsAuthenticated, IsAdminOrStaffOrReadOnly]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    @extend_schema(tags=["Products"], summary="List products with filters")
    def get(self, request):
        qs = Product.objects.select_related("category").order_by("-created_at")

        # Apply filters
        filterset = ProductFilter(request.query_params, queryset=qs)
        if not filterset.is_valid():
            return error_response("Invalid filter parameters.", errors=filterset.errors)
        qs = filterset.qs

        # Search (name, brand, model, sku)
        search = request.query_params.get("search")
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(brand__icontains=search)
                | Q(model__icontains=search)
                | Q(sku__icontains=search)
            )

        # Pagination
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = ProductListSerializer(page, many=True, context={"request": request})
        return success_response(
            data={
                "count": paginator.page.paginator.count,
                "next": paginator.get_next_link(),
                "previous": paginator.get_previous_link(),
                "results": serializer.data,
            },
            message="Products retrieved.",
        )

    @extend_schema(tags=["Products"], request=ProductWriteSerializer, summary="Create product")
    def post(self, request):
        if request.user.role != "ADMIN":
            return error_response("Only admins can create products.", status=403)
        serializer = ProductWriteSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.save()
            # Auto-create inventory record
            from apps.inventory.models import Inventory
            Inventory.objects.get_or_create(product=product, defaults={"low_stock_threshold": 5})
            return created_response(
                data=ProductDetailSerializer(product, context={"request": request}).data,
                message="Product created.",
            )
        return error_response("Validation failed.", errors=serializer.errors)


class ProductDetailView(APIView):
    """
    GET    /api/products/{id}/
    PATCH  /api/products/{id}/
    DELETE /api/products/{id}/
    """

    permission_classes = [IsAuthenticated, IsAdminOrStaffOrReadOnly]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def _get_object(self, pk):
        return get_object_or_404(Product, pk=pk)

    @extend_schema(tags=["Products"], summary="Retrieve product")
    def get(self, request, pk):
        product = self._get_object(pk)
        serializer = ProductDetailSerializer(product, context={"request": request})
        return success_response(data=serializer.data)

    @extend_schema(tags=["Products"], request=ProductWriteSerializer, summary="Update product")
    def patch(self, request, pk):
        if request.user.role != "ADMIN":
            return error_response("Only admins can update products.", status=403)
        product = self._get_object(pk)
        serializer = ProductWriteSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return success_response(
                data=ProductDetailSerializer(product, context={"request": request}).data,
                message="Product updated.",
            )
        return error_response("Validation failed.", errors=serializer.errors)

    @extend_schema(tags=["Products"], summary="Delete product")
    def delete(self, request, pk):
        if request.user.role != "ADMIN":
            return error_response("Only admins can delete products.", status=403)
        product = self._get_object(pk)
        product.status = Product.Status.INACTIVE
        product.save(update_fields=["status", "updated_at"])
        return success_response(message="Product deactivated.")
