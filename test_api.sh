#!/bin/bash

# API тестирование
HEYGEN_API_KEY="MTdhNzdmMDU5YWMzNDU1N2JjZjA3YjVlNDgyYjAxNTItMTc1NzA0MTk3Mg=="
ELEVENLABS_API_KEY="sk_9532b2c4248147bdbb037ba4b0bc37efa3ea53098d5d813b"

echo "🔍 Тестирование API методов для создания цифрового аватара..."

echo ""
echo "1️⃣ Тестируем загрузку изображения..."
curl -s -X POST "https://upload.heygen.com/v1/asset" \
  -H "X-Api-Key: $HEYGEN_API_KEY" \
  -F "type=image" \
  -F "asset=@test_image.jpg" | jq '.'

echo ""
echo "2️⃣ Тестируем создание аудио ресурса..."
curl -s -X POST "https://api.heygen.com/v2/audio_assets" \
  -H "X-Api-Key: $HEYGEN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test_audio",
    "size": 1000,
    "content_type": "audio/mpeg"
  }' | jq '.'

echo ""
echo "3️⃣ Тестируем генерацию видео (с тестовыми данными)..."
curl -s -X POST "https://api.heygen.com/v2/video/generate" \
  -H "X-Api-Key: $HEYGEN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "video_inputs": [
      {
        "character": {
          "type": "talking_photo",
          "talking_photo_id": "test_photo_id",
          "scale": 1.0,
          "style": "normal"
        },
        "voice": {
          "type": "text",
          "input_text": "Тестовый текст",
          "voice_id": "test_voice_id"
        },
        "background": {
          "type": "color",
          "value": "#f6f6fc"
        }
      }
    ],
    "dimension": {
      "width": 1280,
      "height": 720
    }
  }' | jq '.'

echo ""
echo "4️⃣ Тестируем ElevenLabs - получение списка голосов..."
curl -s -X GET "https://api.elevenlabs.io/v1/voices" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" | jq '.'

echo ""
echo "5️⃣ Тестируем ElevenLabs - клонирование голоса..."
curl -s -X POST "https://api.elevenlabs.io/v1/voices/add" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test_voice",
    "files": ["data:audio/ogg;base64,T2dnUwACAAAAAAAAAAD//////////wEAAAAA"]
  }' | jq '.'

echo ""
echo "6️⃣ Тестируем ElevenLabs - генерация речи..."
curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB/stream" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Привет, это тест голоса",
    "model_id": "eleven_multilingual_v2",
    "voice_settings": {
      "stability": 0.5,
      "similarity_boost": 0.75
    }
  }' --output test_audio.ogg

echo ""
echo "✅ Тестирование завершено!"
