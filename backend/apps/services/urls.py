"""
URL routes for the services app.
"""
from django.urls import path

from .views import (
    ServiceDetailView,
    ServiceListCreateView,
    ServiceRequestDetailView,
    ServiceRequestHistoryView,
    ServiceRequestListCreateView,
    ServiceRequestStatusUpdateView,
)

urlpatterns = [
    # Service catalogue
    path("services/", ServiceListCreateView.as_view(), name="service-list"),
    path("services/<int:pk>/", ServiceDetailView.as_view(), name="service-detail"),

    # Service requests
    path("service-requests/", ServiceRequestListCreateView.as_view(), name="service-request-list"),
    path("service-requests/<uuid:pk>/", ServiceRequestDetailView.as_view(), name="service-request-detail"),
    path("service-requests/<uuid:pk>/status/", ServiceRequestStatusUpdateView.as_view(), name="service-request-status"),
    path("service-requests/<uuid:pk>/history/", ServiceRequestHistoryView.as_view(), name="service-request-history"),
]
