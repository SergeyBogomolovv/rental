from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.urls import reverse


class Property(models.Model):
    class PropertyType(models.TextChoices):
        APARTMENT = "apartment", "Квартира"
        HOUSE = "house", "Дом"
        ROOM = "room", "Комната"
        STUDIO = "studio", "Студия"

    class Status(models.TextChoices):
        AVAILABLE = "available", "Свободно"
        BOOKED = "booked", "Забронировано"
        HIDDEN = "hidden", "Скрыто"

    title = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    property_type = models.CharField(max_length=20, choices=PropertyType.choices)
    city = models.CharField(max_length=80)
    district = models.CharField(max_length=120, blank=True)
    address = models.CharField(max_length=220)
    price_per_month = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    rooms = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1)])
    area = models.DecimalField(max_digits=7, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    floor = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1)])
    total_floors = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1)])
    has_furniture = models.BooleanField(default=False)
    has_parking = models.BooleanField(default=False)
    pets_allowed = models.BooleanField(default=False)
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("-90")), MaxValueValidator(Decimal("90"))],
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("-180")), MaxValueValidator(Decimal("180"))],
    )
    photo_url = models.URLField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.AVAILABLE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["city"]),
            models.Index(fields=["district"]),
            models.Index(fields=["property_type"]),
            models.Index(fields=["status"]),
            models.Index(fields=["price_per_month"]),
        ]

    @property
    def is_visible_for_users(self):
        return self.status != self.Status.HIDDEN

    @property
    def has_coordinates(self):
        return self.latitude is not None and self.longitude is not None

    def get_absolute_url(self):
        return reverse("property-detail", kwargs={"pk": self.pk})

    def clean(self):
        super().clean()
        if self.floor and self.total_floors and self.floor > self.total_floors:
            raise ValidationError({"floor": "Этаж не может быть больше общего количества этажей."})

    def __str__(self):
        return f"{self.title} - {self.city}"
