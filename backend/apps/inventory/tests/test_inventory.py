"""
Tests for Inventory management endpoints.
"""
from decimal import Decimal

from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import CustomUser, Role
from apps.inventory.models import Inventory
from apps.products.models import Category, Product


class InventoryTestCase(APITestCase):
    def setUp(self):
        self.admin = CustomUser.objects.create_user(
            email="inv_admin@example.com",
            password="Password123!",
            role=Role.ADMIN,
            full_name="Inv Admin",
            phone="+971500000006",
        )
        self.staff = CustomUser.objects.create_user(
            email="inv_staff@example.com",
            password="Password123!",
            role=Role.STAFF,
            full_name="Inv Staff",
            phone="+971500000007",
        )
        self.customer = CustomUser.objects.create_user(
            email="inv_customer@example.com",
            password="Password123!",
            role=Role.CUSTOMER,
            full_name="Inv Customer",
            phone="+971500000008",
        )

        self.category = Category.objects.create(name="Accessories")
        self.product = Product.objects.create(
            name="USB-C Cable",
            sku="USBC-001",
            category=self.category,
            price=Decimal("19.99"),
            cost_price=Decimal("10.00"),
            stock_quantity=3,
            status="ACTIVE",
        )
        self.inventory = Inventory.objects.create(
            product=self.product, low_stock_threshold=5
        )

    def test_inventory_listing_and_permissions(self):
        # Customer cannot list inventory
        self.client.force_authenticate(user=self.customer)
        res = self.client.get("/api/inventory/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # Staff can list inventory
        self.client.force_authenticate(user=self.staff)
        res = self.client.get("/api/inventory/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["data"]["results"]), 1)

        # Filter low stock
        low_stock_res = self.client.get("/api/inventory/?low_stock=true")
        self.assertEqual(low_stock_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(low_stock_res.data["data"]["results"]), 1)

    def test_stock_adjustment_and_transactions(self):
        # Staff cannot perform manual stock adjustment (Admin only)
        self.client.force_authenticate(user=self.staff)
        adj_res = self.client.post(
            f"/api/inventory/{self.product.id}/adjust/",
            {"new_quantity": 20, "note": "Received stock shipment"},
            format="json",
        )
        self.assertEqual(adj_res.status_code, status.HTTP_403_FORBIDDEN)

        # Admin can adjust stock
        self.client.force_authenticate(user=self.admin)
        adj_res = self.client.post(
            f"/api/inventory/{self.product.id}/adjust/",
            {"new_quantity": 20, "note": "Received stock shipment"},
            format="json",
        )
        self.assertEqual(adj_res.status_code, status.HTTP_200_OK)

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 20)

        # Check transaction history
        tx_res = self.client.get(f"/api/inventory/{self.product.id}/transactions/")
        self.assertEqual(tx_res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(tx_res.data["data"]["results"]), 1)
