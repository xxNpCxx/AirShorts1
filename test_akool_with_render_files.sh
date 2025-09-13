#!/bin/bash

# Тестовый скрипт AKOOL API с файлами через Render сервер
# Использует реальные файлы через публичные URL с вашего сервера

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

# URL вашего сервера на Render
RENDER_SERVER_URL="https://airshorts1.onrender.com"

# Переменные для хранения данных
AKOOL_ACCESS_TOKEN=""
AKOOL_TASK_ID=""
IMAGE_URL=""
AUDIO_URL=""

# Функция для проверки доступности сервера Render
check_render_server() {
    log "🌐 Проверка доступности сервера Render..."
    
    local response=$(curl -s --max-time 10 -X GET "${RENDER_SERVER_URL}/test-files/list")
    
    if echo "$response" | jq -e '.files' > /dev/null 2>&1; then
        success "✅ Сервер Render доступен"
        
        # Извлекаем URL файлов
        IMAGE_URL=$(echo "$response" | jq -r '.files[] | select(.name == "myava.jpeg") | .url')
        AUDIO_URL=$(echo "$response" | jq -r '.files[] | select(.name == "audio_me.ogg") | .url')
        
        info "📸 Изображение URL: $IMAGE_URL"
        info "🎵 Аудио URL: $AUDIO_URL"
        
        return 0
    else
        error "❌ Сервер Render недоступен или не отвечает"
        echo "Ответ: $response"
        return 1
    fi
}

# Функция для проверки доступности файлов
check_files_accessibility() {
    log "🔍 Проверка доступности файлов..."
    
    # Проверяем изображение
    local image_response=$(curl -s --max-time 10 -I "$IMAGE_URL")
    if echo "$image_response" | grep -q "200 OK"; then
        success "✅ Изображение доступно"
    else
        error "❌ Изображение недоступно"
        return 1
    fi
    
    # Проверяем аудио
    local audio_response=$(curl -s --max-time 10 -I "$AUDIO_URL")
    if echo "$audio_response" | grep -q "200 OK"; then
        success "✅ Аудио файл доступен"
    else
        error "❌ Аудио файл недоступен"
        return 1
    fi
    
    return 0
}

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
        return 0
    else
        error "Ошибка получения API токена AKOOL. Код: $code"
        echo "Полный ответ: $response"
        return 1
    fi
}

# Функция для создания Talking Photo с реальными файлами
create_talking_photo_with_real_files() {
    if [ -z "$AKOOL_ACCESS_TOKEN" ]; then
        error "Сначала нужно получить токен AKOOL"
        return 1
    fi
    
    if [ -z "$IMAGE_URL" ] || [ -z "$AUDIO_URL" ]; then
        error "URL файлов не определены"
        return 1
    fi
    
    log "🎭 Создание Talking Photo с реальными файлами через Render..."
    
    info "Используемые файлы:"
    info "  📸 Изображение: $IMAGE_URL"
    info "  🎵 Аудио: $AUDIO_URL"
    
    local webhook_url="https://webhook.site/your-unique-id"
    
    # Создаем запрос с реальными URL файлов
    local response=$(curl -s --max-time 30 -X POST "${AKOOL_BASE_URL}/content/video/createbytalkingphoto" \
        -H "Authorization: Bearer ${AKOOL_ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"talking_photo_url\": \"${IMAGE_URL}\", \"audio_url\": \"${AUDIO_URL}\", \"webhookUrl\": \"${webhook_url}\"}")

    debug "Ответ create talking photo: $response"

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
        
        # Анализ ошибки
        if [ "$code" = "1015" ]; then
            warning "📋 Диагностика ошибки 1015 с реальными файлами:"
            warning "  1. Файлы доступны по URL: $IMAGE_URL, $AUDIO_URL"
            warning "  2. Проверьте формат файлов (JPG/PNG для изображения, MP3/WAV/OGG для аудио)"
            warning "  3. Проверьте размер файлов"
            warning "  4. Возможно, сервер AKOOL перегружен"
        elif [ "$code" = "2001" ]; then
            warning "📋 Ошибка формата запроса:"
            warning "  1. Проверьте структуру JSON"
            warning "  2. Убедитесь, что URL файлов корректны"
        fi
        
        return 1
    fi
}

# Функция для проверки статуса видео
check_video_status() {
    if [ -z "$AKOOL_ACCESS_TOKEN" ] || [ -z "$AKOOL_TASK_ID" ]; then
        error "Нужны токен AKOOL и Task ID"
        return 1
    fi
    
    log "🔍 Проверка статуса видео (Task ID: $AKOOL_TASK_ID)..."
    
    local response=$(curl -s --max-time 10 -X GET "${AKOOL_BASE_URL}/content/video/getvideostatus?task_id=${AKOOL_TASK_ID}" \
        -H "Authorization: Bearer ${AKOOL_ACCESS_TOKEN}")
    
    debug "Ответ video status: $response"
    
    local code=$(echo "$response" | jq -r '.code // empty')
    local status=$(echo "$response" | jq -r '.data.status // empty')
    local video_url=$(echo "$response" | jq -r '.data.video_url // empty')
    
    if [ "$code" = "1000" ]; then
        success "Статус видео: $status"
        if [ "$status" = "3" ]; then # 3 = completed
            success "🎉 Видео готово! URL: $video_url"
        elif [ "$status" = "2" ]; then # 2 = processing
            info "⏳ Видео обрабатывается..."
        elif [ "$status" = "4" ]; then # 4 = error
            error "❌ Ошибка обработки видео"
        fi
        return 0
    else
        error "❌ Ошибка проверки статуса видео. Код: $code"
        echo "Сообщение: $(echo "$response" | jq -r '.msg // empty')"
        return 1
    fi
}

# Функция для создания отчета с реальными данными
create_real_files_report() {
    local report_file="/tmp/akool_real_files_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
=== ОТЧЕТ О ТЕСТИРОВАНИИ С РЕАЛЬНЫМИ ФАЙЛАМИ ЧЕРЕЗ RENDER ===
Время: $(date)
Task ID: $AKOOL_TASK_ID
Render Server: $RENDER_SERVER_URL

=== ИСПОЛЬЗОВАННЫЕ ФАЙЛЫ ===
Изображение URL: $IMAGE_URL
Аудио URL: $AUDIO_URL

=== РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ ===
Сервер Render доступен: $([ -n "$IMAGE_URL" ] && echo "Да" || echo "Нет")
Файлы доступны: $([ -n "$IMAGE_URL" ] && [ -n "$AUDIO_URL" ] && echo "Да" || echo "Нет")
Токен получен: $([ -n "$AKOOL_ACCESS_TOKEN" ] && echo "Да" || echo "Нет")
Задача создана: $([ -n "$AKOOL_TASK_ID" ] && echo "Да" || echo "Нет")

=== ПРЕИМУЩЕСТВА РЕАЛЬНЫХ ФАЙЛОВ ===
1. Файлы доступны по публичным URL
2. AKOOL может получить доступ к файлам
3. Реальные форматы и размеры файлов
4. Более точное тестирование API

=== РЕКОМЕНДАЦИИ ===
1. Используйте реальные файлы вместо тестовых URL
2. Загружайте файлы на ваш сервер Render
3. Убедитесь, что файлы в поддерживаемых форматах
4. Проверьте размер файлов (рекомендуется < 100MB)
EOF
    
    log "📄 Отчет с реальными файлами создан: $report_file"
}

# Функция для очистки временных файлов
cleanup() {
    log "🧹 Очищаю временные файлы..."
    rm -f /tmp/akool_token.txt
    rm -f /tmp/akool_task_id.txt
    success "Временные файлы удалены"
}

# Основная функция
main() {
    log "🚀 Тестирование AKOOL API с реальными файлами через Render сервер"
    echo
    
    # Шаг 1: Проверка сервера Render
    info "=== ШАГ 1: Проверка сервера Render ==="
    if ! check_render_server; then
        error "Сервер Render недоступен. Прерываю тестирование."
        exit 1
    fi
    echo
    
    # Шаг 2: Проверка доступности файлов
    info "=== ШАГ 2: Проверка доступности файлов ==="
    if ! check_files_accessibility; then
        error "Файлы недоступны. Прерываю тестирование."
        exit 1
    fi
    echo
    
    # Шаг 3: Получение токена
    info "=== ШАГ 3: Получение токена AKOOL ==="
    if ! get_akool_token; then
        error "Не удалось получить токен. Прерываю тестирование."
        exit 1
    fi
    echo
    
    # Шаг 4: Создание Talking Photo
    info "=== ШАГ 4: Создание Talking Photo с реальными файлами ==="
    if create_talking_photo_with_real_files; then
        success "Talking Photo создан успешно"
        
        # Шаг 5: Проверка статуса
        info "=== ШАГ 5: Проверка статуса видео ==="
        check_video_status
    else
        error "Не удалось создать Talking Photo с реальными файлами"
    fi
    echo
    
    # Создание отчета
    create_real_files_report
    
    success "🎉 Тестирование с реальными файлами через Render завершено!"
    info "Проверьте отчет выше для детальной информации"
}

# Обработка сигналов для очистки
trap cleanup EXIT

# Запуск основной функции
main "$@"
