# Wishlist (фронтенд)

Клиент приложения «Социальный вишлист»: вишлисты, подарки, бронирование, скидывание, реалтайм по WebSocket.

## Стек

- Next.js (App Router), React, TypeScript
- JWT-авторизация + опционально вход через Google (OAuth)

## Установка и запуск

```bash
npm install
npm run dev
```


## Переменные окружения

| Переменная | Описание |
|------------|----------|
| `NEXT_PUBLIC_API_URL` | URL бэкенда  |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Client ID из Google Cloud Console для кнопки «Войти через Google». Если не задан — кнопка не показывается. |

Для Google OAuth в консоли укажите **Authorized redirect URI**:  
`https://<ваш-домен>/auth/callback` .

На Vercel и др. задайте `NEXT_PUBLIC_API_URL` и при необходимости `NEXT_PUBLIC_GOOGLE_CLIENT_ID` в настройках окружения.
