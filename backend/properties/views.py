from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.permissions import IsAdminRole
from .filters import PropertyFilter
from .models import Property
from .serializers import PropertyMapSerializer, PropertySerializer


class PropertyViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PropertySerializer
    permission_classes = [AllowAny]
    filterset_class = PropertyFilter
    search_fields = ("title", "description", "city", "district", "address")
    ordering_fields = ("price_per_month", "area", "created_at")
    ordering = ("-created_at",)

    def get_queryset(self):
        return Property.objects.exclude(status=Property.Status.HIDDEN)

    @action(detail=False, methods=["get"])
    def map(self, request):
        queryset = self.filter_queryset(self.get_queryset()).filter(latitude__isnull=False, longitude__isnull=False)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = PropertyMapSerializer(page, many=True, context={"request": request})
            return self.get_paginated_response(serializer.data)

        serializer = PropertyMapSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data)


class AdminPropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    permission_classes = [IsAdminRole]
    filterset_class = PropertyFilter
    search_fields = ("title", "description", "city", "district", "address")
    ordering_fields = ("price_per_month", "area", "created_at", "updated_at")
    ordering = ("-created_at",)

    def perform_destroy(self, instance):
        if instance.status == Property.Status.BOOKED:
            raise ValidationError("Забронированный объект нельзя удалить.")
        instance.delete()
