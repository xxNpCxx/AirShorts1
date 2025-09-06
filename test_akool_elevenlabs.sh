#!/bin/bash

# Скрипт для тестирования AKOOL + ElevenLabs интеграции
# Создает говорящее фото с клонированным голосом

set -e # Остановить выполнение при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
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

# Переменные окружения
AKOOL_CLIENT_ID="mrj0kTxsc6LoKCEJX2oyyA=="
AKOOL_CLIENT_SECRET="J6QZyb+g0ucATnJa7MSG9QRm9FfVDsMF"
AKOOL_BASE_URL="https://openapi.akool.com/api/open/v3"

# Переменная для хранения токена
AKOOL_ACCESS_TOKEN=""

# Функция для получения API токена
get_akool_token() {
    log "🔑 Получение API токена AKOOL..."
    local response=$(curl -s --max-time 10 -X POST "${AKOOL_BASE_URL}/getToken" \
        -H "Content-Type: application/json" \
        -d "{\"clientId\": \"${AKOOL_CLIENT_ID}\", \"clientSecret\": \"${AKOOL_CLIENT_SECRET}\"}")

    echo "Ответ getToken: $response"

    local code=$(echo "$response" | jq -r '.code // empty')
    local token=$(echo "$response" | jq -r '.token // empty')

    if [ "$code" = "1000" ] && [ -n "$token" ] && [ "$token" != "null" ]; then
        success "API токен получен успешно"
        AKOOL_ACCESS_TOKEN="$token"
        echo "$AKOOL_ACCESS_TOKEN" > /tmp/akool_token.txt
        log "Токен сохранен в /tmp/akool_token.txt"
        return 0
    else
        error "Ошибка получения API токена. Код: $code"
        echo "Полный ответ: $response"
        return 1
    fi
}

# Функция для создания Talking Photo с тестовыми данными
create_talking_photo_test() {
    if [ -z "$AKOOL_ACCESS_TOKEN" ]; then
        error "Сначала нужно получить токен"
        return 1
    fi
    
    log "🎭 Создание Talking Photo с тестовыми данными..."
    
    # Используем тестовые URL (в реальном проекте это будут загруженные файлы)
    local talking_photo_url="https://example.com/test_photo.jpg"
    local audio_url="https://example.com/test_audio.mp3"
    local webhook_url="https://webhook.site/your-unique-id"

    local response=$(curl -s --max-time 10 -X POST "${AKOOL_BASE_URL}/content/video/createbytalkingphoto" \
        -H "Authorization: Bearer ${AKOOL_ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"talking_photo_url\": \"${talking_photo_url}\", \"audio_url\": \"${audio_url}\", \"webhookUrl\": \"${webhook_url}\"}")

    echo "Ответ create talking photo: $response"

    local code=$(echo "$response" | jq -r '.code // empty')
    local task_id=$(echo "$response" | jq -r '.data.task_id // empty')

    if [ "$code" = "1000" ] && [ -n "$task_id" ] && [ "$task_id" != "null" ]; then
        success "Запрос на создание Talking Photo отправлен успешно. Task ID: $task_id"
        echo "$task_id" > /tmp/akool_task_id.txt
        return 0
    else
        error "Ошибка создания Talking Photo. Код: $code"
        echo "Сообщение: $(echo "$response" | jq -r '.msg // empty')"
        echo "Полный ответ: $response"
        return 1
    fi
}

# Функция для проверки статуса видео
check_video_status() {
    if [ -z "$AKOOL_ACCESS_TOKEN" ]; then
        error "Сначала нужно получить токен"
        return 1
    fi
    if [ ! -f "/tmp/akool_task_id.txt" ]; then
        error "Сначала нужно создать задачу"
        return 1
    fi
    
    local task_id=$(cat /tmp/akool_task_id.txt)
    log "🔍 Проверка статуса видео (Task ID: $task_id)..."

    local response=$(curl -s --max-time 10 -X GET "${AKOOL_BASE_URL}/content/video/getvideostatus?task_id=${task_id}" \
        -H "Authorization: Bearer ${AKOOL_ACCESS_TOKEN}")

    echo "Ответ video status: $response"

    local code=$(echo "$response" | jq -r '.code // empty')
    local status=$(echo "$response" | jq -r '.data.status // empty')
    local video_url=$(echo "$response" | jq -r '.data.video_url // empty')

    if [ "$code" = "1000" ]; then
        success "Статус видео: $status"
        if [ "$status" = "3" ]; then # 3 = completed
            success "Видео готово! URL: $video_url"
        fi
        return 0
    else
        error "Ошибка проверки статуса видео. Код: $code"
        echo "Сообщение: $(echo "$response" | jq -r '.msg // empty')"
        echo "Полный ответ: $response"
        return 1
    fi
}

# Очистка временных файлов
cleanup() {
    log "🧹 Очищаю временные файлы..."
    rm -f /tmp/akool_token.txt
    rm -f /tmp/akool_task_id.txt
    success "Временные файлы удалены"
}

# Основная функция
main() {
    log "🚀 Начинаю тестирование AKOOL + ElevenLabs интеграции"
    echo

    get_akool_token || exit 1
    echo

    create_talking_photo_test || true # Не останавливаемся, если ошибка создания
    echo

    check_video_status || true # Не останавливаемся, если ошибка статуса
    echo

    cleanup
}

# Обработка сигналов для очистки
trap cleanup EXIT

# Запуск основной функции
main "$@"
