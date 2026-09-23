"""
Service request business logic.
"""
from django.db import transaction

from apps.inventory.services import InsufficientStockError, reserve_stock
from apps.orders.services import generate_ticket_number

from .models import RequestStatus, ServiceRequest, ServiceRequiredPart, ServiceStatusHistory


# Valid forward transitions
ALLOWED_TRANSITIONS = {
    RequestStatus.RECEIVED: [
        RequestStatus.DIAGNOSING,
        RequestStatus.CANCELLED,
    ],
    RequestStatus.DIAGNOSING: [
        RequestStatus.WAITING_FOR_PARTS,
        RequestStatus.IN_REPAIR,
        RequestStatus.CANCELLED,
    ],
    RequestStatus.WAITING_FOR_PARTS: [
        RequestStatus.IN_REPAIR,
        RequestStatus.CANCELLED,
    ],
    RequestStatus.IN_REPAIR: [
        RequestStatus.READY_FOR_COLLECTION,
        RequestStatus.CANCELLED,
    ],
    RequestStatus.READY_FOR_COLLECTION: [
        RequestStatus.COMPLETED,
    ],
    RequestStatus.COMPLETED: [],
    RequestStatus.CANCELLED: [],
}


def validate_transition(current_status, new_status):
    """
    Raise ValueError if the transition is not allowed.
    """
    allowed = ALLOWED_TRANSITIONS.get(current_status, [])
    if new_status not in allowed:
        raise ValueError(
            f"Cannot transition from {current_status} to {new_status}. "
            f"Allowed: {allowed or ['none (terminal state)']}"
        )


@transaction.atomic
def create_service_request(customer, service, data):
    """
    Create a new ServiceRequest with auto-generated ticket number.
    Initial status is always RECEIVED.
    """
    ticket_number = generate_ticket_number()

    sr = ServiceRequest.objects.create(
        ticket_number=ticket_number,
        customer=customer,
        service=service,
        device_brand=data["device_brand"],
        device_model=data["device_model"],
        serial_number=data.get("serial_number", ""),
        problem_description=data["problem_description"],
        preferred_date=data["preferred_date"],
        preferred_time=data["preferred_time"],
        estimated_price=data.get("estimated_price"),
        status=RequestStatus.RECEIVED,
    )

    # Record initial history
    ServiceStatusHistory.objects.create(
        service_request=sr,
        old_status="",
        new_status=RequestStatus.RECEIVED,
        changed_by=customer,
        note="Service request created.",
    )

    return sr


@transaction.atomic
def update_service_status(service_request, new_status, changed_by, note=""):
    """
    Transition a service request to a new status.

    - Validates the transition is allowed.
    - Records history.
    - Handles part reservation when moving from WAITING_FOR_PARTS → IN_REPAIR.
    """
    validate_transition(service_request.status, new_status)

    old_status = service_request.status

    # If moving to IN_REPAIR, attempt to reserve any required parts
    if new_status == RequestStatus.IN_REPAIR:
        _reserve_required_parts(service_request, changed_by)

    service_request.status = new_status
    service_request.save(update_fields=["status", "updated_at"])

    ServiceStatusHistory.objects.create(
        service_request=service_request,
        old_status=old_status,
        new_status=new_status,
        changed_by=changed_by,
        note=note,
    )

    return service_request


def _reserve_required_parts(service_request, user):
    """
    Reserve stock for all PENDING required parts.
    If any part is out of stock, raise InsufficientStockError.
    """
    pending_parts = ServiceRequiredPart.objects.filter(
        service_request=service_request,
        status=ServiceRequiredPart.PartStatus.PENDING,
    ).select_related("product")

    for part in pending_parts:
        reserve_stock(
            product_id=part.product.id,
            quantity=part.quantity,
            note=f"Reserved for service {service_request.ticket_number}",
            user=user,
        )
        part.status = ServiceRequiredPart.PartStatus.RESERVED
        part.save(update_fields=["status"])
