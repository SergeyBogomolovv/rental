# USER GUIDE: запуск проекта на macOS

Инструкция рассчитана на ситуацию, когда проект только что скачан с GitHub.

## 1. Что должно быть установлено

Проверьте инструменты:

```bash
python3 --version
node --version
npm --version
git --version
```

Для проекта нужен Python 3.12+ и Node.js 20+.

Если Node.js не установлен, проще всего поставить его через Homebrew:

```bash
brew install node
```

Если Python 3.12+ не установлен:

```bash
brew install python
```

## 2. Скачать проект

```bash
git clone <URL_РЕПОЗИТОРИЯ>
cd rental-map
```

Замените `<URL_РЕПОЗИТОРИЯ>` на ссылку из GitHub.

## 3. Запустить backend

Перейдите в папку backend:

```bash
cd backend
```

Создайте виртуальное окружение:

```bash
python3 -m venv .venv
```

Активируйте его:

```bash
source .venv/bin/activate
```

Установите зависимости:

```bash
pip install -r requirements.txt
```

Примените миграции:

```bash
python manage.py migrate
```

Заполните базу тестовыми данными:

```bash
python manage.py seed_demo_data
```

Запустите сервер:

```bash
python manage.py runserver
```

Backend будет доступен по адресу:

```text
http://127.0.0.1:8000/
```

Swagger API:

```text
http://127.0.0.1:8000/api/docs/
```

Оставьте этот терминал открытым.

## 4. Запустить frontend

Откройте новый терминал и перейдите в папку проекта:

```bash
cd rental-map/frontend
```

Установите зависимости:

```bash
npm install
```

Запустите Vite:

```bash
npm run dev
```

Frontend будет доступен по адресу:

```text
http://localhost:5173/
```

Если backend запущен на стандартном адресе `http://127.0.0.1:8000/api`, дополнительные настройки не нужны.

Если backend запущен на другом адресе, создайте файл `frontend/.env`:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

После изменения `.env` перезапустите `npm run dev`.

## 5. Тестовые аккаунты

После команды `python manage.py seed_demo_data` доступны аккаунты:

| Роль                         | Email                 | Пароль      |
| ---------------------------- | --------------------- | ----------- |
| Администратор                | `admin@example.com`   | `demo12345` |
| Пользователь                 | `user@example.com`    | `demo12345` |
| Заблокированный пользователь | `blocked@example.com` | `demo12345` |

Администратор видит пункт `Админка` в верхнем меню. Обычный пользователь видит `Кабинет` и может отправлять заявки.

## 6. Как заново заполнить тестовые данные

Если нужно повторно привести демо-данные к ожидаемому состоянию:

```bash
cd backend
source .venv/bin/activate
python manage.py seed_demo_data
```

Команда обновляет демо-пользователей и объекты, а тестовые заявки для демо-пользователей пересоздает.

## 7. Полезные команды разработки

Backend:

```bash
cd backend
source .venv/bin/activate
python manage.py test
python manage.py makemigrations
python manage.py migrate
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## 8. Частые проблемы

Если frontend показывает ошибку загрузки каталога, проверьте, что backend запущен на `http://127.0.0.1:8000`.

Если команда `python manage.py ...` пишет, что Django не найден, активируйте виртуальное окружение:

```bash
source .venv/bin/activate
```

Если порт `5173` занят, Vite предложит другой порт. Откройте URL, который он напечатает в терминале.
