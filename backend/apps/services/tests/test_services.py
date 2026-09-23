"""
Tests for Services catalogue and ServiceRequest endpoints.
"""
from decimal import Decimal

from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import CustomUser, Role
from apps.services.models import RequestStatus, Service, ServiceRequest


class ServicesTestCase(APITestCase):
    def setUp(self):
        self.admin = CustomUser.objects.create_user(
            email="service_admin@example.com",
            password="Password123!",
            role=Role.ADMIN,
            full_name="Service Admin",
            phone="+971500000003",
        )
        self.customer = CustomUser.objects.create_user(
            email="service_customer@example.com",
            password="Password123!",
            role=Role.CUSTOMER,
            full_name="Service Customer",
            phone="+971500000004",
        )
        self.staff = CustomUser.objects.create_user(
            email="service_staff@example.com",
            password="Password123!",
            role=Role.STAFF,
            full_name="Service Staff",
            phone="+971500000005",
        )

        self.service = Service.objects.create(
            name="Screen Replacement",
            description="Replace cracked screen for smartphone",
            estimated_price=Decimal("150.00"),
            estimated_duration="1-2 hours",
            status="ACTIVE",
        )

    def test_service_catalogue_access(self):
        # Public / authenticated user can view services
        self.client.force_authenticate(user=self.customer)
        res = self.client.get("/api/services/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["data"]), 1)

        # Customer cannot create a service
        create_res = self.client.post(
            "/api/services/",
            {
                "name": "Battery Replacement",
                "estimated_price": "80.00",
                "estimated_duration": "30 mins",
            },
            format="json",
        )
        self.assertEqual(create_res.status_code, status.HTTP_403_FORBIDDEN)

        # Admin can create a service
        self.client.force_authenticate(user=self.admin)
        admin_create_res = self.client.post(
            "/api/services/",
            {
                "name": "Battery Replacement",
                "description": "New battery installation",
                "estimated_price": "80.00",
                "estimated_duration": "30 mins",
            },
            format="json",
        )
        self.assertEqual(admin_create_res.status_code, status.HTTP_201_CREATED)

    def test_service_request_lifecycle(self):
        # Customer creates a service request
        self.client.force_authenticate(user=self.customer)
        create_req_res = self.client.post(
            "/api/service-requests/",
            {
                "service": self.service.id,
                "device_brand": "Apple",
                "device_model": "iPhone 13 Pro",
                "problem_description": "Front screen shattered after drop.",
                "preferred_date": "2026-10-01",
                "preferred_time": "14:00:00",
            },
            format="json",
        )
        self.assertEqual(create_req_res.status_code, status.HTTP_201_CREATED)
        req_id = create_req_res.data["data"]["id"]
        self.assertEqual(create_req_res.data["data"]["status"], RequestStatus.RECEIVED)

        # Staff updates status to DIAGNOSING then IN_REPAIR then COMPLETED
        self.client.force_authenticate(user=self.staff)

        # RECEIVED -> DIAGNOSING
        s1 = self.client.patch(
            f"/api/service-requests/{req_id}/status/",
            {"status": "DIAGNOSING", "note": "Inspecting display connector"},
            format="json",
        )
        self.assertEqual(s1.status_code, status.HTTP_200_OK)
        self.assertEqual(s1.data["data"]["status"], "DIAGNOSING")

        # DIAGNOSING -> IN_REPAIR
        s2 = self.client.patch(
            f"/api/service-requests/{req_id}/status/",
            {"status": "IN_REPAIR", "note": "Installing replacement OEM screen"},
            format="json",
        )
        self.assertEqual(s2.status_code, status.HTTP_200_OK)

        # Check status history
        history_res = self.client.get(f"/api/service-requests/{req_id}/history/")
        self.assertEqual(history_res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(history_res.data["data"]), 2)
