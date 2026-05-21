from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Property


class AdminPropertyApiTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.admin = User.objects.create_user(email="admin@example.com", password="demo12345", role=User.Role.ADMIN)

    def create_property(self, status_value=Property.Status.AVAILABLE):
        return Property.objects.create(
            title="Test apartment",
            description="Apartment for tests",
            property_type=Property.PropertyType.APARTMENT,
            city="Москва",
            address="ул. Тестовая, 1",
            price_per_month=50000,
            rooms=1,
            area="35.00",
            floor=2,
            total_floors=9,
            status=status_value,
        )

    def test_delete_property_removes_it_from_database(self):
        property_obj = self.create_property()
        self.client.force_authenticate(self.admin)

        response = self.client.delete(f"/api/admin/properties/{property_obj.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Property.objects.filter(id=property_obj.id).exists())

    def test_admin_cannot_hide_booked_property(self):
        property_obj = self.create_property(Property.Status.BOOKED)
        self.client.force_authenticate(self.admin)

        response = self.client.patch(
            f"/api/admin/properties/{property_obj.id}/",
            {"status": "hidden"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        property_obj.refresh_from_db()
        self.assertEqual(property_obj.status, Property.Status.BOOKED)

    def test_admin_cannot_delete_booked_property(self):
        property_obj = self.create_property(Property.Status.BOOKED)
        self.client.force_authenticate(self.admin)

        response = self.client.delete(f"/api/admin/properties/{property_obj.id}/")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Property.objects.filter(id=property_obj.id).exists())
