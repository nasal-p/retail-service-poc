"""
Django admin for services app.
"""
from django.contrib import admin

from .models import Service, ServiceRequest, ServiceRequiredPart, ServiceStatusHistory


class ServiceStatusHistoryInline(admin.TabularInline):
    model = ServiceStatusHistory
    extra = 0
    readonly_fields = ["old_status", "new_status", "changed_by", "note", "created_at"]
    can_delete = False


class ServiceRequiredPartInline(admin.TabularInline):
    model = ServiceRequiredPart
    extra = 0


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ["name", "estimated_price", "estimated_duration", "status"]
    list_filter = ["status"]
    search_fields = ["name"]


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = ["ticket_number", "customer", "service", "device_brand", "status", "created_at"]
    list_filter = ["status", "service"]
    search_fields = ["ticket_number", "customer__email", "device_brand", "device_model"]
    readonly_fields = ["id", "ticket_number", "created_at", "updated_at"]
    inlines = [ServiceStatusHistoryInline, ServiceRequiredPartInline]
