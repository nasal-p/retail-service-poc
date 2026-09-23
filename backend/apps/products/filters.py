"""
Django-filter FilterSet for Product listing.
"""
import django_filters

from .models import Product


class ProductFilter(django_filters.FilterSet):
    """
    Supports filtering products via query parameters:
      ?category=1
      ?brand=Apple
      ?min_price=100&max_price=500
      ?in_stock=true
      ?search=iphone   (handled by SearchFilter in the view)
    """

    category = django_filters.NumberFilter(field_name="category__id")
    brand = django_filters.CharFilter(field_name="brand", lookup_expr="icontains")
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    in_stock = django_filters.BooleanFilter(method="filter_in_stock")
    status = django_filters.CharFilter(field_name="status", lookup_expr="exact")

    class Meta:
        model = Product
        fields = ["category", "brand", "min_price", "max_price", "in_stock", "status"]

    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock_quantity__gt=0)
        return queryset.filter(stock_quantity=0)
