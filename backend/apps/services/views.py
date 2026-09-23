"""
Views for Services and ServiceRequests.
"""
from drf_spectacular.utils import extend_schema
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.pagination import StandardResultsPagination
from core.permissions import IsAdminOrStaff, IsAdminOrStaffOrReadOnly
from core.responses import created_response, error_response, success_response

from apps.inventory.services import InsufficientStockError

from .models import Service, ServiceRequest
from .serializers import (
    ServiceRequestCreateSerializer,
    ServiceRequestDetailSerializer,
    ServiceRequestListSerializer,
    ServiceSerializer,
    ServiceStatusHistorySerializer,
    ServiceStatusUpdateSerializer,
)
from .services import create_service_request, update_service_status


# ──────────────────────────────────────────────────────────────────────────────
# Service catalogue
# ──────────────────────────────────────────────────────────────────────────────

class ServiceListCreateView(APIView):
    """
    GET  /api/services/  — list active services (all authenticated users)
    POST /api/services/  — create service (admin only)
    """

    permission_classes = [IsAuthenticated, IsAdminOrStaffOrReadOnly]

    @extend_schema(tags=["Services"], summary="List services")
    def get(self, request):
        qs = Service.objects.order_by("name")
        if request.user.role not in ("ADMIN", "STAFF"):
            qs = qs.filter(status="ACTIVE")
        serializer = ServiceSerializer(qs, many=True)
        return success_response(data=serializer.data, message="Services retrieved.")

    @extend_schema(tags=["Services"], request=ServiceSerializer, summary="Create service")
    def post(self, request):
        if request.user.role != "ADMIN":
            return error_response("Only admins can create services.", status=403)
        serializer = ServiceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return created_response(data=serializer.data, message="Service created.")
        return error_response("Validation failed.", errors=serializer.errors)


class ServiceDetailView(APIView):
    """
    GET    /api/services/{id}/
    PATCH  /api/services/{id}/
    DELETE /api/services/{id}/
    """

    permission_classes = [IsAuthenticated, IsAdminOrStaffOrReadOnly]

    def _get_object(self, pk):
        return get_object_or_404(Service, pk=pk)

    @extend_schema(tags=["Services"], summary="Retrieve service")
    def get(self, request, pk):
        return success_response(data=ServiceSerializer(self._get_object(pk)).data)

    @extend_schema(tags=["Services"], request=ServiceSerializer, summary="Update service")
    def patch(self, request, pk):
        if request.user.role != "ADMIN":
            return error_response("Only admins can update services.", status=403)
        service = self._get_object(pk)
        serializer = ServiceSerializer(service, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return success_response(data=serializer.data, message="Service updated.")
        return error_response("Validation failed.", errors=serializer.errors)

    @extend_schema(tags=["Services"], summary="Delete (deactivate) service")
    def delete(self, request, pk):
        if request.user.role != "ADMIN":
            return error_response("Only admins can delete services.", status=403)
        service = self._get_object(pk)
        service.status = Service.Status.INACTIVE
        service.save(update_fields=["status", "updated_at"])
        return success_response(message="Service deactivated.")


# ──────────────────────────────────────────────────────────────────────────────
# Service requests
# ──────────────────────────────────────────────────────────────────────────────

class ServiceRequestListCreateView(APIView):
    """
    GET  /api/service-requests/  — list requests
    POST /api/service-requests/  — create request (customers only)
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["Service Requests"], summary="List service requests")
    def get(self, request):
        user = request.user
        if user.role in ("ADMIN", "STAFF"):
            qs = ServiceRequest.objects.select_related("customer", "service").order_by("-created_at")
            status_filter = request.query_params.get("status")
            if status_filter:
                qs = qs.filter(status=status_filter.upper())
        else:
            qs = ServiceRequest.objects.filter(customer=user).order_by("-created_at")

        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = ServiceRequestListSerializer(page, many=True)
        return success_response(
            data={
                "count": paginator.page.paginator.count,
                "next": paginator.get_next_link(),
                "previous": paginator.get_previous_link(),
                "results": serializer.data,
            },
            message="Service requests retrieved.",
        )

    @extend_schema(
        tags=["Service Requests"],
        request=ServiceRequestCreateSerializer,
        summary="Create a service request",
    )
    def post(self, request):
        if request.user.role != "CUSTOMER":
            return error_response("Only customers can create service requests.", status=403)

        serializer = ServiceRequestCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Validation failed.", errors=serializer.errors)

        service_request = create_service_request(
            customer=request.user,
            service=serializer.validated_data["service"],
            data=serializer.validated_data,
        )

        return created_response(
            data=ServiceRequestDetailSerializer(service_request).data,
            message=f"Service request created. Ticket: {service_request.ticket_number}",
        )


class ServiceRequestDetailView(APIView):
    """
    GET /api/service-requests/{id}/

    Customers see only their own. Staff/Admin see all.
    """

    permission_classes = [IsAuthenticated]

    def _get_object(self, request, pk):
        user = request.user
        if user.role in ("ADMIN", "STAFF"):
            return get_object_or_404(ServiceRequest, pk=pk)
        return get_object_or_404(ServiceRequest, pk=pk, customer=user)

    @extend_schema(tags=["Service Requests"], summary="Retrieve service request")
    def get(self, request, pk):
        sr = self._get_object(request, pk)
        return success_response(data=ServiceRequestDetailSerializer(sr).data)


class ServiceRequestStatusUpdateView(APIView):
    """
    PATCH /api/service-requests/{id}/status/

    Staff/Admin only. Enforces allowed status transitions.
    """

    permission_classes = [IsAuthenticated, IsAdminOrStaff]

    @extend_schema(
        tags=["Service Requests"],
        request=ServiceStatusUpdateSerializer,
        summary="Update service request status (Staff/Admin)",
    )
    def patch(self, request, pk):
        sr = get_object_or_404(ServiceRequest, pk=pk)
        serializer = ServiceStatusUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Validation failed.", errors=serializer.errors)

        try:
            sr = update_service_status(
                service_request=sr,
                new_status=serializer.validated_data["status"],
                changed_by=request.user,
                note=serializer.validated_data.get("note", ""),
            )
        except ValueError as e:
            return error_response(str(e), status=400)
        except InsufficientStockError as e:
            return error_response(
                "Cannot move to IN_REPAIR: insufficient stock for required parts.",
                errors={"product": f"Only {e.available} unit(s) available."},
                status=400,
            )

        return success_response(
            data=ServiceRequestDetailSerializer(sr).data,
            message=f"Status updated to {sr.status}.",
        )


class ServiceRequestHistoryView(APIView):
    """
    GET /api/service-requests/{id}/history/

    Returns the full status change history for a service request.
    Customers can only view their own requests' history.
    """

    permission_classes = [IsAuthenticated]

    def _get_object(self, request, pk):
        user = request.user
        if user.role in ("ADMIN", "STAFF"):
            return get_object_or_404(ServiceRequest, pk=pk)
        return get_object_or_404(ServiceRequest, pk=pk, customer=user)

    @extend_schema(tags=["Service Requests"], summary="Get service request status history")
    def get(self, request, pk):
        sr = self._get_object(request, pk)
        history = sr.history.select_related("changed_by").order_by("created_at")
        serializer = ServiceStatusHistorySerializer(history, many=True)
        return success_response(
            data=serializer.data,
            message=f"History for {sr.ticket_number}.",
        )
