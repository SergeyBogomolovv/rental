from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase


class AdminUserApiTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="demo12345",
            role=User.Role.ADMIN,
            account_status=User.AccountStatus.ACTIVE,
        )

    def test_admin_cannot_block_himself(self):
        self.client.force_authenticate(self.admin)

        response = self.client.patch(
            f"/api/admin/users/{self.admin.id}/",
            {"account_status": "blocked"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.admin.refresh_from_db()
        self.assertEqual(self.admin.account_status, "active")

    def test_admin_cannot_remove_his_own_admin_role(self):
        self.client.force_authenticate(self.admin)

        response = self.client.patch(
            f"/api/admin/users/{self.admin.id}/",
            {"role": "user"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.admin.refresh_from_db()
        self.assertEqual(self.admin.role, "admin")

    def test_register_requires_matching_password_confirmation(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "email": "new-user@example.com",
                "password": "demo12345",
                "password_confirm": "another12345",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Пароли не совпадают", str(response.data))
