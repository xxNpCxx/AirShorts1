#!/bin/bash

# Скрипт для настройки webhook в ElevenLabs
# Использование: ./setup-elevenlabs-webhook.sh

echo "🔧 Настройка webhook для ElevenLabs..."

# Проверяем наличие API ключа
if [ -z "$ELEVENLABS_API_KEY" ]; then
    echo "❌ Ошибка: ELEVENLABS_API_KEY не установлен"
    echo "Установите переменную окружения: export ELEVENLABS_API_KEY=your_api_key"
    exit 1
fi

# Проверяем наличие URL webhook
if [ -z "$ELEVENLABS_WEBHOOK_URL" ]; then
    echo "❌ Ошибка: ELEVENLABS_WEBHOOK_URL не установлен"
    echo "Установите переменную окружения: export ELEVENLABS_WEBHOOK_URL=https://your-domain.com/elevenlabs/webhook"
    exit 1
fi

echo "📡 Настраиваю webhook: $ELEVENLABS_WEBHOOK_URL"

# Настраиваем webhook через ElevenLabs API
curl -X POST "https://api.elevenlabs.io/v1/webhooks" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "'$ELEVENLABS_WEBHOOK_URL'",
    "events": ["voice.created", "voice.updated", "voice.deleted", "voice.failed"],
    "description": "AirShorts Bot Voice Cloning Webhook"
  }'

echo ""
echo "✅ Webhook настроен успешно!"
echo "📋 События: voice.created, voice.updated, voice.deleted, voice.failed"
echo "🔗 URL: $ELEVENLABS_WEBHOOK_URL"
