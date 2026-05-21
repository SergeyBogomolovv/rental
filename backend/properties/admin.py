from django.contrib import admin

from .models import Property


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "city",
        "district",
        "property_type",
        "price_per_month",
        "status",
        "updated_at",
    )
    list_filter = ("status", "property_type", "city", "has_furniture", "has_parking", "pets_allowed")
    search_fields = ("title", "city", "district", "address")
    readonly_fields = ("created_at", "updated_at")
