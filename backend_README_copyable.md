````markdown
# Tabletnica Backend

Полная аннотация бэкенда: что где лежит, как запустить, какие эндпоинты за что отвечают и под какими правами работают.

## 1. Быстрый старт

Все команды выполняются **из корня репозитория** (модули запускаются как `backend.src.*`).

```bash
# 1. Окружение
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt

# 2. Переменные окружения (обязательны для локального запуска)
export DATABASE_URL='sqlite+aiosqlite:///./tabletnica-local.db'   # без него — дефолтный sqlite-файл
export COOKIE_SECURE='false'                                      # иначе браузер не сохранит сессию по http
export CORS_ORIGINS='http://localhost:5173,http://127.0.0.1:5173' # адреса фронтенда, иначе verify_origin → 403

# 3. Инициализация БД (создаёт недостающие таблицы, существующие данные не трогает)
python -m backend.src.manage init-local

# 4. Первый администратор (пароль запрашивается интерактивно, минимум 12 символов)
python -m backend.src.manage create-admin --username admin --full-name 'Администратор'

# 5. Запуск сервера
python -m uvicorn backend.src.main:app --host 127.0.0.1 --port 8000
```

- Swagger UI: `http://127.0.0.1:8000/docs`
- Healthcheck: `GET /health-check`
- Тесты: `pytest backend/tests -q` (используется отдельная `test.db`)

> ⚠️ `.env.example` приложением **не подхватывается автоматически** — переменные нужно экспортировать в процесс (или через dotenv-менеджер IDE).

## 2. Структура каталога `src/`

| Путь | Назначение |
|---|---|
| `main.py` | Точка входа FastAPI: подключение роутеров, CORS, обработчик IntegrityError→409 |
| `config.py` | Все env-переменные и дефолты |
| `database.py` | Async engine/session, `load_models()`, `init_db()` |
| `auth.py` | Сессии, cookie, зависимости `current_user` / `admin_user` / `verify_origin` |
| `hash.py` | Хеширование паролей (argon2id + bcrypt-legacy) |
| `manage.py` | CLI: `init-local`, `create-admin` |
| `users/` | Регистрация, логин, профили, сессии |
| `patients/` | Пациенты |
| `prescriptions/` | Рецепты + `document.py` (`/frontend/v1` — агрегатор для фронта) |
| `schedules/` | Расписания приёмов |
| `schedules_times/` | Времена внутри расписаний |
| `pillboxes/` | Таблетницы |
| `alerts/` | Уведомления |
| `devices_configs/`, `events/`, `cells/`, `cell_configs/`, `weight_measurements/`, `pillbox_assignments/`, `prescriptions_items/` | Пока только модели (см. раздел 5) |
| `models.py`, `schemas.py`, `crud.py` (в корне src) | Легаси — мёртвый код, не использовать |

## 3. Общие модули подробно

### main.py
- Подключает роутеры: `users` и `/frontend/v1` — **без** глобального guard'а; остальные 6 модулей — под `Depends(current_user)` на уровне `include_router`.
- Глобальный exception handler: `IntegrityError` → `409 Conflict`.
- CORS настраивается из `CORS_ORIGINS`.

### config.py

| Переменная | Дефолт | Зачем |
|---|---|---|
| `DATABASE_URL` | `sqlite+aiosqlite:///./tabletnica-local.db` | строка подключения |
| `COOKIE_SECURE` | `true` | для http-разработки ставить `false` |
| `CORS_ORIGINS` | список localhost-портов | белый список origin'ов |
| `SESSION_TTL_HOURS` | `24` | срок жизни сессии |

### database.py
- `engine` + `async_sessionmaker`; для SQLite включается `PRAGMA foreign_keys=ON`.
- `load_models()` импортирует все пакеты с моделями — **при добавлении нового пакета дописывать сюда**.
- `init_db()` только создаёт недостающие таблицы (Alembic-миграций нет).

### auth.py — ключевые моменты
- Токен сессии хранится в таблице `user_sessions` в виде SHA-256 хеша; клиент получает cookie `session_id` (HttpOnly, SameSite=Lax, TTL 24 ч).
- Зависимости:
  - `current_user` → `401 Unauthorized` без валидной сессии;
  - `admin_user` → `403 Forbidden` если роль не `ADMIN`;
  - `verify_origin` → `403 "Origin is not allowed"` если Origin запроса не в `CORS_ORIGINS`.
- **Следствие (важно):** `POST /users/register` защищён `admin_user`, то есть зарегистрировать пользователя может только залогиненный админ. Публичной регистрации нет — это и была причина исходного 403.

### hash.py
- Основной алгоритм — `argon2id` (passlib); поддержка legacy-хешей `bcrypt`. Вызовы уходят в threadpool.

### manage.py
- `init-local` — идемпотентная инициализация БД;
- `create-admin --username ... --full-name ...` — создание админа, пароль интерактивно (≥12 символов).

## 4. CRUD-модули и эндпоинты

| Модуль | Префикс | Основные эндпоинты | Права |
|---|---|---|---|
| users | `/users` | `POST /register` (только админ), `POST /login`, `POST /logout`, `GET /me`, `PATCH /me`, `GET /sessions` | register — ADMIN, остальное — current_user/public |
| patients | `/patients` | `GET /`, `GET /{id}`, `POST /`, `PATCH /{id}`, `DELETE /{id}` | current_user |
| prescriptions | `/prescriptions` | CRUD + позиции | current_user |
| prescriptions/document | `/frontend/v1` | агрегированный документ для фронта | **требует сессию** |
| schedules | `/schedules` | CRUD, `PATCH /update_status` | current_user |
| schedules_times | `/schedules-times` | CRUD времён | current_user |
| pillboxes | `/pillboxes` | CRUD таблетниц | current_user |
| alerts | `/alerts` | чтение/управление уведомлениями | current_user |

Коды ответов: `200/201` успех, `401` нет сессии, `403` не админ/плохой Origin, `404` нет объекта, `409` нарушение целостности (дубликат), `422` схема.

## 5. Модели без API

Таблицы создаются, но REST-эндпоинтов пока нет: `prescriptions_items`, `pillbox_assignments`, `cells`, `cell_configs`, `events`, `devices_configs`, `weight_measurements`. Пишущий API для устройств (`devices_configs`) — основной пробел.

## 6. Соглашения

- Слои: `models.py` → `schemas.py` → `crud.py` → `routers.py` внутри каждого пакета.
- Сессия БД инжектится через `SessionDep = Annotated[AsyncSession, Depends(get_session)]`.
- Время хранится как naive UTC.
- Для совместимости с MySQL: PK/FK — `Integer` (не BigInteger), enum — строковые со значениями в snake_case.
- Новая модель: создать пакет → дописать импорт в `load_models()` → добавить router в `main.py`.

## 7. Технический долг

1. `POST /users/register` доступен только админу — нет публичной self-registration.
2. Странная сигнатура `PATCH /schedules/update_status` (id в query вместо path).
3. Опечатка в enum pillboxes: `avalible` вместо `available`.
4. Нет write-API для телеметрии устройств.
````
