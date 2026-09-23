"""
Dashboard view — Admin-only summary statistics.
"""
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.permissions import IsAdmin
from core.responses import success_response


class DashboardView(APIView):
    """
    GET /api/dashboard/

    Returns aggregated statistics for the admin dashboard.
    Only accessible to ADMIN users.
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(
        tags=["Dashboard"],
        summary="Admin dashboard statistics",
    )
    def get(self, request):
        from apps.orders.models import Order
        from apps.products.models import Product
        from apps.services.models import ServiceRequest
        from apps.accounts.models import CustomUser, Role

        today = timezone.now().date()

        # ── Aggregate stats ──────────────────────────────────────────────
        total_products = Product.objects.filter(status="ACTIVE").count()

        low_stock_products = Product.objects.filter(
            status="ACTIVE",
            stock_quantity__lte=5,
        ).count()

        total_customers = CustomUser.objects.filter(role=Role.CUSTOMER).count()

        today_orders = Order.objects.filter(created_at__date=today).count()

        pending_orders = Order.objects.filter(order_status="PENDING").count()

        active_service_requests = ServiceRequest.objects.exclude(
            status__in=["COMPLETED", "CANCELLED"]
        ).count()

        completed_services = ServiceRequest.objects.filter(status="COMPLETED").count()

        # ── Recent data ──────────────────────────────────────────────────
        from apps.orders.serializers import OrderListSerializer
        from apps.services.serializers import ServiceRequestListSerializer

        recent_orders = Order.objects.select_related("customer").order_by("-created_at")[:5]
        recent_service_requests = ServiceRequest.objects.select_related(
            "customer", "service"
        ).order_by("-created_at")[:5]

        return success_response(
            data={
                "stats": {
                    "total_products": total_products,
                    "low_stock_products": low_stock_products,
                    "total_customers": total_customers,
                    "today_orders": today_orders,
                    "pending_orders": pending_orders,
                    "active_service_requests": active_service_requests,
                    "completed_services": completed_services,
                },
                "recent_orders": OrderListSerializer(
                    recent_orders, many=True, context={"request": request}
                ).data,
                "recent_service_requests": ServiceRequestListSerializer(
                    recent_service_requests, many=True, context={"request": request}
                ).data,
            },
            message="Dashboard data retrieved.",
        )
