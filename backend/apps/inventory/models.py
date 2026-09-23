"""
Inventory models — extend Product with low-stock threshold and transaction log.
"""
from django.conf import settings
from django.db import models

from apps.products.models import Product


class Inventory(models.Model):
    """
    One-to-one extension of Product that stores inventory configuration.
    The authoritative stock count lives on Product.stock_quantity.
    """

    product = models.OneToOneField(
        Product,
        on_delete=models.CASCADE,
        related_name="inventory",
        primary_key=True,
    )
    low_stock_threshold = models.PositiveIntegerField(
        default=5,
        help_text="Alert when stock falls to or below this level.",
    )
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "inventory"
        verbose_name = "Inventory"
        verbose_name_plural = "Inventories"

    def __str__(self):
        return f"Inventory for {self.product.name}"

    @property
    def is_low_stock(self):
        return self.product.stock_quantity <= self.low_stock_threshold


class TransactionType(models.TextChoices):
    IN = "IN", "Stock In"
    OUT = "OUT", "Stock Out"
    ADJUSTMENT = "ADJUSTMENT", "Manual Adjustment"


class InventoryTransaction(models.Model):
    """
    Audit log of every stock movement.
    """

    inventory = models.ForeignKey(
        Inventory,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices, db_index=True)
    quantity = models.IntegerField(help_text="Positive = stock added, negative = stock removed.")
    note = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inventory_transactions",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "inventory_transactions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.transaction_type} {self.quantity} × {self.inventory.product.name}"
