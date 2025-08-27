#!/bin/bash

echo "🔧 Сброс webhook для Telegram бота..."

# Проверяем переменную BOT_TOKEN
if [ -z "$BOT_TOKEN" ]; then
    echo "❌ Переменная BOT_TOKEN не установлена!"
    echo "Использование: BOT_TOKEN=your_token ./reset-webhook.sh"
    exit 1
fi

echo "📡 Проверяем текущий webhook..."
curl -s "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo" | jq '.'

echo ""
echo "🗑️ Удаляем старый webhook..."
curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/deleteWebhook"

echo ""
echo "⏳ Ждем 3 секунды..."
sleep 3

echo ""
echo "📡 Проверяем, что webhook удален..."
curl -s "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo" | jq '.'

echo ""
echo "✅ Webhook сброшен! Теперь можно перезапустить приложение."
echo "📝 После перезапуска приложение само установит новый webhook."
