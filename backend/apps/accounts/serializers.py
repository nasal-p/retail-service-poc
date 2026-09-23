"""
Serializers for authentication and user profile.
"""
import re

from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import CustomUser


class RegisterSerializer(serializers.ModelSerializer):
    """
    Handles user registration.

    Validates:
      - Email uniqueness (model-level)
      - Password strength (min 8 chars, at least 1 uppercase, 1 digit, 1 special)
      - Password confirmation match
      - Phone number format
    """

    password = serializers.CharField(write_only=True, min_length=8)
    password_confirmation = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ["full_name", "email", "phone", "password", "password_confirmation"]

    def validate_email(self, value):
        return value.lower().strip()

    def validate_phone(self, value):
        pattern = r"^\+?[1-9]\d{6,14}$"
        if not re.match(pattern, value.replace(" ", "")):
            raise serializers.ValidationError(
                "Enter a valid phone number (e.g. +971500000000)."
            )
        return value

    def validate_password(self, value):
        errors = []
        if len(value) < 8:
            errors.append("Password must be at least 8 characters.")
        if not re.search(r"[A-Z]", value):
            errors.append("Password must contain at least one uppercase letter.")
        if not re.search(r"\d", value):
            errors.append("Password must contain at least one digit.")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", value):
            errors.append("Password must contain at least one special character.")
        if errors:
            raise serializers.ValidationError(errors)
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password_confirmation"):
            raise serializers.ValidationError(
                {"password_confirmation": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data):
        return CustomUser.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    """Validates credentials and returns JWT tokens + user data."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs["email"].lower().strip()
        password = attrs["password"]

        user = authenticate(request=self.context.get("request"), email=email, password=password)
        if not user:
            raise serializers.ValidationError(
                {"non_field_errors": "Invalid email or password."}
            )
        if not user.is_active:
            raise serializers.ValidationError(
                {"non_field_errors": "This account has been deactivated."}
            )

        refresh = RefreshToken.for_user(user)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserProfileSerializer(user).data,
        }


class UserProfileSerializer(serializers.ModelSerializer):
    """Read-only serializer for user profile data."""

    class Meta:
        model = CustomUser
        fields = ["id", "full_name", "email", "phone", "role", "is_active", "created_at", "updated_at"]
        read_only_fields = fields


class UserListSerializer(serializers.ModelSerializer):
    """Admin serializer for listing/managing users."""

    class Meta:
        model = CustomUser
        fields = ["id", "full_name", "email", "phone", "role", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]
