from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from properties.models import Property
from rental_requests.models import RentalRequest


DEMO_PASSWORD = "demo12345"


PROPERTIES = [
    {
        "title": "Светлая студия у метро",
        "description": "Компактная студия с мебелью и быстрым доступом к центру.",
        "property_type": Property.PropertyType.STUDIO,
        "city": "Москва",
        "district": "Пресненский",
        "address": "ул. Красная Пресня, 12",
        "price_per_month": 68000,
        "rooms": 1,
        "area": "28.50",
        "floor": 8,
        "total_floors": 18,
        "has_furniture": True,
        "has_parking": False,
        "pets_allowed": False,
        "latitude": "55.760186",
        "longitude": "37.560932",
        "photo_url": "https://images.unsplash.com/photo-1702014862053-946a122b920d?auto=format&fit=crop&w=1200&q=80",
        "status": Property.Status.AVAILABLE,
    },
    {
        "title": "Двухкомнатная квартира рядом с парком",
        "description": "Раздельные комнаты, зеленый двор, парковка во дворе.",
        "property_type": Property.PropertyType.APARTMENT,
        "city": "Москва",
        "district": "Сокольники",
        "address": "ул. Сокольнический Вал, 22",
        "price_per_month": 92000,
        "rooms": 2,
        "area": "54.00",
        "floor": 5,
        "total_floors": 12,
        "has_furniture": True,
        "has_parking": True,
        "pets_allowed": True,
        "latitude": "55.789833",
        "longitude": "37.679731",
        "photo_url": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
        "status": Property.Status.AVAILABLE,
    },
    {
        "title": "Комната в спокойном районе",
        "description": "Подходит студенту, есть рабочее место и общий кухонный блок.",
        "property_type": Property.PropertyType.ROOM,
        "city": "Москва",
        "district": "Академический",
        "address": "ул. Дмитрия Ульянова, 7",
        "price_per_month": 32000,
        "rooms": 1,
        "area": "18.00",
        "floor": 3,
        "total_floors": 9,
        "has_furniture": True,
        "has_parking": False,
        "pets_allowed": False,
        "latitude": "55.690688",
        "longitude": "37.576855",
        "photo_url": "https://images.unsplash.com/photo-1585128792103-0b591f96512e?auto=format&fit=crop&w=1200&q=80",
        "status": Property.Status.AVAILABLE,
    },
    {
        "title": "Дом для семьи",
        "description": "Небольшой дом с участком, парковкой и местом для питомцев.",
        "property_type": Property.PropertyType.HOUSE,
        "city": "Химки",
        "district": "Новогорск",
        "address": "ул. Ивановская, 4",
        "price_per_month": 145000,
        "rooms": 4,
        "area": "126.00",
        "floor": 1,
        "total_floors": 2,
        "has_furniture": False,
        "has_parking": True,
        "pets_allowed": True,
        "latitude": "55.906331",
        "longitude": "37.392137",
        "photo_url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
        "status": Property.Status.AVAILABLE,
    },
    {
        "title": "Квартира с видом на реку",
        "description": "Современный ремонт, лоджия, закрытая территория.",
        "property_type": Property.PropertyType.APARTMENT,
        "city": "Москва",
        "district": "Хамовники",
        "address": "Фрунзенская наб., 28",
        "price_per_month": 135000,
        "rooms": 3,
        "area": "78.40",
        "floor": 11,
        "total_floors": 16,
        "has_furniture": True,
        "has_parking": True,
        "pets_allowed": False,
        "latitude": "55.728378",
        "longitude": "37.582314",
        "photo_url": "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
        "status": Property.Status.BOOKED,
    },
    {
        "title": "Недорогая квартира без мебели",
        "description": "Базовый вариант для долгосрочной аренды.",
        "property_type": Property.PropertyType.APARTMENT,
        "city": "Балашиха",
        "district": "Центр",
        "address": "пр-т Ленина, 31",
        "price_per_month": 41000,
        "rooms": 1,
        "area": "36.00",
        "floor": 6,
        "total_floors": 17,
        "has_furniture": False,
        "has_parking": False,
        "pets_allowed": True,
        "latitude": "55.796289",
        "longitude": "37.938933",
        "photo_url": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
        "status": Property.Status.AVAILABLE,
    },
    {
        "title": "Скрытый тестовый объект",
        "description": "Нужен для проверки, что пользовательский каталог его не показывает.",
        "property_type": Property.PropertyType.STUDIO,
        "city": "Москва",
        "district": "Тверской",
        "address": "ул. Тверская, 1",
        "price_per_month": 50000,
        "rooms": 1,
        "area": "25.00",
        "floor": 2,
        "total_floors": 6,
        "has_furniture": True,
        "has_parking": False,
        "pets_allowed": False,
        "latitude": "55.757593",
        "longitude": "37.612661",
        "photo_url": "https://images.unsplash.com/photo-1466098672325-c9ddda4b7975?auto=format&fit=crop&w=1200&q=80",
        "status": Property.Status.HIDDEN,
    },
]


class Command(BaseCommand):
    help = "Create demo users, properties and rental requests for local development."

    def handle(self, *args, **options):
        User = get_user_model()

        admin, _ = User.objects.update_or_create(
            email="admin@example.com",
            defaults={
                "first_name": "Администратор",
                "role": User.Role.ADMIN,
                "account_status": User.AccountStatus.ACTIVE,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        admin.set_password(DEMO_PASSWORD)
        admin.save()

        user, _ = User.objects.update_or_create(
            email="user@example.com",
            defaults={"first_name": "Иван", "role": User.Role.USER, "account_status": User.AccountStatus.ACTIVE},
        )
        user.set_password(DEMO_PASSWORD)
        user.save()

        blocked_user, _ = User.objects.update_or_create(
            email="blocked@example.com",
            defaults={"first_name": "Заблокированный", "role": User.Role.USER, "account_status": User.AccountStatus.BLOCKED},
        )
        blocked_user.set_password(DEMO_PASSWORD)
        blocked_user.save()

        saved_properties = []
        for data in PROPERTIES:
            property_obj, _ = Property.objects.update_or_create(
                title=data["title"],
                address=data["address"],
                defaults=data,
            )
            saved_properties.append(property_obj)

        RentalRequest.objects.filter(user__email__in=["user@example.com", "blocked@example.com"]).delete()
        RentalRequest.objects.create(
            user=user,
            property=saved_properties[0],
            message="Хочу посмотреть квартиру на этой неделе.",
            desired_move_in_date=date.today() + timedelta(days=21),
            status=RentalRequest.Status.NEW,
        )
        RentalRequest.objects.create(
            user=user,
            property=saved_properties[4],
            message="Интересует долгосрочная аренда.",
            desired_move_in_date=date.today() + timedelta(days=35),
            status=RentalRequest.Status.APPROVED,
        )
        RentalRequest.objects.create(
            user=blocked_user,
            property=saved_properties[1],
            message="Тестовая заявка заблокированного пользователя.",
            desired_move_in_date=date.today() + timedelta(days=14),
            status=RentalRequest.Status.IN_REVIEW,
        )

        self.stdout.write(self.style.SUCCESS("Demo data created."))
        self.stdout.write("Admin: admin@example.com / demo12345")
        self.stdout.write("User: user@example.com / demo12345")
