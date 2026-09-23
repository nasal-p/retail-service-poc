"""
Tests for authentication endpoints.
"""
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import CustomUser, Role


class RegistrationTests(APITestCase):
    """POST /api/auth/register/"""

    url = "/api/auth/register/"

    def _payload(self, **overrides):
        data = {
            "full_name": "Test User",
            "email": "test@example.com",
            "phone": "+971500000001",
            "password": "Password123!",
            "password_confirmation": "Password123!",
        }
        data.update(overrides)
        return data

    def test_successful_registration(self):
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertEqual(CustomUser.objects.filter(email="test@example.com").count(), 1)

    def test_default_role_is_customer(self):
        self.client.post(self.url, self._payload(), format="json")
        user = CustomUser.objects.get(email="test@example.com")
        self.assertEqual(user.role, Role.CUSTOMER)

    def test_duplicate_email_rejected(self):
        CustomUser.objects.create_user(email="test@example.com", password="pass", full_name="Existing")
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])

    def test_password_mismatch_rejected(self):
        response = self.client.post(
            self.url,
            self._payload(password_confirmation="WrongPass!"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_phone_rejected(self):
        response = self.client.post(
            self.url,
            self._payload(phone="not-a-phone"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_weak_password_rejected(self):
        response = self.client.post(
            self.url,
            self._payload(password="weak", password_confirmation="weak"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginTests(APITestCase):
    """POST /api/auth/login/"""

    url = "/api/auth/login/"

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="login@example.com",
            password="Password123!",
            full_name="Login User",
            phone="+971500000002",
        )

    def test_successful_login_returns_tokens(self):
        response = self.client.post(
            self.url,
            {"email": "login@example.com", "password": "Password123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data["data"])
        self.assertIn("refresh", response.data["data"])
        self.assertIn("user", response.data["data"])

    def test_wrong_password_rejected(self):
        response = self.client.post(
            self.url,
            {"email": "login@example.com", "password": "wrong"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data["success"])

    def test_nonexistent_email_rejected(self):
        response = self.client.post(
            self.url,
            {"email": "nobody@example.com", "password": "Password123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_inactive_user_rejected(self):
        self.user.is_active = False
        self.user.save()
        response = self.client.post(
            self.url,
            {"email": "login@example.com", "password": "Password123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class MeEndpointTests(APITestCase):
    """GET /api/auth/me/"""

    url = "/api/auth/me/"

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="me@example.com",
            password="Password123!",
            full_name="Me User",
            phone="+971500000003",
        )

    def test_authenticated_user_can_view_profile(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["email"], "me@example.com")

    def test_unauthenticated_user_is_rejected(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
