"""
Custom exception handler — wraps DRF's default handler in the standard
{success, message, errors} envelope so clients never see raw 500 tracebacks.
"""
from rest_framework.views import exception_handler

from core.responses import error_response


def custom_exception_handler(exc, context):
    """
    Call DRF's default handler first, then reformat into our envelope.
    """
    response = exception_handler(exc, context)

    if response is not None:
        # Extract a human-readable message
        data = response.data

        if isinstance(data, dict):
            # DRF validation errors: {'field': ['msg']} or {'detail': 'msg'}
            detail = data.get("detail")
            if detail:
                message = str(detail)
                errors = {}
            else:
                message = "Validation failed."
                errors = data
        elif isinstance(data, list):
            message = "Validation failed."
            errors = {"non_field_errors": data}
        else:
            message = str(data)
            errors = {}

        return error_response(message=message, errors=errors, status=response.status_code)

    # Unhandled exception — return generic 500 without traceback
    return error_response(
        message="An unexpected error occurred. Please try again later.",
        errors={},
        status=500,
    )
