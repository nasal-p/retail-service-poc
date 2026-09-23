"""
URL routes for the dashboard (admin-only).
"""
from django.urls import path

from .dashboard import DashboardView

urlpatterns = [
    path("", DashboardView.as_view(), name="dashboard"),
]
