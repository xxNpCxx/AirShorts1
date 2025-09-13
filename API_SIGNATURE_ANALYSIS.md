# 🔍 Анализ сигнатур AKOOL API

## 📋 Сравнение с официальной документацией

После изучения официальной документации AKOOL API в [Postman](https://www.postman.com/akoolai/team-workspace/folder/wl1p2dw/v3), обнаружены несоответствия в используемых эндпоинтах.

## ❌ Обнаруженные несоответствия

### 1. Аутентификация
**Наши скрипты:**
```bash
POST /api/open/v3/getToken
```

**Официальная документация:**
```bash
POST /auth
```

### 2. Создание Talking Photo
**Наши скрипты:**
```bash
POST /api/open/v3/content/video/createbytalkingphoto
```

**Официальная документация:**
```bash
POST /photo/talking
```

### 3. Проверка статуса видео
**Наши скрипты:**
```bash
GET /api/open/v3/content/video/getvideostatus?task_id={task_id}
```

**Официальная документация:**
```bash
GET /video/status/{task_id}
```

## ✅ Правильные эндпоинты согласно документации

### Аутентификация
```bash
POST /auth
Content-Type: application/json

{
  "clientId": "your_client_id",
  "clientSecret": "your_client_secret"
}
```

### Создание Talking Photo
```bash
POST /photo/talking
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "image_url": "https://example.com/image.jpg",
  "audio_url": "https://example.com/audio.mp3",
  "webhook_url": "https://your-webhook.com/callback"
}
```

### Проверка статуса
```bash
GET /video/status/{task_id}
Authorization: Bearer {access_token}
```

## 🔧 Необходимые исправления

Нужно обновить все скрипты для использования правильных эндпоинтов согласно официальной документации AKOOL API.
