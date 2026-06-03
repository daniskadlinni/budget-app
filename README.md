# НашЛДбюджет

Кроссплатформенное приложение для учёта личных финансов с облачной синхронизацией.

## Технологии

- **Backend:** Node.js + Express + TypeScript + Prisma + PostgreSQL
- **Frontend:** Quasar + Vue 3 + TypeScript + Pinia
- **Синхронизация:** Offline-first с WebSocket

## Запуск

### 1. Backend

```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

## Переменные окружения (.env в server/)

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/budget_app"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
PORT=3001
```

## Основные возможности

- Учёт доходов и расходов
- Управление несколькими счетами (наличные, карты, кредиты)
- Категоризация транзакций
- Аналитика с графиками
- Офлайн-режим с синхронизацией
- Экспорт в CSV

## API Endpoints

- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/refresh` - Обновление токена
- `GET/POST /api/accounts` - Счета
- `GET/POST /api/categories` - Категории
- `GET/POST /api/transactions` - Транзакции
- `POST /api/sync/push` - Отправка изменений
- `GET /api/sync/pull` - Получение изменений