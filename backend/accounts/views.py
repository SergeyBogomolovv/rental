from django.contrib.auth import get_user_model
from django.db.models import Count
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView

from .permissions import IsAdminRole
from .serializers import AdminUserSerializer, AuthResponseSerializer, LoginSerializer, RegisterSerializer, UserSerializer

User = get_user_model()


@extend_schema(
    responses=inline_serializer(
        name="ApiRootResponse",
        fields={
            "status": serializers.CharField(),
            "name": serializers.CharField(),
            "endpoints": serializers.DictField(child=serializers.CharField()),
        },
    )
)
@api_view(["GET"])
@permission_classes([AllowAny])
def api_root(request):
    return Response(
        {
            "status": "ok",
            "name": "Rental Map API",
            "endpoints": {
                "auth": "/api/auth/",
                "properties": "/api/properties/",
                "requests": "/api/requests/",
                "admin": "/api/admin/",
                "schema": "/api/schema/",
            },
        }
    )


class RegisterView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=RegisterSerializer, responses={201: AuthResponseSerializer})
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {"token": token.key, "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=LoginSerializer, responses=AuthResponseSerializer)
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": UserSerializer(user).data})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=UserSerializer)
    def get(self, request):
        return Response(UserSerializer(request.user).data)

    @extend_schema(request=UserSerializer, responses=UserSerializer)
    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AdminUserViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    queryset = User.objects.annotate(request_count=Count("rental_requests")).order_by("-date_joined")
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminRole]
    search_fields = ("email", "first_name", "last_name")
    ordering_fields = ("date_joined", "email")

    @action(detail=True, methods=["post"])
    def block(self, request, pk=None):
        user = self.get_object()
        if user.pk == request.user.pk:
            return Response({"detail": "Нельзя заблокировать текущего администратора."}, status=status.HTTP_400_BAD_REQUEST)
        user.account_status = User.AccountStatus.BLOCKED
        user.save(update_fields=["account_status"])
        return Response(self.get_serializer(user).data)

    @action(detail=True, methods=["post"])
    def unblock(self, request, pk=None):
        user = self.get_object()
        user.account_status = User.AccountStatus.ACTIVE
        user.save(update_fields=["account_status"])
        return Response(self.get_serializer(user).data)
