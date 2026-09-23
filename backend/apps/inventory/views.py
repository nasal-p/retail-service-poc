"""
Inventory views — Staff and Admin only.
"""
from drf_spectacular.utils import extend_schema
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.pagination import StandardResultsPagination
from core.permissions import IsAdminOrStaff
from core.responses import error_response, success_response

from .models import Inventory
from .serializers import InventoryAdjustSerializer, InventorySerializer, InventoryTransactionSerializer
from .services import InsufficientStockError, adjust_stock


class InventoryListView(APIView):
    """
    GET /api/inventory/

    List all inventory records. Staff/Admin only.
    Supports ?low_stock=true to filter to items below threshold.
    """

    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    @extend_schema(tags=["Inventory"], summary="List inventory")
    def get(self, request):
        qs = Inventory.objects.select_related("product").order_by("product__name")

        if request.query_params.get("low_stock") == "true":
            from django.db.models import F
            qs = qs.filter(product__stock_quantity__lte=F("low_stock_threshold"))

        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = InventorySerializer(page, many=True)
        return success_response(
            data={
                "count": paginator.page.paginator.count,
                "next": paginator.get_next_link(),
                "previous": paginator.get_previous_link(),
                "results": serializer.data,
            },
            message="Inventory retrieved.",
        )


class InventoryDetailView(APIView):
    """
    GET  /api/inventory/{product_id}/       — view stock details
    POST /api/inventory/{product_id}/adjust/ — manual adjustment (admin only)
    """

    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    def _get_object(self, product_id):
        return get_object_or_404(Inventory, product_id=product_id)

    @extend_schema(tags=["Inventory"], summary="Retrieve inventory for a product")
    def get(self, request, product_id):
        inventory = self._get_object(product_id)
        return success_response(data=InventorySerializer(inventory).data)


class InventoryAdjustView(APIView):
    """
    POST /api/inventory/{product_id}/adjust/

    Manually set the stock quantity (Admin only).
    """

    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    @extend_schema(
        tags=["Inventory"],
        request=InventoryAdjustSerializer,
        summary="Manually adjust product stock",
    )
    def post(self, request, product_id):
        if request.user.role != "ADMIN":
            return error_response("Only admins can make manual adjustments.", status=403)

        inventory = get_object_or_404(Inventory, product_id=product_id)
        serializer = InventoryAdjustSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Validation failed.", errors=serializer.errors)

        try:
            product = adjust_stock(
                product_id=product_id,
                new_quantity=serializer.validated_data["new_quantity"],
                note=serializer.validated_data.get("note", ""),
                user=request.user,
            )
        except Exception as e:
            return error_response(str(e), status=500)

        inventory.refresh_from_db()
        return success_response(
            data=InventorySerializer(inventory).data,
            message=f"Stock adjusted to {product.stock_quantity}.",
        )


class InventoryTransactionsView(APIView):
    """
    GET /api/inventory/{product_id}/transactions/

    View the transaction history for a product's inventory.
    """

    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    @extend_schema(tags=["Inventory"], summary="List inventory transactions for a product")
    def get(self, request, product_id):
        inventory = get_object_or_404(Inventory, product_id=product_id)
        qs = inventory.transactions.order_by("-created_at")
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = InventoryTransactionSerializer(page, many=True)
        return success_response(
            data={
                "count": paginator.page.paginator.count,
                "results": serializer.data,
            },
            message="Transactions retrieved.",
        )
