# Wishlist (фронтенд)

Клиент приложения «Социальный вишлист»: вишлисты, подарки, бронирование, скидывание, реалтайм по WebSocket.

## Стек

- Next.js (App Router), React, TypeScript
- JWT-авторизация + опционально вход через Google (OAuth)

## Установка и запуск

```bash
npm install
cp .env.example .env
# Задайте NEXT_PUBLIC_API_URL (бэкенд) и при необходимости NEXT_PUBLIC_GOOGLE_CLIENT_ID
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Переменные окружения

| Переменная | Описание |
|------------|----------|
| `NEXT_PUBLIC_API_URL` | URL бэкенда (например `http://localhost:8000`). На деплое — ваш API (автозаполнение по URL и запросы идут сюда). |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Client ID из Google Cloud Console для кнопки «Войти через Google». Если не задан — кнопка не показывается. |

Для Google OAuth в консоли укажите **Authorized redirect URI**:  
`https://<ваш-домен>/auth/callback` (прод) и `http://localhost:3000/auth/callback` (разработка).

## Сборка и деплой

```bash
npm run build
npm start
```

На Vercel и др. задайте `NEXT_PUBLIC_API_URL` и при необходимости `NEXT_PUBLIC_GOOGLE_CLIENT_ID` в настройках окружения.

Автозаполнение по URL на деплое использует `NEXT_PUBLIC_API_URL`: фронт дергает бэкенд `GET /api/parse-url?url=...`, поэтому на проде должен быть доступен ваш задеплоенный API.
