#!/bin/bash

# Тестовый скрипт для проверки HeyGen API методов
# Использует только curl для тестирования

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для логирования
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

# Проверка переменных окружения
check_env() {
    log "Проверяю переменные окружения..."
    
    if [ -z "$HEYGEN_API_KEY" ]; then
        error "HEYGEN_API_KEY не установлен"
        echo "Установите переменную: export HEYGEN_API_KEY='your_api_key'"
        exit 1
    fi
    
    success "HEYGEN_API_KEY настроен"
}

# Тест 1: Получение списка аватаров
test_avatar_list() {
    log "Тест 1: Получение списка аватаров..."
    
    local response=$(curl -s --max-time 5 -X GET "https://api.heygen.com/v1/avatar.list" \
        -H "X-API-KEY: $HEYGEN_API_KEY")
    
    echo "Ответ avatar.list: $response"
    
    local code=$(echo "$response" | jq -r '.code // empty')
    
    if [ "$code" = "0" ]; then
        success "Список аватаров получен успешно"
        local count=$(echo "$response" | jq -r '.data.avatars | length')
        log "Найдено аватаров: $count"
    else
        error "Ошибка получения списка аватаров. Код: $code"
        echo "Сообщение: $(echo "$response" | jq -r '.message // empty')"
    fi
}

# Тест 2: Загрузка изображения
test_upload_image() {
    log "Тест 2: Загрузка изображения..."
    
    if [ ! -f "test/myava.jpeg" ]; then
        error "Файл test/myava.jpeg не найден"
        return 1
    fi
    
    local response=$(curl -s --max-time 5 -X POST "https://upload.heygen.com/v1/asset" \
        -H "X-Api-Key: $HEYGEN_API_KEY" \
        -F "type=image" \
        -F "asset=@test/myava.jpeg")
    
    echo "Ответ upload asset: $response"
    
    local image_key=$(echo "$response" | jq -r '.data.image_key // .image_key // empty')
    
    if [ -n "$image_key" ] && [ "$image_key" != "null" ]; then
        success "Изображение загружено успешно. Image Key: $image_key"
        echo "$image_key" > /tmp/test_image_key.txt
    else
        error "Ошибка загрузки изображения"
        echo "Полный ответ: $response"
    fi
}

# Тест 3: Создание Photo Avatar
test_create_photo_avatar() {
    log "Тест 3: Создание Photo Avatar..."
    
    if [ ! -f "/tmp/test_image_key.txt" ]; then
        error "Сначала нужно загрузить изображение"
        return 1
    fi
    
    local image_key=$(cat /tmp/test_image_key.txt)
    local callback_id="test_photo_avatar_$(date +%s)"
    
    local response=$(curl -s --max-time 5 -X POST "https://api.heygen.com/v2/avatar/create" \
        -H "X-API-KEY: $HEYGEN_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"Test Photo Avatar $(date +%s)\",
            \"photo_url\": \"$image_key\",
            \"callback_url\": \"https://webhook.site/unique-id\",
            \"callback_id\": \"$callback_id\"
        }")
    
    echo "Ответ create photo avatar: $response"
    
    local avatar_id=$(echo "$response" | jq -r '.data.avatar_id // .avatar_id // empty')
    
    if [ -n "$avatar_id" ] && [ "$avatar_id" != "null" ]; then
        success "Photo Avatar создан успешно. Avatar ID: $avatar_id"
        echo "$avatar_id" > /tmp/test_avatar_id.txt
    else
        error "Ошибка создания Photo Avatar"
        echo "Полный ответ: $response"
    fi
}

# Тест 4: Загрузка аудио
test_upload_audio() {
    log "Тест 4: Загрузка аудио..."
    
    if [ ! -f "test/audio_me.ogg" ]; then
        error "Файл test/audio_me.ogg не найден"
        return 1
    fi
    
    local response=$(curl -s --max-time 5 -X POST "https://upload.heygen.com/v1/asset" \
        -H "X-Api-Key: $HEYGEN_API_KEY" \
        -F "type=audio" \
        -F "asset=@test/audio_me.ogg")
    
    echo "Ответ upload audio: $response"
    
    local audio_key=$(echo "$response" | jq -r '.data.audio_key // .audio_key // empty')
    
    if [ -n "$audio_key" ] && [ "$audio_key" != "null" ]; then
        success "Аудио загружено успешно. Audio Key: $audio_key"
        echo "$audio_key" > /tmp/test_audio_key.txt
    else
        error "Ошибка загрузки аудио"
        echo "Полный ответ: $response"
    fi
}

# Тест 5: Создание Voice Clone
test_create_voice_clone() {
    log "Тест 5: Создание Voice Clone..."
    
    if [ ! -f "/tmp/test_audio_key.txt" ]; then
        error "Сначала нужно загрузить аудио"
        return 1
    fi
    
    local audio_key=$(cat /tmp/test_audio_key.txt)
    local callback_id="test_voice_clone_$(date +%s)"
    
    local response=$(curl -s --max-time 5 -X POST "https://api.heygen.com/v2/voice/create" \
        -H "X-API-KEY: $HEYGEN_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"Test Voice Clone $(date +%s)\",
            \"audio_url\": \"$audio_key\",
            \"callback_url\": \"https://webhook.site/unique-id\",
            \"callback_id\": \"$callback_id\"
        }")
    
    echo "Ответ create voice clone: $response"
    
    local voice_id=$(echo "$response" | jq -r '.data.voice_id // .voice_id // empty')
    
    if [ -n "$voice_id" ] && [ "$voice_id" != "null" ]; then
        success "Voice Clone создан успешно. Voice ID: $voice_id"
        echo "$voice_id" > /tmp/test_voice_id.txt
    else
        error "Ошибка создания Voice Clone"
        echo "Полный ответ: $response"
    fi
}

# Тест 6: Генерация видео
test_generate_video() {
    log "Тест 6: Генерация видео..."
    
    if [ ! -f "/tmp/test_avatar_id.txt" ] || [ ! -f "/tmp/test_voice_id.txt" ]; then
        error "Сначала нужно создать аватар и голос"
        return 1
    fi
    
    local avatar_id=$(cat /tmp/test_avatar_id.txt)
    local voice_id=$(cat /tmp/test_voice_id.txt)
    local script="Привет! Это тестовое видео, созданное через HeyGen API."
    
    local response=$(curl -s --max-time 5 -X POST "https://api.heygen.com/v2/video/generate" \
        -H "X-API-KEY: $HEYGEN_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"video_inputs\": [
                {
                    \"character\": {
                        \"type\": \"avatar\",
                        \"avatar_id\": \"$avatar_id\",
                        \"avatar_style\": \"normal\"
                    },
                    \"voice\": {
                        \"type\": \"text\",
                        \"input_text\": \"$script\",
                        \"voice_id\": \"$voice_id\"
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
            },
            \"callback_id\": \"test_video_$(date +%s)\"
        }")
    
    echo "Ответ generate video: $response"
    
    local video_id=$(echo "$response" | jq -r '.data.video_id // .video_id // empty')
    
    if [ -n "$video_id" ] && [ "$video_id" != "null" ]; then
        success "Видео создано успешно. Video ID: $video_id"
        echo "$video_id" > /tmp/test_video_id.txt
    else
        error "Ошибка создания видео"
        echo "Полный ответ: $response"
    fi
}

# Тест 7: Проверка статуса видео
test_video_status() {
    log "Тест 7: Проверка статуса видео..."
    
    if [ ! -f "/tmp/test_video_id.txt" ]; then
        error "Сначала нужно создать видео"
        return 1
    fi
    
    local video_id=$(cat /tmp/test_video_id.txt)
    
    local response=$(curl -s --max-time 5 -X GET "https://api.heygen.com/v1/video_status.get?video_id=$video_id" \
        -H "X-API-KEY: $HEYGEN_API_KEY")
    
    echo "Ответ video status: $response"
    
    local status=$(echo "$response" | jq -r '.data.status // empty')
    
    if [ -n "$status" ]; then
        success "Статус видео получен: $status"
    else
        error "Ошибка получения статуса видео"
        echo "Полный ответ: $response"
    fi
}

# Очистка временных файлов
cleanup() {
    log "Очищаю временные файлы..."
    rm -f /tmp/test_*.txt
    success "Временные файлы удалены"
}

# Основная функция
main() {
    log "🚀 Начинаю тестирование HeyGen API методов"
    echo
    
    check_env
    echo
    
    test_avatar_list
    echo
    
    test_upload_image
    echo
    
    test_create_photo_avatar
    echo
    
    test_upload_audio
    echo
    
    test_create_voice_clone
    echo
    
    test_generate_video
    echo
    
    test_video_status
    echo
    
    success "🎉 Тестирование HeyGen API завершено!"
    
    cleanup
}

# Обработка сигналов для очистки
trap cleanup EXIT

# Запуск основной функции
main "$@"
