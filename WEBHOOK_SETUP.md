# 🔗 Настройка Webhook для Telegram Bot

## 📋 Ваши данные бота

- **Bot Token**: `8462345506:AAEjL9aOKB6_J1YbrR-YgkKmRUawBfxoTfY`
- **Username**: @your_bot_username (узнайте у @BotFather)

## 🚀 Настройка Webhook

### 1. Локальная разработка (ngrok)

Если вы тестируете локально, используйте ngrok для создания публичного URL:

```bash
# Установите ngrok
npm install -g ngrok

# Запустите туннель на порт 3000
ngrok http 3000

# Скопируйте HTTPS URL (например: https://abc123.ngrok.io)
```

### 2. Установка Webhook

Замените `YOUR_DOMAIN` на ваш домен или ngrok URL:

```bash
# Для локальной разработки с ngrok
curl -X POST "https://api.telegram.org/bot8462345506:AAEjL9aOKB6_J1YbrR-YgkKmRUawBfxoTfY/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://YOUR_DOMAIN/webhook"}'

# Пример с ngrok
curl -X POST "https://api.telegram.org/bot8462345506:AAEjL9aOKB6_J1YbrR-YgkKmRUawBfxoTfY/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://abc123.ngrok.io/webhook"}'
```

### 3. Проверка Webhook

```bash
# Проверьте статус webhook
curl "https://api.telegram.org/bot8462345506:AAEjL9aOKB6_J1YbrR-YgkKmRUawBfxoTfY/getWebhookInfo"
```

### 4. Удаление Webhook (если нужно)

```bash
# Удалите webhook
curl -X POST "https://api.telegram.org/bot8462345506:AAEjL9aOKB6_J1YbrR-YgkKmRUawBfxoTfY/deleteWebhook"
```

## 🌐 Production настройка

### Render.com

1. **Создайте сервис** на Render.com
2. **Подключите GitHub** репозиторий
3. **Настройте переменные окружения**:
   ```
   BOT_TOKEN=8462345506:AAEjL9aOKB6_J1YbrR-YgkKmRUawBfxoTfY
   DATABASE_URL=your_postgresql_url
   REDIS_URL=your_redis_url
   DID_API_KEY=eHhucGN4eEBnbWFpbC5jb20:coOsJoP3VqEWDKyQ7FobG
   ```
4. **Установите webhook** на ваш Render.com домен:
   ```bash
   curl -X POST "https://api.telegram.org/bot8462345506:AAEjL9aOKB6_J1YbrR-YgkKmRUawBfxoTfY/setWebhook" \
        -H "Content-Type: application/json" \
        -d '{"url": "https://your-app.onrender.com/webhook"}'
   ```

## 🧪 Тестирование

### 1. Запустите бота
```bash
npm run start:dev
```

### 2. Отправьте команду в Telegram
```
/start
```

### 3. Проверьте логи
```bash
# В другом терминале
tail -f logs/app.log
```

## 🔍 Отладка

### Проблемы с Webhook

1. **Ошибка 404**: Проверьте URL и путь `/webhook`
2. **Ошибка SSL**: Убедитесь, что используете HTTPS
3. **Ошибка порта**: Проверьте, что порт 3000 открыт

### Проверка статуса

```bash
# Полная информация о webhook
curl "https://api.telegram.org/bot8462345506:AAEjL9aOKB6_J1YbrR-YgkKmRUawBfxoTfY/getWebhookInfo" | jq
```

## 📱 Ссылки

- **Ваш бот**: https://t.me/your_bot_username
- **BotFather**: https://t.me/BotFather
- **Telegram Bot API**: https://core.telegram.org/bots/api

---

**Важно**: После настройки webhook бот будет работать только через webhook, а не через long polling.
