"""
Tests for product and category endpoints.
"""
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import CustomUser, Role
from apps.products.models import Category, Product


def make_user(email, role=Role.CUSTOMER, password="Password123!"):
    return CustomUser.objects.create_user(
        email=email, password=password, full_name="Test", phone="+971500000001", role=role
    )


def make_category(name="Smartphones"):
    return Category.objects.create(name=name, description="Test category")


def make_product(category, sku="SKU-001", price="999.00", stock=10):
    return Product.objects.create(
        name="iPhone 15",
        brand="Apple",
        model="15",
        sku=sku,
        category=category,
        price=price,
        cost_price="800.00",
        stock_quantity=stock,
    )


class CategoryTests(APITestCase):
    def setUp(self):
        self.admin = make_user("admin@test.com", Role.ADMIN)
        self.customer = make_user("cust@test.com", Role.CUSTOMER)
        self.category = make_category()

    def test_customer_can_list_categories(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.get("/api/categories/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

    def test_admin_can_create_category(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            "/api/categories/",
            {"name": "Tablets", "description": "All tablets"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_customer_cannot_create_category(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.post(
            "/api/categories/",
            {"name": "Tablets"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_list(self):
        response = self.client.get("/api/categories/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ProductListTests(APITestCase):
    def setUp(self):
        self.admin = make_user("admin@test.com", Role.ADMIN)
        self.customer = make_user("cust@test.com", Role.CUSTOMER)
        self.category = make_category()
        self.product = make_product(self.category, sku="SKU-001")

    def test_authenticated_can_list_products(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.get("/api/products/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data["data"]["count"], 0)

    def test_search_by_name(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.get("/api/products/?search=iPhone")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data["data"]["count"], 0)

    def test_search_no_match(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.get("/api/products/?search=zzznomatch")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["count"], 0)

    def test_filter_by_category(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.get(f"/api/products/?category={self.category.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data["data"]["count"], 0)

    def test_filter_in_stock(self):
        self.client.force_authenticate(user=self.customer)
        # Create out-of-stock product
        make_product(self.category, sku="SKU-002", stock=0)
        response = self.client.get("/api/products/?in_stock=true")
        data = response.data["data"]
        # All results should have stock > 0
        for result in data["results"]:
            self.assertTrue(result["in_stock"])


class ProductCreateTests(APITestCase):
    def setUp(self):
        self.admin = make_user("admin@test.com", Role.ADMIN)
        self.customer = make_user("cust@test.com", Role.CUSTOMER)
        self.category = make_category()

    def test_admin_can_create_product(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            "/api/products/",
            {
                "name": "Samsung S24",
                "brand": "Samsung",
                "model": "S24",
                "sku": "SAM-S24-001",
                "category": self.category.id,
                "description": "Flagship phone",
                "price": "999.00",
                "cost_price": "700.00",
                "stock_quantity": 20,
                "status": "ACTIVE",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.filter(sku="SAM-S24-001").count(), 1)

    def test_customer_cannot_create_product(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.post(
            "/api/products/",
            {"name": "Test", "sku": "TEST-001"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_duplicate_sku_rejected(self):
        make_product(self.category, sku="DUP-001")
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            "/api/products/",
            {
                "name": "Another",
                "brand": "Brand",
                "model": "X",
                "sku": "DUP-001",
                "category": self.category.id,
                "price": "100.00",
                "cost_price": "80.00",
                "stock_quantity": 5,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
