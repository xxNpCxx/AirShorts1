#!/bin/bash

# Исправленный тестовый скрипт с правильными эндпоинтами AKOOL API
# Использует официальные эндпоинты согласно документации Postman

set -e # Остановить выполнение при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

info() {
    echo -e "${PURPLE}[INFO]${NC} $1"
}

debug() {
    echo -e "${CYAN}[DEBUG]${NC} $1"
}

# Переменные окружения - ИСПРАВЛЕННЫЕ ЭНДПОИНТЫ
AKOOL_CLIENT_ID="mrj0kTxsc6LoKCEJX2oyyA=="
AKOOL_CLIENT_SECRET="J6QZyb+g0ucATnJa7MSG9QRm9FfVDsMF"
AKOOL_BASE_URL="https://openapi.akool.com/api/open/v3"

# Переменные для хранения данных
AKOOL_ACCESS_TOKEN=""
AKOOL_TASK_ID=""
RETRY_COUNT=0
MAX_RETRIES=5
BASE_DELAY=2
MAX_DELAY=30

# Функция для получения API токена AKOOL - ИСПРАВЛЕННЫЙ ЭНДПОИНТ
get_akool_token() {
    log "🔑 Получение API токена AKOOL (исправленный эндпоинт)..."
    
    # Используем правильный эндпоинт согласно документации
    local response=$(curl -s --max-time 10 -X POST "${AKOOL_BASE_URL}/auth" \
        -H "Content-Type: application/json" \
        -d "{\"clientId\": \"${AKOOL_CLIENT_ID}\", \"clientSecret\": \"${AKOOL_CLIENT_SECRET}\"}")

    debug "Ответ auth: $response"

    local code=$(echo "$response" | jq -r '.code // empty')
    local token=$(echo "$response" | jq -r '.token // empty')

    if [ "$code" = "1000" ] && [ -n "$token" ] && [ "$token" != "null" ]; then
        success "API токен AKOOL получен успешно"
        AKOOL_ACCESS_TOKEN="$token"
        echo "$AKOOL_ACCESS_TOKEN" > /tmp/akool_token.txt
        log "Токен сохранен в /tmp/akool_token.txt"
        return 0
    else
        error "Ошибка получения API токена AKOOL. Код: $code"
        echo "Полный ответ: $response"
        
        # Если новый эндпоинт не работает, пробуем старый
        warning "Пробую старый эндпоинт /getToken..."
        local old_response=$(curl -s --max-time 10 -X POST "${AKOOL_BASE_URL}/getToken" \
            -H "Content-Type: application/json" \
            -d "{\"clientId\": \"${AKOOL_CLIENT_ID}\", \"clientSecret\": \"${AKOOL_CLIENT_SECRET}\"}")
        
        debug "Ответ getToken (fallback): $old_response"
        
        local old_code=$(echo "$old_response" | jq -r '.code // empty')
        local old_token=$(echo "$old_response" | jq -r '.token // empty')
        
        if [ "$old_code" = "1000" ] && [ -n "$old_token" ] && [ "$old_token" != "null" ]; then
            success "API токен AKOOL получен через fallback эндпоинт"
            AKOOL_ACCESS_TOKEN="$old_token"
            echo "$AKOOL_ACCESS_TOKEN" > /tmp/akool_token.txt
            return 0
        else
            error "Оба эндпоинта не работают"
            return 1
        fi
    fi
}

# Функция для создания Talking Photo - ИСПРАВЛЕННЫЙ ЭНДПОИНТ
create_talking_photo_corrected() {
    local talking_photo_url="$1"
    local audio_url="$2"
    local webhook_url="$3"
    
    log "🎭 Создание Talking Photo (исправленный эндпоинт)..."
    
    if [ -z "$AKOOL_ACCESS_TOKEN" ]; then
        error "Сначала нужно получить токен AKOOL"
        return 1
    fi
    
    # Используем правильный эндпоинт согласно документации
    local response=$(curl -s --max-time 30 -X POST "${AKOOL_BASE_URL}/photo/talking" \
        -H "Authorization: Bearer ${AKOOL_ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"image_url\": \"${talking_photo_url}\", \"audio_url\": \"${audio_url}\", \"webhook_url\": \"${webhook_url}\"}")
    
    debug "Ответ photo/talking: $response"
    
    local code=$(echo "$response" | jq -r '.code // empty')
    local task_id=$(echo "$response" | jq -r '.data.task_id // empty')
    local msg=$(echo "$response" | jq -r '.msg // empty')
    
    if [ "$code" = "1000" ] && [ -n "$task_id" ] && [ "$task_id" != "null" ]; then
        success "✅ Запрос на создание Talking Photo отправлен успешно. Task ID: $task_id"
        AKOOL_TASK_ID="$task_id"
        echo "$AKOOL_TASK_ID" > /tmp/akool_task_id.txt
        return 0
    else
        error "❌ Ошибка создания Talking Photo. Код: $code"
        error "Сообщение: $msg"
        error "Полный ответ: $response"
        
        # Если новый эндпоинт не работает, пробуем старый
        warning "Пробую старый эндпоинт /content/video/createbytalkingphoto..."
        local old_response=$(curl -s --max-time 30 -X POST "${AKOOL_BASE_URL}/content/video/createbytalkingphoto" \
            -H "Authorization: Bearer ${AKOOL_ACCESS_TOKEN}" \
            -H "Content-Type: application/json" \
            -d "{\"talking_photo_url\": \"${talking_photo_url}\", \"audio_url\": \"${audio_url}\", \"webhookUrl\": \"${webhook_url}\"}")
        
        debug "Ответ createbytalkingphoto (fallback): $old_response"
        
        local old_code=$(echo "$old_response" | jq -r '.code // empty')
        local old_task_id=$(echo "$old_response" | jq -r '.data.task_id // empty')
        local old_msg=$(echo "$old_response" | jq -r '.msg // empty')
        
        if [ "$old_code" = "1000" ] && [ -n "$old_task_id" ] && [ "$old_task_id" != "null" ]; then
            success "✅ Запрос на создание Talking Photo отправлен через fallback эндпоинт. Task ID: $old_task_id"
            AKOOL_TASK_ID="$old_task_id"
            echo "$AKOOL_TASK_ID" > /tmp/akool_task_id.txt
            return 0
        else
            error "❌ Оба эндпоинта не работают"
            return 1
        fi
    fi
}

# Функция для проверки статуса видео - ИСПРАВЛЕННЫЙ ЭНДПОИНТ
check_video_status_corrected() {
    if [ -z "$AKOOL_ACCESS_TOKEN" ] || [ -z "$AKOOL_TASK_ID" ]; then
        error "Нужны токен AKOOL и Task ID"
        return 1
    fi
    
    log "🔍 Проверка статуса видео (исправленный эндпоинт) (Task ID: $AKOOL_TASK_ID)..."
    
    # Используем правильный эндпоинт согласно документации
    local response=$(curl -s --max-time 10 -X GET "${AKOOL_BASE_URL}/video/status/${AKOOL_TASK_ID}" \
        -H "Authorization: Bearer ${AKOOL_ACCESS_TOKEN}")
    
    debug "Ответ video/status: $response"
    
    local code=$(echo "$response" | jq -r '.code // empty')
    local status=$(echo "$response" | jq -r '.data.status // empty')
    local video_url=$(echo "$response" | jq -r '.data.video_url // empty')
    
    if [ "$code" = "1000" ]; then
        success "Статус видео: $status"
        if [ "$status" = "3" ]; then # 3 = completed
            success "Видео готово! URL: $video_url"
        elif [ "$status" = "2" ]; then # 2 = processing
            info "Видео обрабатывается..."
        elif [ "$status" = "4" ]; then # 4 = error
            error "Ошибка обработки видео"
        fi
        return 0
    else
        error "❌ Ошибка проверки статуса видео. Код: $code"
        echo "Сообщение: $(echo "$response" | jq -r '.msg // empty')"
        echo "Полный ответ: $response"
        
        # Если новый эндпоинт не работает, пробуем старый
        warning "Пробую старый эндпоинт /content/video/getvideostatus..."
        local old_response=$(curl -s --max-time 10 -X GET "${AKOOL_BASE_URL}/content/video/getvideostatus?task_id=${AKOOL_TASK_ID}" \
            -H "Authorization: Bearer ${AKOOL_ACCESS_TOKEN}")
        
        debug "Ответ getvideostatus (fallback): $old_response"
        
        local old_code=$(echo "$old_response" | jq -r '.code // empty')
        local old_status=$(echo "$old_response" | jq -r '.data.status // empty')
        local old_video_url=$(echo "$old_response" | jq -r '.data.video_url // empty')
        
        if [ "$old_code" = "1000" ]; then
            success "Статус видео (fallback): $old_status"
            if [ "$old_status" = "3" ]; then
                success "Видео готово! URL: $old_video_url"
            elif [ "$old_status" = "2" ]; then
                info "Видео обрабатывается..."
            elif [ "$old_status" = "4" ]; then
                error "Ошибка обработки видео"
            fi
            return 0
        else
            error "❌ Оба эндпоинта не работают"
            return 1
        fi
    fi
}

# Функция для тестирования всех эндпоинтов
test_all_endpoints() {
    log "🧪 Тестирование всех эндпоинтов AKOOL API..."
    
    # Тестовые данные
    local talking_photo_url="https://example.com/test_photo.jpg"
    local audio_url="https://example.com/test_audio.mp3"
    local webhook_url="https://webhook.site/your-unique-id"
    
    # Шаг 1: Получение токена
    info "=== ШАГ 1: Тестирование аутентификации ==="
    if get_akool_token; then
        success "Аутентификация работает"
    else
        error "Аутентификация не работает"
        return 1
    fi
    echo
    
    # Шаг 2: Создание Talking Photo
    info "=== ШАГ 2: Тестирование создания Talking Photo ==="
    if create_talking_photo_corrected "$talking_photo_url" "$audio_url" "$webhook_url"; then
        success "Создание Talking Photo работает"
        
        # Шаг 3: Проверка статуса
        info "=== ШАГ 3: Тестирование проверки статуса ==="
        check_video_status_corrected
    else
        error "Создание Talking Photo не работает"
        return 1
    fi
    echo
    
    success "🎉 Тестирование всех эндпоинтов завершено!"
}

# Функция для очистки временных файлов
cleanup() {
    log "🧹 Очищаю временные файлы..."
    rm -f /tmp/akool_token.txt
    rm -f /tmp/akool_task_id.txt
    success "Временные файлы удалены"
}

# Функция для отображения справки
show_help() {
    echo "Исправленный тестовый скрипт AKOOL API с правильными эндпоинтами"
    echo
    echo "Использование: $0 [опции]"
    echo
    echo "Опции:"
    echo "  -h, --help              Показать эту справку"
    echo "  --test-auth             Тестировать только аутентификацию"
    echo "  --test-photo            Тестировать только создание Talking Photo"
    echo "  --test-status           Тестировать только проверку статуса"
    echo
    echo "Примеры:"
    echo "  $0                      # Полное тестирование"
    echo "  $0 --test-auth          # Только аутентификация"
    echo "  $0 --test-photo         # Только создание фото"
}

# Обработка аргументов командной строки
TEST_AUTH_ONLY=false
TEST_PHOTO_ONLY=false
TEST_STATUS_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        --test-auth)
            TEST_AUTH_ONLY=true
            shift
            ;;
        --test-photo)
            TEST_PHOTO_ONLY=true
            shift
            ;;
        --test-status)
            TEST_STATUS_ONLY=true
            shift
            ;;
        *)
            error "Неизвестная опция: $1"
            show_help
            exit 1
            ;;
    esac
done

# Основная функция
main() {
    log "🚀 Тестирование исправленных эндпоинтов AKOOL API"
    echo
    
    if [ "$TEST_AUTH_ONLY" = true ]; then
        info "=== РЕЖИМ: Только аутентификация ==="
        get_akool_token
    elif [ "$TEST_PHOTO_ONLY" = true ]; then
        info "=== РЕЖИМ: Только создание Talking Photo ==="
        get_akool_token || exit 1
        create_talking_photo_corrected "https://example.com/test.jpg" "https://example.com/test.mp3" "https://webhook.site/test"
    elif [ "$TEST_STATUS_ONLY" = true ]; then
        info "=== РЕЖИМ: Только проверка статуса ==="
        get_akool_token || exit 1
        AKOOL_TASK_ID="test_task_id"
        check_video_status_corrected
    else
        test_all_endpoints
    fi
}

# Обработка сигналов для очистки
trap cleanup EXIT

# Запуск основной функции
main "$@"
