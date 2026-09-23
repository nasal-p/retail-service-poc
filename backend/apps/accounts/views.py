"""
Auth views: register, login, token refresh, and profile.
"""
from drf_spectacular.utils import extend_schema
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView

from core.pagination import StandardResultsPagination
from core.permissions import IsAdmin
from core.responses import created_response, error_response, success_response

from .models import CustomUser
from .serializers import LoginSerializer, RegisterSerializer, UserListSerializer, UserProfileSerializer


class RegisterView(APIView):
    """
    POST /api/auth/register/

    Register a new customer account.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        tags=["Auth"],
        request=RegisterSerializer,
        summary="Register a new customer",
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return created_response(
                data=UserProfileSerializer(user).data,
                message="Registration successful.",
            )
        return error_response(
            message="Registration failed.",
            errors=serializer.errors,
            status=400,
        )


class LoginView(APIView):
    """
    POST /api/auth/login/

    Authenticate and receive JWT access + refresh tokens.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        tags=["Auth"],
        request=LoginSerializer,
        summary="Login and receive JWT tokens",
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            return success_response(
                data=serializer.validated_data,
                message="Login successful.",
            )
        return error_response(
            message="Login failed.",
            errors=serializer.errors,
            status=401,
        )


class MeView(APIView):
    """
    GET /api/auth/me/

    Return the authenticated user's profile.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Auth"],
        summary="Get current user profile",
    )
    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return success_response(
            data=serializer.data,
            message="Profile retrieved.",
        )


class RefreshView(TokenRefreshView):
    """
    POST /api/auth/refresh/

    Refresh the JWT access token using a valid refresh token.
    Wraps SimpleJWT's TokenRefreshView with our standard response envelope.
    """

    @extend_schema(tags=["Auth"], summary="Refresh JWT access token")
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            return success_response(
                data=response.data,
                message="Token refreshed.",
            )
        return error_response(
            message="Token refresh failed.",
            errors=response.data,
            status=response.status_code,
        )


class UserListView(APIView):
    """
    GET /api/auth/users/

    List all users with pagination and search. Admin only.
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(tags=["Auth"], summary="List users (Admin only)")
    def get(self, request):
        qs = CustomUser.objects.all().order_by("-created_at")
        search = request.query_params.get("search")
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(full_name__icontains=search)
                | Q(email__icontains=search)
                | Q(phone__icontains=search)
            )
        role = request.query_params.get("role")
        if role:
            qs = qs.filter(role=role.upper())

        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = UserListSerializer(page, many=True)
        return success_response(
            data={
                "count": paginator.page.paginator.count,
                "next": paginator.get_next_link(),
                "previous": paginator.get_previous_link(),
                "results": serializer.data,
            },
            message="Users retrieved.",
        )


class UserDetailView(APIView):
    """
    PATCH /api/auth/users/{id}/

    Update user role or active status. Admin only.
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(tags=["Auth"], summary="Update user status or role (Admin only)")
    def patch(self, request, pk):
        user = get_object_or_404(CustomUser, pk=pk)
        serializer = UserListSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return success_response(data=serializer.data, message="User updated.")
        return error_response("Validation failed.", errors=serializer.errors)

