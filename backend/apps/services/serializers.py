"""
Serializers for Service and ServiceRequest.
"""
from rest_framework import serializers

from .models import RequestStatus, Service, ServiceRequest, ServiceStatusHistory


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = [
            "id", "name", "description", "estimated_price",
            "estimated_duration", "status", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ServiceStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source="changed_by.full_name", read_only=True)

    class Meta:
        model = ServiceStatusHistory
        fields = ["id", "old_status", "new_status", "changed_by", "changed_by_name", "note", "created_at"]
        read_only_fields = fields


class ServiceRequestListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    service_name = serializers.CharField(source="service.name", read_only=True)

    class Meta:
        model = ServiceRequest
        fields = [
            "id", "ticket_number", "customer", "customer_name",
            "service", "service_name", "device_brand", "device_model",
            "status", "created_at",
        ]
        read_only_fields = fields


class ServiceRequestDetailSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    service_name = serializers.CharField(source="service.name", read_only=True)
    history = ServiceStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = ServiceRequest
        fields = [
            "id", "ticket_number", "customer", "customer_name",
            "service", "service_name",
            "device_brand", "device_model", "serial_number",
            "problem_description", "preferred_date", "preferred_time",
            "estimated_price", "status", "history", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "ticket_number", "customer", "customer_name", "status", "history", "created_at", "updated_at"]


class ServiceRequestCreateSerializer(serializers.Serializer):
    """Request body for creating a service request."""

    service = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.filter(status="ACTIVE")
    )
    device_brand = serializers.CharField(max_length=100)
    device_model = serializers.CharField(max_length=100)
    serial_number = serializers.CharField(max_length=100, required=False, default="")
    problem_description = serializers.CharField()
    preferred_date = serializers.DateField()
    preferred_time = serializers.TimeField()
    estimated_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True
    )


class ServiceStatusUpdateSerializer(serializers.Serializer):
    """Request body for PATCH /api/service-requests/{id}/status/"""

    status = serializers.ChoiceField(choices=RequestStatus.choices)
    note = serializers.CharField(required=False, default="", allow_blank=True)
