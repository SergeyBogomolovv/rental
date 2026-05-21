from rest_framework import serializers

from properties.models import Property
from properties.serializers import PropertySerializer
from .models import RentalRequest


class RentalRequestSerializer(serializers.ModelSerializer):
    property_detail = PropertySerializer(source="property", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)
    message = serializers.CharField(
        required=True,
        allow_blank=False,
        error_messages={
            "blank": "Сообщение не может быть пустым.",
            "required": "Укажите сообщение владельцу.",
        },
    )
    desired_move_in_date = serializers.DateField(
        required=True,
        allow_null=False,
        error_messages={
            "invalid": "Укажите корректную дату заезда.",
            "null": "Укажите дату заезда.",
            "required": "Укажите дату заезда.",
        },
    )

    class Meta:
        model = RentalRequest
        fields = (
            "id",
            "user",
            "user_email",
            "property",
            "property_detail",
            "message",
            "desired_move_in_date",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "user", "user_email", "property_detail", "status", "created_at", "updated_at")

    def validate_property(self, value):
        if value.status != Property.Status.AVAILABLE:
            raise serializers.ValidationError("На этот объект нельзя отправить заявку.")
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        user = request.user if request else None
        property_obj = attrs.get("property")

        if user and user.is_blocked:
            raise serializers.ValidationError("Заблокированный пользователь не может отправлять заявки.")
        if user and property_obj:
            exists = RentalRequest.objects.filter(
                user=user,
                property=property_obj,
                status__in=RentalRequest.ACTIVE_STATUSES,
            )
            if self.instance:
                exists = exists.exclude(pk=self.instance.pk)
            if exists.exists():
                raise serializers.ValidationError("У вас уже есть активная заявка на этот объект.")
        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class AdminRentalRequestSerializer(serializers.ModelSerializer):
    property_detail = PropertySerializer(source="property", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = RentalRequest
        fields = (
            "id",
            "user",
            "user_email",
            "property",
            "property_detail",
            "message",
            "desired_move_in_date",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "user_email", "property_detail", "status", "created_at", "updated_at")
