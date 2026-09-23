"""
Inventory business logic.

All stock mutations go through this service layer so that:
  1. The Product row is locked via SELECT FOR UPDATE.
  2. An InventoryTransaction audit record is always created.
  3. Stock never goes negative.
"""
from django.db import transaction

from apps.products.models import Product

from .models import Inventory, InventoryTransaction, TransactionType


class InsufficientStockError(Exception):
    """Raised when there is not enough stock to fulfill a request."""

    def __init__(self, product_id, requested, available):
        self.product_id = product_id
        self.requested = requested
        self.available = available
        super().__init__(
            f"Insufficient stock for product {product_id}. "
            f"Requested: {requested}, Available: {available}."
        )


@transaction.atomic
def reserve_stock(product_id, quantity, note="", user=None):
    """
    Deduct `quantity` units from a product's stock.

    Uses SELECT FOR UPDATE to prevent race conditions.
    Raises InsufficientStockError if stock would go negative.
    Creates an InventoryTransaction record.

    Returns the updated Product instance.
    """
    product = Product.objects.select_for_update().get(pk=product_id)

    if product.stock_quantity < quantity:
        raise InsufficientStockError(
            product_id=product_id,
            requested=quantity,
            available=product.stock_quantity,
        )

    product.stock_quantity -= quantity
    product.save(update_fields=["stock_quantity", "updated_at"])

    inventory, _ = Inventory.objects.get_or_create(
        product=product,
        defaults={"low_stock_threshold": 5},
    )
    InventoryTransaction.objects.create(
        inventory=inventory,
        transaction_type=TransactionType.OUT,
        quantity=-quantity,
        note=note or f"Reserved {quantity} unit(s)",
        created_by=user,
    )

    return product


@transaction.atomic
def release_stock(product_id, quantity, note="", user=None):
    """
    Add `quantity` units back to a product's stock (e.g., order cancellation).
    """
    product = Product.objects.select_for_update().get(pk=product_id)
    product.stock_quantity += quantity
    product.save(update_fields=["stock_quantity", "updated_at"])

    inventory, _ = Inventory.objects.get_or_create(
        product=product,
        defaults={"low_stock_threshold": 5},
    )
    InventoryTransaction.objects.create(
        inventory=inventory,
        transaction_type=TransactionType.IN,
        quantity=quantity,
        note=note or f"Released {quantity} unit(s)",
        created_by=user,
    )

    return product


@transaction.atomic
def adjust_stock(product_id, new_quantity, note="", user=None):
    """
    Set absolute stock level (manual admin adjustment).
    """
    product = Product.objects.select_for_update().get(pk=product_id)
    delta = new_quantity - product.stock_quantity
    product.stock_quantity = new_quantity
    product.save(update_fields=["stock_quantity", "updated_at"])

    inventory, _ = Inventory.objects.get_or_create(
        product=product,
        defaults={"low_stock_threshold": 5},
    )
    InventoryTransaction.objects.create(
        inventory=inventory,
        transaction_type=TransactionType.ADJUSTMENT,
        quantity=delta,
        note=note or f"Manual adjustment to {new_quantity}",
        created_by=user,
    )

    return product
