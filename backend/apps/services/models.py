"""
Service and ServiceRequest models.
"""
import uuid

from django.conf import settings
from django.db import models


class Service(models.Model):
    """
    A repair/maintenance service offered by the shop.
    e.g. Screen Replacement, Battery Replacement, Device Diagnostics.
    """

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"

    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    estimated_price = models.DecimalField(max_digits=10, decimal_places=2)
    estimated_duration = models.CharField(
        max_length=100,
        help_text='Human-readable duration, e.g. "2-3 hours" or "1 business day".',
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "services"
        ordering = ["name"]

    def __str__(self):
        return self.name


class RequestStatus(models.TextChoices):
    RECEIVED = "RECEIVED", "Received"
    DIAGNOSING = "DIAGNOSING", "Diagnosing"
    WAITING_FOR_PARTS = "WAITING_FOR_PARTS", "Waiting for Parts"
    IN_REPAIR = "IN_REPAIR", "In Repair"
    READY_FOR_COLLECTION = "READY_FOR_COLLECTION", "Ready for Collection"
    COMPLETED = "COMPLETED", "Completed"
    CANCELLED = "CANCELLED", "Cancelled"


class ServiceRequest(models.Model):
    """
    A customer's service/repair booking.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_number = models.CharField(max_length=20, unique=True, db_index=True)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="service_requests",
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.PROTECT,
        related_name="requests",
    )
    device_brand = models.CharField(max_length=100)
    device_model = models.CharField(max_length=100)
    serial_number = models.CharField(max_length=100, blank=True)
    problem_description = models.TextField()
    preferred_date = models.DateField()
    preferred_time = models.TimeField()
    estimated_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Actual estimated price set by staff after diagnosis.",
    )
    status = models.CharField(
        max_length=30,
        choices=RequestStatus.choices,
        default=RequestStatus.RECEIVED,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "service_requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.ticket_number} — {self.service.name}"


class ServiceStatusHistory(models.Model):
    """
    Immutable audit record of every service request status change.
    """

    service_request = models.ForeignKey(
        ServiceRequest,
        on_delete=models.CASCADE,
        related_name="history",
    )
    old_status = models.CharField(max_length=30, choices=RequestStatus.choices, blank=True)
    new_status = models.CharField(max_length=30, choices=RequestStatus.choices)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="service_status_changes",
    )
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "service_status_history"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.service_request.ticket_number}: {self.old_status} → {self.new_status}"


class ServiceRequiredPart(models.Model):
    """
    A product (spare part) required to complete a service request.
    """

    class PartStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        RESERVED = "RESERVED", "Reserved"
        USED = "USED", "Used"

    service_request = models.ForeignKey(
        ServiceRequest,
        on_delete=models.CASCADE,
        related_name="required_parts",
    )
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.PROTECT,
        related_name="service_parts",
    )
    quantity = models.PositiveIntegerField(default=1)
    status = models.CharField(
        max_length=20,
        choices=PartStatus.choices,
        default=PartStatus.PENDING,
        db_index=True,
    )

    class Meta:
        db_table = "service_required_parts"
        unique_together = ("service_request", "product")

    def __str__(self):
        return f"{self.quantity}× {self.product.name} for {self.service_request.ticket_number}"
