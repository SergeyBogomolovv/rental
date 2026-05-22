from datetime import date, timedelta

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from properties.models import Property
from .models import RentalRequest


class RentalRequestApiTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(email="user@example.com", password="demo12345")
        self.admin = User.objects.create_user(email="admin@example.com", password="demo12345", role=User.Role.ADMIN)
        self.property = Property.objects.create(
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
            status=Property.Status.AVAILABLE,
        )

    def test_create_request_requires_message_and_date(self):
        self.client.force_authenticate(self.user)

        response = self.client.post("/api/requests/", {"property": self.property.id}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("message", response.data)
        self.assertIn("desired_move_in_date", response.data)

    def test_user_cannot_create_duplicate_active_request(self):
        RentalRequest.objects.create(
            user=self.user,
            property=self.property,
            message="Хочу посмотреть объект.",
            desired_move_in_date=date.today() + timedelta(days=7),
        )
        self.client.force_authenticate(self.user)

        response = self.client.post(
            "/api/requests/",
            {
                "property": self.property.id,
                "message": "Повторная заявка.",
                "desired_move_in_date": date.today() + timedelta(days=14),
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("активная заявка", str(response.data))

    def test_admin_cannot_change_terminal_request(self):
        rental_request = RentalRequest.objects.create(
            user=self.user,
            property=self.property,
            message="Хочу посмотреть объект.",
            desired_move_in_date=date.today() + timedelta(days=7),
            status=RentalRequest.Status.APPROVED,
        )
        self.client.force_authenticate(self.admin)

        response = self.client.post(f"/api/admin/requests/{rental_request.id}/reject/", format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        rental_request.refresh_from_db()
        self.assertEqual(rental_request.status, RentalRequest.Status.APPROVED)

    def test_admin_can_move_new_request_to_review(self):
        rental_request = RentalRequest.objects.create(
            user=self.user,
            property=self.property,
            message="Хочу посмотреть объект.",
            desired_move_in_date=date.today() + timedelta(days=7),
        )
        self.client.force_authenticate(self.admin)

        response = self.client.post(f"/api/admin/requests/{rental_request.id}/review/", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rental_request.refresh_from_db()
        self.assertEqual(rental_request.status, RentalRequest.Status.IN_REVIEW)

    def test_admin_cannot_approve_request_when_property_is_not_available(self):
        rental_request = RentalRequest.objects.create(
            user=self.user,
            property=self.property,
            message="Хочу посмотреть объект.",
            desired_move_in_date=date.today() + timedelta(days=7),
        )
        self.property.status = Property.Status.HIDDEN
        self.property.save(update_fields=["status"])
        self.client.force_authenticate(self.admin)

        response = self.client.post(f"/api/admin/requests/{rental_request.id}/approve/", format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        rental_request.refresh_from_db()
        self.property.refresh_from_db()
        self.assertEqual(rental_request.status, RentalRequest.Status.NEW)
        self.assertEqual(self.property.status, Property.Status.HIDDEN)
