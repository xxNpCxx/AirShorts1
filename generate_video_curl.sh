#!/bin/bash

# Скрипт для генерации видео через curl запросы
# Воспроизводит процесс из Telegram бота: загрузка фото + клонирование голоса + генерация видео

set -e  # Остановить выполнение при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для логирования
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Проверка наличия необходимых файлов
check_files() {
    log "Проверяю наличие необходимых файлов..."
    
    if [ ! -f "src/test/myava.jpeg" ]; then
        error "Файл myava.jpeg не найден в src/test/"
        exit 1
    fi
    
    if [ ! -f "src/test/audio_me.ogg" ]; then
        error "Файл audio_me.ogg не найден в src/test/"
        exit 1
    fi
    
    success "Все необходимые файлы найдены"
}

# Проверка переменных окружения
check_env() {
    log "Проверяю переменные окружения..."
    
    if [ -z "$HEYGEN_API_KEY" ]; then
        error "HEYGEN_API_KEY не установлен"
        echo "Установите переменную: export HEYGEN_API_KEY='your_api_key'"
        exit 1
    fi
    
    if [ -z "$ELEVENLABS_API_KEY" ]; then
        error "ELEVENLABS_API_KEY не установлен"
        echo "Установите переменную: export ELEVENLABS_API_KEY='your_api_key'"
        exit 1
    fi
    
    success "Переменные окружения настроены"
}

# Шаг 1: Загрузка изображения в HeyGen
upload_image_to_heygen() {
    log "Шаг 1: Загружаю изображение в HeyGen..."
    
    local response=$(curl -s --max-time 10 -X POST "https://upload.heygen.com/v1/asset" \
        -H "X-Api-Key: $HEYGEN_API_KEY" \
        -F "type=image" \
        -F "asset=@src/test/myava.jpeg")
    
    echo "Ответ HeyGen Upload Asset: $response"
    
    # Извлекаем image_key из ответа
    local image_key=$(echo "$response" | jq -r '.data.image_key // .image_key // empty')
    
    if [ -z "$image_key" ] || [ "$image_key" = "null" ]; then
        error "Не удалось получить image_key из ответа HeyGen"
        echo "Полный ответ: $response"
        exit 1
    fi
    
    success "Изображение загружено в HeyGen. Image Key: $image_key"
    echo "$image_key" > /tmp/heygen_image_key.txt
}

# Шаг 2: Клонирование голоса в ElevenLabs
clone_voice_in_elevenlabs() {
    log "Шаг 2: Клонирую голос в ElevenLabs..."
    
    local voice_name="test_voice_$(date +%s)"
    
    local response=$(curl -s --max-time 10 -X POST "https://api.elevenlabs.io/v1/voices/add" \
        -H "xi-api-key: $ELEVENLABS_API_KEY" \
        -F "name=$voice_name" \
        -F "description=Клонированный голос для тестирования" \
        -F "files=@src/test/audio_me.ogg" \
        -F 'labels={"accent":"russian","age":"young_adult","gender":"neutral","use_case":"conversational"}')
    
    echo "Ответ ElevenLabs Voice Clone: $response"
    
    # Извлекаем voice_id из ответа
    local voice_id=$(echo "$response" | jq -r '.voice_id // empty')
    
    if [ -z "$voice_id" ] || [ "$voice_id" = "null" ]; then
        error "Не удалось получить voice_id из ответа ElevenLabs"
        echo "Полный ответ: $response"
        exit 1
    fi
    
    success "Голос клонирован в ElevenLabs. Voice ID: $voice_id"
    echo "$voice_id" > /tmp/elevenlabs_voice_id.txt
}

# Шаг 3: Генерация аудио с клонированным голосом
generate_audio_with_cloned_voice() {
    log "Шаг 3: Генерирую аудио с клонированным голосом..."
    
    local voice_id=$(cat /tmp/elevenlabs_voice_id.txt)
    local script="Ну вот, а теперь я записываю свою голосовую запись"
    
    local response=$(curl -s --max-time 10 -X POST "https://api.elevenlabs.io/v1/text-to-speech/$voice_id" \
        -H "xi-api-key: $ELEVENLABS_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"text\": \"$script\",
            \"model_id\": \"eleven_multilingual_v2\",
            \"voice_settings\": {
                \"stability\": 0.5,
                \"similarity_boost\": 0.75,
                \"style\": 0.0,
                \"use_speaker_boost\": true
            }
        }")
    
    # Сохраняем аудио в файл
    echo "$response" > /tmp/generated_audio.mp3
    
    success "Аудио сгенерировано и сохранено в /tmp/generated_audio.mp3"
}

# Шаг 4: Загрузка аудио в HeyGen
upload_audio_to_heygen() {
    log "Шаг 4: Загружаю аудио в HeyGen..."
    
    # Сначала создаем аудио-ресурс
    local create_response=$(curl -s --max-time 10 -X POST "https://api.heygen.com/v2/audio_assets" \
        -H "X-Api-Key: $HEYGEN_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"test_audio_$(date +%s)\",
            \"size\": $(stat -f%z /tmp/generated_audio.mp3),
            \"content_type\": \"audio/mpeg\"
        }")
    
    echo "Ответ создания аудио-ресурса: $create_response"
    
    local audio_asset_id=$(echo "$create_response" | jq -r '.data.id // .id // empty')
    local upload_url=$(echo "$create_response" | jq -r '.data.upload_url // .upload_url // empty')
    
    if [ -z "$audio_asset_id" ] || [ "$audio_asset_id" = "null" ]; then
        error "Не удалось получить audio_asset_id"
        exit 1
    fi
    
    if [ -z "$upload_url" ] || [ "$upload_url" = "null" ]; then
        error "Не удалось получить upload_url"
        exit 1
    fi
    
    # Загружаем файл на presigned URL
    local upload_response=$(curl -s --max-time 10 -X PUT "$upload_url" \
        -H "Content-Type: audio/mpeg" \
        --data-binary @/tmp/generated_audio.mp3)
    
    success "Аудио загружено в HeyGen. Audio Asset ID: $audio_asset_id"
    echo "$audio_asset_id" > /tmp/heygen_audio_asset_id.txt
}

# Шаг 5: Генерация видео с TalkingPhoto
generate_video_with_talking_photo() {
    log "Шаг 5: Генерирую видео с TalkingPhoto..."
    
    local image_key=$(cat /tmp/heygen_image_key.txt)
    local audio_asset_id=$(cat /tmp/heygen_audio_asset_id.txt)
    
    # Извлекаем UUID из image_key (убираем префиксы)
    local talking_photo_id=$(echo "$image_key" | sed 's/^image\///' | sed 's/\/original$//')
    
    log "Использую talking_photo_id: $talking_photo_id"
    
    local response=$(curl -s --max-time 10 -X POST "https://api.heygen.com/v2/video/generate" \
        -H "X-API-KEY: $HEYGEN_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"video_inputs\": [
                {
                    \"character\": {
                        \"type\": \"talking_photo\",
                        \"talking_photo_id\": \"$talking_photo_id\",
                        \"scale\": 1.0,
                        \"style\": \"normal\"
                    },
                    \"voice\": {
                        \"type\": \"audio\",
                        \"audio_asset_id\": \"$audio_asset_id\"
                    },
                    \"background\": {
                        \"type\": \"color\",
                        \"value\": \"#f6f6fc\"
                    }
                }
            ],
            \"dimension\": {
                \"width\": 1280,
                \"height\": 720
            }
        }")
    
    echo "Ответ генерации видео: $response"
    
    local video_id=$(echo "$response" | jq -r '.data.video_id // .video_id // empty')
    
    if [ -z "$video_id" ] || [ "$video_id" = "null" ]; then
        error "Не удалось получить video_id из ответа"
        echo "Полный ответ: $response"
        exit 1
    fi
    
    success "Видео создано! Video ID: $video_id"
    echo "$video_id" > /tmp/heygen_video_id.txt
}

# Шаг 6: Проверка статуса видео
check_video_status() {
    log "Шаг 6: Проверяю статус генерации видео..."
    
    local video_id=$(cat /tmp/heygen_video_id.txt)
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log "Попытка $attempt/$max_attempts: Проверяю статус видео $video_id"
        
        local response=$(curl -s --max-time 10 -X GET "https://api.heygen.com/v1/video_status.get?video_id=$video_id" \
            -H "X-API-KEY: $HEYGEN_API_KEY")
        
        echo "Статус видео: $response"
        
        local status=$(echo "$response" | jq -r '.data.status // empty')
        local video_url=$(echo "$response" | jq -r '.data.video_url // empty')
        
        if [ "$status" = "completed" ] && [ -n "$video_url" ] && [ "$video_url" != "null" ]; then
            success "Видео готово! URL: $video_url"
            echo "$video_url" > /tmp/final_video_url.txt
            return 0
        elif [ "$status" = "failed" ]; then
            error "Генерация видео не удалась"
            echo "Полный ответ: $response"
            return 1
        fi
        
        log "Статус: $status. Ожидаю 10 секунд..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    warning "Превышено максимальное количество попыток. Видео может быть еще в обработке."
    return 1
}

# Очистка временных файлов
cleanup() {
    log "Очищаю временные файлы..."
    rm -f /tmp/heygen_image_key.txt
    rm -f /tmp/elevenlabs_voice_id.txt
    rm -f /tmp/generated_audio.mp3
    rm -f /tmp/heygen_audio_asset_id.txt
    rm -f /tmp/heygen_video_id.txt
    success "Временные файлы удалены"
}

# Основная функция
main() {
    log "🚀 Начинаю процесс генерации видео через curl"
    log "Используемые файлы:"
    log "  📸 Изображение: src/test/myava.jpeg"
    log "  🎵 Аудио: src/test/audio_me.ogg"
    log "  📝 Текст: 'Ну вот, а теперь я записываю свою голосовую запись'"
    echo
    
    check_files
    check_env
    echo
    
    upload_image_to_heygen
    echo
    
    clone_voice_in_elevenlabs
    echo
    
    generate_audio_with_cloned_voice
    echo
    
    upload_audio_to_heygen
    echo
    
    generate_video_with_talking_photo
    echo
    
    check_video_status
    echo
    
    if [ -f "/tmp/final_video_url.txt" ]; then
        local final_url=$(cat /tmp/final_video_url.txt)
        success "🎉 Процесс завершен успешно!"
        success "📹 Финальное видео: $final_url"
    else
        warning "⚠️ Процесс завершен, но видео может быть еще в обработке"
        warning "Проверьте статус вручную через HeyGen API"
    fi
    
    cleanup
}

# Обработка сигналов для очистки
trap cleanup EXIT

# Запуск основной функции
main "$@"
