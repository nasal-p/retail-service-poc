"""
Custom User model — email-based auth with role support.
"""
import uuid

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models

from .managers import CustomUserManager


class Role(models.TextChoices):
    CUSTOMER = "CUSTOMER", "Customer"
    STAFF = "STAFF", "Staff"
    ADMIN = "ADMIN", "Admin"


class CustomUser(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model that uses email (not username) as the unique identifier.

    Roles:
      CUSTOMER — can browse, cart, checkout, and book services.
      STAFF    — can manage orders and service requests.
      ADMIN    — full access including user management and dashboard.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True, db_index=True)
    phone = models.CharField(max_length=20)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)
    is_active = models.BooleanField(default=True)
    # is_staff is required by Django admin; we map it to ADMIN/STAFF roles
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    objects = CustomUserManager()

    class Meta:
        db_table = "users"
        ordering = ["-created_at"]
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return f"{self.full_name} <{self.email}>"

    @property
    def is_admin(self):
        return self.role == Role.ADMIN

    @property
    def is_customer(self):
        return self.role == Role.CUSTOMER
