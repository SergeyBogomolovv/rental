from django.db import transaction
from django.core.exceptions import ValidationError

from properties.models import Property
from .models import RentalRequest


@transaction.atomic
def set_request_status(rental_request, status):
    if rental_request.status in RentalRequest.TERMINAL_STATUSES and status != rental_request.status:
        raise ValidationError("Эту заявку уже нельзя изменить.")

    rental_request.status = status

    if status == RentalRequest.Status.APPROVED:
        if rental_request.property.status != Property.Status.AVAILABLE:
            raise ValidationError("Одобрить можно только заявку на свободный объект.")
        rental_request.save(update_fields=["status", "updated_at"])
        rental_request.property.status = Property.Status.BOOKED
        rental_request.property.save(update_fields=["status", "updated_at"])
        RentalRequest.objects.filter(
            property=rental_request.property,
            status__in=RentalRequest.ACTIVE_STATUSES,
        ).exclude(pk=rental_request.pk).update(status=RentalRequest.Status.REJECTED)
    else:
        rental_request.save(update_fields=["status", "updated_at"])

    return rental_request
