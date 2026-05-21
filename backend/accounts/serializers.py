from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers
from rest_framework.authtoken.models import Token

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="first_name", required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ("id", "email", "name", "first_name", "last_name", "role", "account_status", "date_joined")
        read_only_fields = ("id", "role", "account_status", "date_joined")


class RegisterSerializer(serializers.ModelSerializer):
    name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("id", "email", "name", "password", "password_confirm")
        read_only_fields = ("id",)

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Пароли не совпадают."})
        return attrs

    def create(self, validated_data):
        name = validated_data.pop("name", "")
        validated_data.pop("password_confirm")
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=name,
        )
        Token.objects.get_or_create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get("request"),
            username=attrs["email"],
            password=attrs["password"],
        )
        if not user:
            raise serializers.ValidationError("Неверный email или пароль.")
        if not user.is_active:
            raise serializers.ValidationError("Пользователь неактивен.")
        attrs["user"] = user
        return attrs


class AuthResponseSerializer(serializers.Serializer):
    token = serializers.CharField()
    user = UserSerializer()


class AdminUserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="first_name", required=False, allow_blank=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "name",
            "first_name",
            "last_name",
            "role",
            "account_status",
            "is_staff",
            "is_superuser",
            "date_joined",
        )
        read_only_fields = ("id", "email", "is_superuser", "date_joined")

    def validate(self, attrs):
        request = self.context.get("request")
        instance = self.instance
        role = attrs.get("role")
        status = attrs.get("account_status")

        if request and instance and instance.pk == request.user.pk and status == User.AccountStatus.BLOCKED:
            raise serializers.ValidationError("Нельзя заблокировать текущего администратора.")
        if request and instance and instance.pk == request.user.pk and role == User.Role.USER:
            raise serializers.ValidationError("Нельзя снять роль администратора с самого себя.")
        return attrs
