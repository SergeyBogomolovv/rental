from rest_framework import serializers

from .models import Property


class PropertySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = (
            "id",
            "title",
            "description",
            "property_type",
            "city",
            "district",
            "address",
            "price_per_month",
            "rooms",
            "area",
            "floor",
            "total_floors",
            "has_furniture",
            "has_parking",
            "pets_allowed",
            "latitude",
            "longitude",
            "photo_url",
            "image",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at", "image")

    def get_image(self, obj):
        return obj.photo_url or ""

    def validate_status(self, value):
        if self.instance and self.instance.status == Property.Status.BOOKED and value == Property.Status.HIDDEN:
            raise serializers.ValidationError("Забронированный объект нельзя скрыть.")
        return value


class PropertyMapSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = ("id", "title", "price_per_month", "property_type", "latitude", "longitude", "status", "image")

    def get_image(self, obj):
        return PropertySerializer(context=self.context).get_image(obj)
