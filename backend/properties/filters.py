import django_filters

from .models import Property


class PropertyFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name="price_per_month", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price_per_month", lookup_expr="lte")
    min_area = django_filters.NumberFilter(field_name="area", lookup_expr="gte")
    city = django_filters.CharFilter(field_name="city", lookup_expr="iexact")
    district = django_filters.CharFilter(field_name="district", lookup_expr="icontains")

    class Meta:
        model = Property
        fields = (
            "city",
            "district",
            "property_type",
            "rooms",
            "has_furniture",
            "has_parking",
            "pets_allowed",
            "status",
        )
