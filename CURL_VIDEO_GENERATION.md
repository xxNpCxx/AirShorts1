# 🎬 Генерация видео через curl запросы

Этот скрипт воспроизводит весь процесс генерации видео из Telegram бота, но используя только curl запросы.

## 📋 Что делает скрипт

Скрипт выполняет следующие шаги:

1. **📸 Загрузка изображения в HeyGen** - загружает `src/test/myava.jpeg`
2. **🎤 Клонирование голоса в ElevenLabs** - использует `src/test/audio_me.ogg`
3. **🗣️ Генерация аудио** - создает аудио с текстом "Ну вот, а теперь я записываю свою голосовую запись"
4. **🎵 Загрузка аудио в HeyGen** - загружает сгенерированное аудио
5. **🎬 Генерация видео** - создает TalkingPhoto видео с клонированным голосом
6. **⏳ Проверка статуса** - отслеживает готовность видео

## 🚀 Использование

### 1. Установите переменные окружения

```bash
export HEYGEN_API_KEY="your_heygen_api_key_here"
export ELEVENLABS_API_KEY="your_elevenlabs_api_key_here"
```

### 2. Запустите скрипт

```bash
./generate_video_curl.sh
```

## 📁 Необходимые файлы

Скрипт использует следующие файлы из папки `src/test/`:

- `myava.jpeg` - ваше изображение для аватара
- `audio_me.ogg` - ваша аудиозапись для клонирования голоса

## 🔧 Требования

- `curl` - для HTTP запросов
- `jq` - для парсинга JSON ответов
- `stat` - для получения размера файлов
- API ключи HeyGen и ElevenLabs

## 📊 Что происходит на каждом шаге

### Шаг 1: Загрузка изображения
```bash
curl -X POST "https://upload.heygen.com/v1/asset" \
  -H "X-Api-Key: $HEYGEN_API_KEY" \
  -F "type=image" \
  -F "asset=@src/test/myava.jpeg"
```

### Шаг 2: Клонирование голоса
```bash
curl -X POST "https://api.elevenlabs.io/v1/voices/add" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -F "name=test_voice_$(date +%s)" \
  -F "files=@src/test/audio_me.ogg"
```

### Шаг 3: Генерация аудио
```bash
curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/$voice_id" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "Ну вот, а теперь я записываю свою голосовую запись", ...}'
```

### Шаг 4: Загрузка аудио в HeyGen
```bash
# Создание аудио-ресурса
curl -X POST "https://api.heygen.com/v2/audio_assets" \
  -H "X-Api-Key: $HEYGEN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "test_audio", "size": 12345, "content_type": "audio/mpeg"}'

# Загрузка файла
curl -X PUT "$upload_url" \
  -H "Content-Type: audio/mpeg" \
  --data-binary @/tmp/generated_audio.mp3
```

### Шаг 5: Генерация видео
```bash
curl -X POST "https://api.heygen.com/v2/video/generate" \
  -H "X-API-KEY: $HEYGEN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "video_inputs": [{
      "character": {
        "type": "talking_photo",
        "talking_photo_id": "extracted_id",
        "scale": 1.0,
        "style": "normal"
      },
      "voice": {
        "type": "audio",
        "audio_asset_id": "audio_asset_id"
      },
      "background": {
        "type": "color",
        "value": "#f6f6fc"
      }
    }],
    "dimension": {
      "width": 1280,
      "height": 720
    }
  }'
```

## 🎯 Результат

После успешного выполнения скрипт выведет:
- URL готового видео
- Сохранит URL в файл `/tmp/final_video_url.txt`

## 🐛 Отладка

Скрипт выводит подробную информацию о каждом шаге:
- Ответы API
- ID созданных ресурсов
- Статус обработки

## 🧹 Очистка

Скрипт автоматически удаляет временные файлы при завершении.

## ⚠️ Важные замечания

1. **API ключи** должны быть действительными
2. **Файлы** должны существовать в указанных путях
3. **Интернет соединение** должно быть стабильным
4. **Обработка** может занять несколько минут

## 🔄 Альтернативные варианты

Если что-то не работает, можно:

1. Проверить API ключи
2. Убедиться, что файлы существуют
3. Проверить логи ошибок
4. Запустить отдельные curl команды вручную
