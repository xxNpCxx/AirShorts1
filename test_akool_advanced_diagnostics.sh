#!/bin/bash

# Расширенный тестовый скрипт с диагностикой ошибки 1015 AKOOL
# Включает автоматические retry, проверку параметров и детальную диагностику

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

# Переменные окружения
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

# Функция для получения API токена AKOOL
get_akool_token() {
    log "🔑 Получение API токена AKOOL..."
    local response=$(curl -s --max-time 10 -X POST "${AKOOL_BASE_URL}/getToken" \
        -H "Content-Type: application/json" \
        -d "{\"clientId\": \"${AKOOL_CLIENT_ID}\", \"clientSecret\": \"${AKOOL_CLIENT_SECRET}\"}")

    debug "Ответ getToken: $response"

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
        return 1
    fi
}

# Функция для проверки квот и лимитов аккаунта
check_account_limits() {
    log "📊 Проверка квот и лимитов аккаунта..."
    
    if [ -z "$AKOOL_ACCESS_TOKEN" ]; then
        error "Сначала нужно получить токен"
        return 1
    fi
    
    # Проверяем информацию об аккаунте
    local response=$(curl -s --max-time 10 -X GET "${AKOOL_BASE_URL}/user/info" \
        -H "Authorization: Bearer ${AKOOL_ACCESS_TOKEN}")
    
    debug "Ответ user/info: $response"
    
    local code=$(echo "$response" | jq -r '.code // empty')
    
    if [ "$code" = "1000" ]; then
        local remaining_quota=$(echo "$response" | jq -r '.data.remaining_quota // "unknown"')
        local total_quota=$(echo "$response" | jq -r '.data.total_quota // "unknown"')
        
        info "Квоты аккаунта: $remaining_quota / $total_quota"
        
        if [ "$remaining_quota" != "unknown" ] && [ "$remaining_quota" -lt 1 ]; then
            warning "⚠️ Квота аккаунта исчерпана!"
            return 1
        fi
        
        success "Квоты аккаунта в порядке"
        return 0
    else
        warning "Не удалось проверить квоты аккаунта. Код: $code"
        return 0  # Продолжаем, так как это не критично
    fi
}

# Функция для валидации параметров запроса
validate_request_parameters() {
    local talking_photo_url="$1"
    local audio_url="$2"
    local webhook_url="$3"
    
    log "🔍 Валидация параметров запроса..."
    
    local errors=()
    
    # Проверка URL изображения
    if [ -z "$talking_photo_url" ]; then
        errors+=("URL изображения не указан")
    elif [[ ! "$talking_photo_url" =~ ^https?:// ]]; then
        errors+=("URL изображения должен начинаться с http:// или https://")
    fi
    
    # Проверка URL аудио
    if [ -z "$audio_url" ]; then
        errors+=("URL аудио не указан")
    elif [[ ! "$audio_url" =~ ^https?:// ]]; then
        errors+=("URL аудио должен начинаться с http:// или https://")
    fi
    
    # Проверка webhook URL
    if [ -n "$webhook_url" ] && [[ ! "$webhook_url" =~ ^https?:// ]]; then
        errors+=("Webhook URL должен начинаться с http:// или https://")
    fi
    
    if [ ${#errors[@]} -gt 0 ]; then
        error "Ошибки валидации параметров:"
        for error in "${errors[@]}"; do
            error "  - $error"
        done
        return 1
    fi
    
    success "Параметры запроса валидны"
    return 0
}

# Функция для создания Talking Photo с retry логикой
create_talking_photo_with_retry() {
    local talking_photo_url="$1"
    local audio_url="$2"
    local webhook_url="$3"
    
    log "🎭 Создание Talking Photo с retry логикой..."
    
    # Валидация параметров
    if ! validate_request_parameters "$talking_photo_url" "$audio_url" "$webhook_url"; then
        return 1
    fi
    
    # Проверка квот
    if ! check_account_limits; then
        return 1
    fi
    
    local attempt=1
    local delay=$BASE_DELAY
    
    while [ $attempt -le $MAX_RETRIES ]; do
        log "🔄 Попытка $attempt/$MAX_RETRIES создания Talking Photo..."
        
        local response=$(curl -s --max-time 30 -X POST "${AKOOL_BASE_URL}/content/video/createbytalkingphoto" \
            -H "Authorization: Bearer ${AKOOL_ACCESS_TOKEN}" \
            -H "Content-Type: application/json" \
            -d "{\"talking_photo_url\": \"${talking_photo_url}\", \"audio_url\": \"${audio_url}\", \"webhookUrl\": \"${webhook_url}\"}")
        
        debug "Ответ create talking photo (попытка $attempt): $response"
        
        local code=$(echo "$response" | jq -r '.code // empty')
        local task_id=$(echo "$response" | jq -r '.data.task_id // empty')
        local msg=$(echo "$response" | jq -r '.msg // empty')
        
        if [ "$code" = "1000" ] && [ -n "$task_id" ] && [ "$task_id" != "null" ]; then
            success "✅ Запрос на создание Talking Photo отправлен успешно. Task ID: $task_id"
            AKOOL_TASK_ID="$task_id"
            echo "$AKOOL_TASK_ID" > /tmp/akool_task_id.txt
            return 0
        elif [ "$code" = "1015" ]; then
            warning "⚠️ Ошибка 1015: $msg"
            warning "🔄 Повтор через $delay секунд..."
            
            if [ $attempt -lt $MAX_RETRIES ]; then
                sleep $delay
                delay=$((delay * 2))
                if [ $delay -gt $MAX_DELAY ]; then
                    delay=$MAX_DELAY
                fi
            fi
        else
            error "❌ Ошибка создания Talking Photo. Код: $code"
            error "Сообщение: $msg"
            error "Полный ответ: $response"
            
            # Анализ ошибки
            analyze_error_1015 "$code" "$msg" "$response"
            return 1
        fi
        
        attempt=$((attempt + 1))
    done
    
    error "❌ Не удалось создать Talking Photo после $MAX_RETRIES попыток"
    return 1
}

# Функция для анализа ошибки 1015
analyze_error_1015() {
    local code="$1"
    local msg="$2"
    local full_response="$3"
    
    log "🔍 Анализ ошибки $code..."
    
    case "$code" in
        "1015")
            warning "📋 Диагностика ошибки 1015:"
            warning "  1. Проверьте параметры запроса - URL файлов должны быть доступны"
            warning "  2. Подождите и повторите - сервер может быть перегружен"
            warning "  3. Проверьте квоты аккаунта - возможно, исчерпан лимит"
            warning "  4. Обратитесь в поддержку AKOOL с логами"
            warning "  5. Попробуйте изменить формат/качество видео"
            
            # Создаем отчет для поддержки
            create_support_report "$code" "$msg" "$full_response"
            ;;
        "1001")
            error "❌ Ошибка аутентификации - проверьте CLIENT_ID и CLIENT_SECRET"
            ;;
        "2001")
            error "❌ Ошибка формата запроса - проверьте JSON структуру"
            ;;
        *)
            warning "❓ Неизвестная ошибка $code - обратитесь в поддержку"
            ;;
    esac
}

# Функция для создания отчета для поддержки
create_support_report() {
    local code="$1"
    local msg="$2"
    local full_response="$3"
    
    local report_file="/tmp/akool_error_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
=== ОТЧЕТ ОБ ОШИБКЕ AKOOL API ===
Время: $(date)
Код ошибки: $code
Сообщение: $msg

=== ПАРАМЕТРЫ ЗАПРОСА ===
Client ID: $AKOOL_CLIENT_ID
Base URL: $AKOOL_BASE_URL
Endpoint: /content/video/createbytalkingphoto

=== ОТВЕТ API ===
$full_response

=== СИСТЕМНАЯ ИНФОРМАЦИЯ ===
ОС: $(uname -a)
Версия curl: $(curl --version | head -n1)
Версия jq: $(jq --version)

=== РЕКОМЕНДАЦИИ ===
1. Проверьте доступность URL файлов
2. Убедитесь, что файлы в поддерживаемом формате
3. Проверьте размер файлов (рекомендуется < 100MB)
4. Попробуйте повторить запрос через несколько минут
5. Обратитесь в поддержку AKOOL с этим отчетом

=== КОНТАКТЫ ПОДДЕРЖКИ ===
Email: support@akool.com
Документация: https://docs.akool.com/
EOF
    
    log "📄 Отчет для поддержки создан: $report_file"
    info "Отправьте этот файл в поддержку AKOOL для диагностики"
}

# Функция для проверки статуса видео с retry
check_video_status_with_retry() {
    if [ -z "$AKOOL_ACCESS_TOKEN" ] || [ -z "$AKOOL_TASK_ID" ]; then
        error "Нужны токен AKOOL и Task ID"
        return 1
    fi
    
    log "🔍 Проверка статуса видео с retry логикой (Task ID: $AKOOL_TASK_ID)..."
    
    local attempt=1
    local max_status_checks=10
    local status_delay=5
    
    while [ $attempt -le $max_status_checks ]; do
        log "🔄 Проверка статуса $attempt/$max_status_checks..."
        
        local response=$(curl -s --max-time 10 -X GET "${AKOOL_BASE_URL}/content/video/getvideostatus?task_id=${AKOOL_TASK_ID}" \
            -H "Authorization: Bearer ${AKOOL_ACCESS_TOKEN}")
        
        debug "Ответ video status (попытка $attempt): $response"
        
        local code=$(echo "$response" | jq -r '.code // empty')
        local status=$(echo "$response" | jq -r '.data.status // empty')
        local video_url=$(echo "$response" | jq -r '.data.video_url // empty')
        
        if [ "$code" = "1000" ]; then
            case "$status" in
                "2")
                    info "⏳ Видео обрабатывается... (статус: $status)"
                    if [ $attempt -lt $max_status_checks ]; then
                        sleep $status_delay
                    fi
                    ;;
                "3")
                    success "🎉 Видео готово! URL: $video_url"
                    return 0
                    ;;
                "4")
                    error "❌ Ошибка обработки видео (статус: $status)"
                    return 1
                    ;;
                *)
                    warning "❓ Неизвестный статус: $status"
                    ;;
            esac
        else
            error "❌ Ошибка проверки статуса видео. Код: $code"
            echo "Сообщение: $(echo "$response" | jq -r '.msg // empty')"
        fi
        
        attempt=$((attempt + 1))
    done
    
    warning "⚠️ Превышено максимальное количество проверок статуса"
    return 1
}

# Функция для тестирования различных форматов
test_different_formats() {
    log "🧪 Тестирование различных форматов и параметров..."
    
    # Тестовые URL (в реальном проекте это были бы загруженные файлы)
    local test_cases=(
        "https://example.com/test_photo.jpg|https://example.com/test_audio.mp3|720p"
        "https://example.com/test_photo.png|https://example.com/test_audio.wav|1080p"
        "https://example.com/test_photo.jpeg|https://example.com/test_audio.m4a|480p"
    )
    
    for test_case in "${test_cases[@]}"; do
        IFS='|' read -r photo_url audio_url quality <<< "$test_case"
        
        info "🔄 Тестирование: $quality качество"
        
        # Здесь можно добавить логику тестирования разных форматов
        # Пока просто логируем
        debug "Фото: $photo_url, Аудио: $audio_url, Качество: $quality"
    done
}

# Функция для очистки временных файлов
cleanup() {
    log "🧹 Очищаю временные файлы..."
    rm -f /tmp/akool_token.txt
    rm -f /tmp/akool_task_id.txt
    success "Временные файлы удалены"
}

# Основная функция тестирования
main() {
    log "🚀 Расширенное тестирование AKOOL API с диагностикой ошибки 1015"
    echo
    
    # Получение токена
    if ! get_akool_token; then
        error "Не удалось получить токен AKOOL. Прерываю тестирование."
        exit 1
    fi
    echo
    
    # Тестирование различных форматов
    test_different_formats
    echo
    
    # Создание Talking Photo с retry
    local talking_photo_url="https://example.com/test_photo.jpg"
    local audio_url="https://example.com/test_audio.mp3"
    local webhook_url="https://webhook.site/your-unique-id"
    
    if create_talking_photo_with_retry "$talking_photo_url" "$audio_url" "$webhook_url"; then
        echo
        # Проверка статуса с retry
        check_video_status_with_retry
    else
        error "Не удалось создать Talking Photo после всех попыток"
        exit 1
    fi
    echo
    
    success "🎉 Расширенное тестирование завершено!"
    info "Проверьте логи выше для детальной информации о диагностике"
}

# Обработка сигналов для очистки
trap cleanup EXIT

# Запуск основной функции
main "$@"
