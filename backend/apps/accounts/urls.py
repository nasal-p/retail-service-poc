"""
URL routes for the accounts app.
"""
from django.urls import path

from .views import LoginView, MeView, RefreshView, RegisterView, UserDetailView, UserListView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("refresh/", RefreshView.as_view(), name="auth-refresh"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("users/", UserListView.as_view(), name="auth-user-list"),
    path("users/<uuid:pk>/", UserDetailView.as_view(), name="auth-user-detail"),
]
