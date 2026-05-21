"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter

from accounts.views import AdminUserViewSet, api_root
from properties.views import AdminPropertyViewSet, PropertyViewSet
from rental_requests.views import AdminRentalRequestViewSet, RentalRequestViewSet

router = DefaultRouter()
router.register("properties", PropertyViewSet, basename="property")
router.register("requests", RentalRequestViewSet, basename="request")

admin_router = DefaultRouter()
admin_router.register("users", AdminUserViewSet, basename="admin-user")
admin_router.register("properties", AdminPropertyViewSet, basename="admin-property")
admin_router.register("requests", AdminRentalRequestViewSet, basename="admin-request")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api_root, name="api-root"),
    path("api/auth/", include("accounts.urls")),
    path("api/", include(router.urls)),
    path("api/admin/", include(admin_router.urls)),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]
