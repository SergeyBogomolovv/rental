# Rental Map

Учебное веб-приложение для поиска и аренды недвижимости. Пользователь просматривает каталог, фильтрует объекты, смотрит их на интерактивной карте и отправляет заявки на аренду. Администратор управляет объектами, заявками и пользователями.

## Возможности

- регистрация и вход пользователей;
- роли `user` и `admin`;
- каталог объектов недвижимости;
- фильтрация по городу, району, типу, цене, площади, комнатам, удобствам и статусу;
- интерактивная карта объектов на Leaflet/OpenStreetMap;
- страница объекта с характеристиками, картой и формой заявки;
- личный кабинет пользователя со списком заявок и отменой активных заявок;
- админ-панель для объектов, заявок и пользователей;
- создание, скрытие и физическое удаление объектов;
- перевод заявок в работу, одобрение и отклонение;
- блокировка пользователей и смена ролей.

## Технологии

Backend:

- Python;
- Django 6;
- Django REST Framework;
- DRF Token Authentication;
- django-filter;
- drf-spectacular;
- SQLite для локальной разработки.

Frontend:

- React 19;
- Vite;
- React Router;
- TanStack Query;
- Axios;
- Leaflet и React Leaflet;
- Lucide React;
- ESLint.

## Структура

```text
backend/
  accounts/          пользователи, роли, авторизация
  properties/        объекты недвижимости, фильтры, demo seed
  rental_requests/   заявки на аренду и бизнес-логика статусов
  config/            настройки Django и маршруты API
frontend/
  src/pages/         страницы каталога, объекта, кабинета и админки
  src/components/    карточки, карта, protected route
  src/api/           axios-клиент
PRODUCT.md           описание продукта и действующих фич
USER_GUIDE.md        пошаговый запуск проекта на macOS
```

## API

Основные маршруты:

- `GET /api/` - корень API;
- `POST /api/auth/register/` - регистрация;
- `POST /api/auth/token/` - вход и получение токена;
- `GET/PATCH /api/auth/me/` - текущий пользователь;
- `GET /api/properties/` - публичный каталог;
- `GET /api/properties/{id}/` - объект;
- `GET/POST /api/requests/` - заявки текущего пользователя;
- `POST /api/requests/{id}/cancel/` - отмена заявки;
- `GET/POST/PATCH/DELETE /api/admin/properties/` - управление объектами;
- `GET/PATCH /api/admin/users/` - управление пользователями;
- `GET /api/admin/requests/` - заявки админа;
- `POST /api/admin/requests/{id}/review/` - взять заявку в работу;
- `POST /api/admin/requests/{id}/approve/` - одобрить заявку;
- `POST /api/admin/requests/{id}/reject/` - отклонить заявку;
- `GET /api/docs/` - Swagger UI.

## Демо-данные

Команда `seed_demo_data` создает объекты недвижимости, заявки и три аккаунта:

- администратор: `admin@example.com` / `demo12345`;
- пользователь: `user@example.com` / `demo12345`;
- заблокированный пользователь: `blocked@example.com` / `demo12345`.

Подробная инструкция по запуску находится в [USER_GUIDE.md](USER_GUIDE.md).
