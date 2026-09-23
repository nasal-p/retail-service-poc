"""
Custom DRF permission classes for role-based access control.
"""
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Only users with ADMIN role may access."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


class IsStaff(BasePermission):
    """Only users with STAFF role may access."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "STAFF"
        )


class IsCustomer(BasePermission):
    """Only users with CUSTOMER role may access."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "CUSTOMER"
        )


class IsAdminOrStaff(BasePermission):
    """Users with ADMIN or STAFF role may access."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ("ADMIN", "STAFF")
        )


class IsAdminOrStaffOrReadOnly(BasePermission):
    """
    ADMIN/STAFF can do anything.
    Authenticated customers can use safe methods (GET, HEAD, OPTIONS).
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return request.user.role in ("ADMIN", "STAFF")


class IsOwnerOrAdminOrStaff(BasePermission):
    """
    Object-level: owner, ADMIN, or STAFF may access.
    Override `get_owner` on the view or attach `customer` / `user` attr to obj.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.role in ("ADMIN", "STAFF"):
            return True
        # Support objects with either 'customer' or 'user' FK
        owner = getattr(obj, "customer", None) or getattr(obj, "user", None)
        return owner == request.user
