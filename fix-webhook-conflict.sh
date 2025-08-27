#!/bin/bash

# 🔧 Скрипт для исправления конфликта webhook/polling
# Удаляет существующий webhook и устанавливает новый

BOT_TOKEN="8462345506:AAEjL9aOKB6_J1YbrR-YgkKmRUawBfxoTfY"
WEBHOOK_URL="https://airshorts1.onrender.com/webhook"

echo "🔧 Исправление конфликта webhook/polling..."
echo "============================================"

# 1. Удаляем существующий webhook
echo "1️⃣ Удаление существующего webhook..."
DELETE_RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook" \
  -H "Content-Type: application/json" \
  -d '{"drop_pending_updates": true}')

echo "Ответ Telegram: $DELETE_RESPONSE"

if echo "$DELETE_RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Webhook успешно удален"
else
    echo "⚠️ Возможна ошибка при удалении webhook"
fi

# 2. Ждем 3 секунды для обработки
echo "⏳ Ожидание 3 секунды..."
sleep 3

# 3. Устанавливаем новый webhook
echo "2️⃣ Установка нового webhook..."
SET_RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"${WEBHOOK_URL}\",
    \"drop_pending_updates\": true,
    \"allowed_updates\": [\"message\", \"callback_query\", \"inline_query\"]
  }")

echo "Ответ Telegram: $SET_RESPONSE"

if echo "$SET_RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Webhook успешно установлен"
else
    echo "❌ Ошибка при установке webhook"
fi

# 4. Проверяем статус webhook
echo "3️⃣ Проверка статуса webhook..."
INFO_RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")

echo "Информация о webhook:"
echo "$INFO_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$INFO_RESPONSE"

echo ""
echo "✅ Скрипт завершен!"
echo "🚀 Теперь перезапустите приложение на хостинге"
