#!/bin/bash

# Тестовый скрипт для проверки AKOOL API
# Использует только curl для тестирования

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# AKOOL API credentials
CLIENT_ID="mrj0kTxsc6LoKCEJX2oyyA=="
CLIENT_SECRET="J6QZyb+g0ucATnJa7MSG9QRm9FfVDsMF"
BASE_URL="https://openapi.akool.com/api/open/v3"

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

# Тест 1: Получение API токена
test_get_token() {
    log "Тест 1: Получение API токена AKOOL..."
    
    local response=$(curl -s --max-time 10 -X POST "$BASE_URL/getToken" \
        -H "Content-Type: application/json" \
        -d "{
            \"clientId\": \"$CLIENT_ID\",
            \"clientSecret\": \"$CLIENT_SECRET\"
        }")
    
    echo "Ответ getToken: $response"
    
    local code=$(echo "$response" | jq -r '.code // empty')
    local token=$(echo "$response" | jq -r '.token // empty')
    
    if [ "$code" = "1000" ] && [ -n "$token" ]; then
        success "API токен получен успешно"
        echo "$token" > /tmp/akool_token.txt
        log "Токен сохранен в /tmp/akool_token.txt"
    else
        error "Ошибка получения API токена. Код: $code"
        echo "Сообщение: $(echo "$response" | jq -r '.msg // empty')"
        return 1
    fi
}

# Тест 2: Получение списка видео
test_list_videos() {
    log "Тест 2: Получение списка видео..."
    
    if [ ! -f "/tmp/akool_token.txt" ]; then
        error "Сначала нужно получить токен"
        return 1
    fi
    
    local token=$(cat /tmp/akool_token.txt)
    
    local response=$(curl -s --max-time 10 -X GET "$BASE_URL/content/video/list" \
        -H "Authorization: Bearer $token")
    
    echo "Ответ list videos: $response"
    
    local code=$(echo "$response" | jq -r '.code // empty')
    
    if [ "$code" = "1000" ]; then
        success "Список видео получен успешно"
        local count=$(echo "$response" | jq -r '.data.count // 0')
        log "Найдено видео: $count"
    else
        error "Ошибка получения списка видео. Код: $code"
        echo "Сообщение: $(echo "$response" | jq -r '.msg // empty')"
    fi
}

# Тест 3: Создание Talking Photo (с тестовыми URL)
test_create_talking_photo() {
    log "Тест 3: Создание Talking Photo..."
    
    if [ ! -f "/tmp/akool_token.txt" ]; then
        error "Сначала нужно получить токен"
        return 1
    fi
    
    local token=$(cat /tmp/akool_token.txt)
    local task_id="test_$(date +%s)"
    
    local response=$(curl -s --max-time 10 -X POST "$BASE_URL/content/video/createbytalkingphoto" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "{
            \"talking_photo_url\": \"https://example.com/test_photo.jpg\",
            \"audio_url\": \"https://example.com/test_audio.mp3\",
            \"webhookUrl\": \"https://webhook.site/unique-id\"
        }")
    
    echo "Ответ create talking photo: $response"
    
    local code=$(echo "$response" | jq -r '.code // empty')
    
    if [ "$code" = "1000" ]; then
        success "Talking Photo создан успешно"
        local task_id=$(echo "$response" | jq -r '.data.task_id // empty')
        if [ -n "$task_id" ]; then
            log "Task ID: $task_id"
            echo "$task_id" > /tmp/akool_task_id.txt
        fi
    else
        error "Ошибка создания Talking Photo. Код: $code"
        echo "Сообщение: $(echo "$response" | jq -r '.msg // empty')"
    fi
}

# Тест 4: Проверка статуса видео
test_video_status() {
    log "Тест 4: Проверка статуса видео..."
    
    if [ ! -f "/tmp/akool_token.txt" ] || [ ! -f "/tmp/akool_task_id.txt" ]; then
        error "Сначала нужно получить токен и создать задачу"
        return 1
    fi
    
    local token=$(cat /tmp/akool_token.txt)
    local task_id=$(cat /tmp/akool_task_id.txt)
    
    local response=$(curl -s --max-time 10 -X GET "$BASE_URL/content/video/status/$task_id" \
        -H "Authorization: Bearer $token")
    
    echo "Ответ video status: $response"
    
    local code=$(echo "$response" | jq -r '.code // empty')
    
    if [ "$code" = "1000" ]; then
        success "Статус видео получен успешно"
        local status=$(echo "$response" | jq -r '.data.video_status // empty')
        log "Статус: $status (1: в очереди, 2: в процессе, 3: завершено, 4: ошибка)"
    else
        error "Ошибка получения статуса видео. Код: $code"
        echo "Сообщение: $(echo "$response" | jq -r '.msg // empty')"
    fi
}

# Тест 5: Получение информации об аккаунте
test_account_info() {
    log "Тест 5: Получение информации об аккаунте..."
    
    if [ ! -f "/tmp/akool_token.txt" ]; then
        error "Сначала нужно получить токен"
        return 1
    fi
    
    local token=$(cat /tmp/akool_token.txt)
    
    local response=$(curl -s --max-time 10 -X GET "$BASE_URL/user/info" \
        -H "Authorization: Bearer $token")
    
    echo "Ответ account info: $response"
    
    local code=$(echo "$response" | jq -r '.code // empty')
    
    if [ "$code" = "1000" ]; then
        success "Информация об аккаунте получена успешно"
        local email=$(echo "$response" | jq -r '.data.email // empty')
        local name=$(echo "$response" | jq -r '.data.firstName // empty')
        log "Email: $email, Name: $name"
    else
        error "Ошибка получения информации об аккаунте. Код: $code"
        echo "Сообщение: $(echo "$response" | jq -r '.msg // empty')"
    fi
}

# Тест 6: Получение доступных инструментов
test_available_tools() {
    log "Тест 6: Получение доступных инструментов..."
    
    if [ ! -f "/tmp/akool_token.txt" ]; then
        error "Сначала нужно получить токен"
        return 1
    fi
    
    local token=$(cat /tmp/akool_token.txt)
    
    local response=$(curl -s --max-time 10 -X GET "$BASE_URL/tools/list" \
        -H "Authorization: Bearer $token")
    
    echo "Ответ tools list: $response"
    
    local code=$(echo "$response" | jq -r '.code // empty')
    
    if [ "$code" = "1000" ]; then
        success "Список инструментов получен успешно"
        local count=$(echo "$response" | jq -r '.data | length // 0')
        log "Доступно инструментов: $count"
    else
        error "Ошибка получения списка инструментов. Код: $code"
        echo "Сообщение: $(echo "$response" | jq -r '.msg // empty')"
    fi
}

# Очистка временных файлов
cleanup() {
    log "Очищаю временные файлы..."
    rm -f /tmp/akool_*.txt
    success "Временные файлы удалены"
}

# Основная функция
main() {
    log "🚀 Начинаю тестирование AKOOL API"
    echo
    
    test_get_token
    echo
    
    test_list_videos
    echo
    
    test_create_talking_photo
    echo
    
    test_video_status
    echo
    
    test_account_info
    echo
    
    test_available_tools
    echo
    
    success "🎉 Тестирование AKOOL API завершено!"
    
    cleanup
}

# Обработка сигналов для очистки
trap cleanup EXIT

# Запуск основной функции
main "$@"
