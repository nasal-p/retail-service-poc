"""
Tests for Cart, Checkout, and Order endpoints.
"""
from decimal import Decimal

from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import CustomUser, Role
from apps.inventory.models import Inventory
from apps.orders.models import Cart, CartItem, Order, OrderStatus
from apps.products.models import Category, Product


class OrdersAndCartTestCase(APITestCase):
    def setUp(self):
        # Create users
        self.customer = CustomUser.objects.create_user(
            email="customer@example.com",
            password="Password123!",
            role=Role.CUSTOMER,
            full_name="Customer User",
            phone="+971500000001",
        )
        self.customer2 = CustomUser.objects.create_user(
            email="customer2@example.com",
            password="Password123!",
            role=Role.CUSTOMER,
            full_name="Customer2 User2",
            phone="+971500000002",
        )
        self.staff = CustomUser.objects.create_user(
            email="staff@example.com",
            password="Password123!",
            role=Role.STAFF,
            full_name="Staff User",
            phone="+971500000003",
        )

        # Create category & product with inventory
        self.category = Category.objects.create(name="Smartphones")
        self.product = Product.objects.create(
            name="iPhone 15",
            sku="IPH15-128",
            category=self.category,
            price=Decimal("999.99"),
            cost_price=Decimal("700.00"),
            stock_quantity=10,
            status="ACTIVE",
        )
        Inventory.objects.create(product=self.product, low_stock_threshold=2)

    def test_cart_operations(self):
        self.client.force_authenticate(user=self.customer)

        # 1. Get empty cart
        res = self.client.get("/api/cart/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["data"]["items"], [])

        # 2. Add item to cart
        add_res = self.client.post(
            "/api/cart/items/",
            {"product_id": self.product.id, "quantity": 2},
            format="json",
        )
        self.assertEqual(add_res.status_code, status.HTTP_201_CREATED)
        item_id = add_res.data["data"]["items"][0]["id"]

        # 3. Update quantity
        patch_res = self.client.patch(
            f"/api/cart/items/{item_id}/",
            {"quantity": 5},
            format="json",
        )
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data["data"]["items"][0]["quantity"], 5)

        # 4. Remove item
        del_res = self.client.delete(f"/api/cart/items/{item_id}/")
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(del_res.data["data"]["items"]), 0)

        # 5. Clear cart
        self.client.post(
            "/api/cart/items/",
            {"product_id": self.product.id, "quantity": 1},
            format="json",
        )
        clear_res = self.client.delete("/api/cart/clear/")
        self.assertEqual(clear_res.status_code, status.HTTP_200_OK)

    def test_checkout_flow(self):
        self.client.force_authenticate(user=self.customer)

        # Add item to cart
        self.client.post(
            "/api/cart/items/",
            {"product_id": self.product.id, "quantity": 2},
            format="json",
        )

        # Perform checkout
        checkout_res = self.client.post(
            "/api/orders/checkout/",
            {"payment_method": "CARD", "notes": "Deliver after 5 PM"},
            format="json",
        )
        self.assertEqual(checkout_res.status_code, status.HTTP_201_CREATED)
        order_data = checkout_res.data["data"]
        self.assertEqual(order_data["order_status"], OrderStatus.PENDING)
        self.assertEqual(Decimal(str(order_data["total_amount"])), Decimal("1999.98"))

        # Verify stock deducted
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 8)

        # Verify cart cleared
        cart_res = self.client.get("/api/cart/")
        self.assertEqual(len(cart_res.data["data"]["items"]), 0)

    def test_order_permissions_and_status_update(self):
        # Customer creates order
        self.client.force_authenticate(user=self.customer)
        self.client.post(
            "/api/cart/items/",
            {"product_id": self.product.id, "quantity": 1},
            format="json",
        )
        checkout_res = self.client.post(
            "/api/orders/checkout/",
            {"payment_method": "CASH"},
            format="json",
        )
        order_id = checkout_res.data["data"]["id"]

        # Customer 2 cannot view customer's order
        self.client.force_authenticate(user=self.customer2)
        res = self.client.get(f"/api/orders/{order_id}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        # Staff can view and update order status
        self.client.force_authenticate(user=self.staff)
        res = self.client.get(f"/api/orders/{order_id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        status_update_res = self.client.patch(
            f"/api/orders/{order_id}/status/",
            {"status": "PROCESSING"},
            format="json",
        )
        self.assertEqual(status_update_res.status_code, status.HTTP_200_OK)
        self.assertEqual(status_update_res.data["data"]["order_status"], "PROCESSING")
