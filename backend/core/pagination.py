"""
Shared pagination class.
"""
from rest_framework.pagination import PageNumberPagination


class StandardResultsPagination(PageNumberPagination):
    """
    Default paginator used across the API.

    Query parameters:
      ?page=2
      ?page_size=10   (max 100)
    """

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100
    page_query_param = "page"
