"""
Standardized API response helpers.

All views should use these helpers to maintain a consistent response shape:

  Success:
    {"success": true, "message": "...", "data": {...}}

  Error:
    {"success": false, "message": "...", "errors": {...}}
"""
from rest_framework.response import Response


def success_response(data=None, message="", status=200):
    """Return a standard success API response."""
    payload = {
        "success": True,
        "message": message,
        "data": data if data is not None else {},
    }
    return Response(payload, status=status)


def created_response(data=None, message="Created successfully."):
    """Convenience wrapper for HTTP 201."""
    return success_response(data=data, message=message, status=201)


def error_response(message="An error occurred.", errors=None, status=400):
    """Return a standard error API response."""
    payload = {
        "success": False,
        "message": message,
        "errors": errors if errors is not None else {},
    }
    return Response(payload, status=status)
