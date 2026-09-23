"""
Checkout and order business logic.

The checkout process is entirely wrapped in a database transaction to ensure:
  - Stock is always reserved atomically.
  - Order numbers are always unique.
  - Partial failures roll back cleanly.
"""
from datetime import datetime

from django.db import transaction

from apps.inventory.services import InsufficientStockError, reserve_stock
from apps.products.models import Product

from .models import Cart, Order, OrderCounter, OrderItem, Payment, PaymentStatus


def _generate_order_number(prefix):
    """
    Generate a unique, human-readable number like ORD-2026-000001.
    Uses a database-level atomic counter (SELECT FOR UPDATE).
    Must be called inside an existing transaction.atomic() block.
    """
    counter, _ = OrderCounter.objects.select_for_update().get_or_create(prefix=prefix)
    counter.count += 1
    counter.save(update_fields=["count"])
    return f"{prefix}-{counter.count:06d}"


def generate_order_number():
    year = datetime.now().year
    return _generate_order_number(f"ORD-{year}")


def generate_ticket_number():
    year = datetime.now().year
    return _generate_order_number(f"SR-{year}")


@transaction.atomic
def checkout(customer, payment_method, notes=""):
    """
    Execute the full checkout flow inside a single database transaction.

    Steps:
      1. Retrieve the customer's active cart.
      2. Validate cart is not empty.
      3. Validate each product (active + sufficient stock).
      4. Calculate totals from DB (never trust client).
      5. Generate unique order number.
      6. Create Order record.
      7. Create OrderItem records.
      8. Reserve (deduct) inventory for each item.
      9. Create Payment record (mocked as PAID for PoC).
      10. Clear the cart.

    Returns the created Order instance.
    Raises ValueError or InsufficientStockError on failure.
    """
    # 1. Get cart
    try:
        cart = Cart.objects.prefetch_related("items__product").get(customer=customer)
    except Cart.DoesNotExist:
        raise ValueError("No active cart found.")

    cart_items = list(cart.items.select_related("product").all())

    # 2. Validate not empty
    if not cart_items:
        raise ValueError("Cart is empty. Add items before checking out.")

    # 3 & 4. Validate products and calculate totals
    validated_items = []
    total_amount = 0

    for item in cart_items:
        product = item.product

        if product.status != "ACTIVE":
            raise ValueError(f"Product '{product.name}' is no longer available.")

        if product.stock_quantity < item.quantity:
            raise InsufficientStockError(
                product_id=product.id,
                requested=item.quantity,
                available=product.stock_quantity,
            )

        subtotal = product.price * item.quantity
        total_amount += subtotal
        validated_items.append((product, item.quantity, product.price))

    # 5. Generate order number
    order_number = generate_order_number()

    # 6. Create Order
    order = Order.objects.create(
        order_number=order_number,
        customer=customer,
        total_amount=total_amount,
        payment_method=payment_method,
        payment_status=PaymentStatus.PAID,  # mocked for PoC
        notes=notes,
    )

    # 7. Create OrderItems + 8. Reserve inventory
    for product, quantity, unit_price in validated_items:
        OrderItem.objects.create(
            order=order,
            product=product,
            quantity=quantity,
            unit_price=unit_price,
        )
        reserve_stock(
            product_id=product.id,
            quantity=quantity,
            note=f"Reserved for order {order_number}",
            user=customer,
        )

    # 9. Create Payment record (mocked)
    Payment.objects.create(
        order=order,
        amount=total_amount,
        method=payment_method,
        status=PaymentStatus.PAID,
        reference=f"MOCK-{order_number}",
    )

  # 10. Clear cart
    cart.items.all().delete()

    return order
 