from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsAdminRole
from .models import RentalRequest
from .serializers import AdminRentalRequestSerializer, RentalRequestSerializer
from .services import set_request_status


class RentalRequestViewSet(viewsets.ModelViewSet):
    serializer_class = RentalRequestSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "head", "options"]
    ordering_fields = ("created_at", "updated_at")

    def get_queryset(self):
        return RentalRequest.objects.filter(user=self.request.user).select_related("user", "property")

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        rental_request = self.get_object()
        if rental_request.status not in RentalRequest.ACTIVE_STATUSES:
            return Response({"detail": "Отменить можно только активную заявку."}, status=status.HTTP_400_BAD_REQUEST)
        rental_request.status = RentalRequest.Status.CANCELLED
        rental_request.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(rental_request).data)


class AdminRentalRequestViewSet(viewsets.ModelViewSet):
    queryset = RentalRequest.objects.select_related("user", "property").all()
    serializer_class = AdminRentalRequestSerializer
    permission_classes = [IsAdminRole]
    filterset_fields = ("status", "property", "user")
    search_fields = ("user__email", "property__title", "property__address")
    ordering_fields = ("created_at", "updated_at")
    ordering = ("-created_at",)

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        rental_request = serializer.save()
        if old_status != rental_request.status:
            set_request_status(rental_request, rental_request.status)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        rental_request = self.get_object()
        if rental_request.status not in RentalRequest.ACTIVE_STATUSES:
            raise ValidationError("Эту заявку уже нельзя изменить.")
        try:
            rental_request = set_request_status(rental_request, RentalRequest.Status.APPROVED)
        except DjangoValidationError as error:
            raise ValidationError(error.message) from error
        return Response(self.get_serializer(rental_request).data)

    @action(detail=True, methods=["post"])
    def review(self, request, pk=None):
        rental_request = self.get_object()
        if rental_request.status != RentalRequest.Status.NEW:
            raise ValidationError("На рассмотрение можно отправить только новую заявку.")
        try:
            rental_request = set_request_status(rental_request, RentalRequest.Status.IN_REVIEW)
        except DjangoValidationError as error:
            raise ValidationError(error.message) from error
        return Response(self.get_serializer(rental_request).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        rental_request = self.get_object()
        if rental_request.status not in RentalRequest.ACTIVE_STATUSES:
            raise ValidationError("Эту заявку уже нельзя изменить.")
        try:
            rental_request = set_request_status(rental_request, RentalRequest.Status.REJECTED)
        except DjangoValidationError as error:
            raise ValidationError(error.message) from error
        return Response(self.get_serializer(rental_request).data)
