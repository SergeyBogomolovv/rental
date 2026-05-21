import builtins

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q


class RentalRequest(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "Новая"
        IN_REVIEW = "in_review", "На рассмотрении"
        APPROVED = "approved", "Одобрена"
        REJECTED = "rejected", "Отклонена"
        CANCELLED = "cancelled", "Отменена"

    ACTIVE_STATUSES = (Status.NEW, Status.IN_REVIEW)
    TERMINAL_STATUSES = (Status.APPROVED, Status.REJECTED, Status.CANCELLED)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="rental_requests",
    )
    property = models.ForeignKey(
        "properties.Property",
        on_delete=models.CASCADE,
        related_name="rental_requests",
    )
    message = models.TextField()
    desired_move_in_date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "property"],
                condition=Q(status__in=["new", "in_review"]),
                name="unique_active_request_per_user_property",
            )
        ]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["created_at"]),
        ]

    @builtins.property
    def is_active(self):
        return self.status in self.ACTIVE_STATUSES

    def clean(self):
        super().clean()
        if self.status in self.ACTIVE_STATUSES and self.property_id:
            if self.property.status != "available":
                raise ValidationError("Заявки можно создавать только для свободных объектов.")

    def __str__(self):
        return f"Request #{self.pk} by {self.user} for {self.property}"
