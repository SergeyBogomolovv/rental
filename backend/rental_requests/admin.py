from django.contrib import admin

from .models import RentalRequest


@admin.register(RentalRequest)
class RentalRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "property", "status", "desired_move_in_date", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("user__email", "property__title", "property__address")
    readonly_fields = ("created_at", "updated_at")
