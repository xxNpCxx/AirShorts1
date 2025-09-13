#!/bin/bash

# Тестовый скрипт с реальными данными для AKOOL API
# Использует реальные файлы из src/test/

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

# Пути к реальным файлам
REAL_IMAGE_PATH="src/test/myava.jpeg"
REAL_AUDIO_PATH="src/test/audio_me.ogg"
TEMP_MP3_PATH="/tmp/audio_me.mp3"

# Функция для проверки реальных файлов
check_real_files() {
    log "🔍 Проверка реальных тестовых файлов..."
    
    if [ ! -f "$REAL_IMAGE_PATH" ]; then
        error "Изображение не найдено: $REAL_IMAGE_PATH"
        return 1
    fi
    
    if [ ! -f "$REAL_AUDIO_PATH" ]; then
        error "Аудио файл не найден: $REAL_AUDIO_PATH"
        return 1
    fi
    
    # Показываем информацию о файлах
    local image_size=$(ls -lh "$REAL_IMAGE_PATH" | awk '{print $5}')
    local audio_size=$(ls -lh "$REAL_AUDIO_PATH" | awk '{print $5}')
    
    success "✅ Реальные файлы найдены:"
    info "  📸 Изображение: $REAL_IMAGE_PATH ($image_size)"
    info "  🎵 Аудио: $REAL_AUDIO_PATH ($audio_size)"
    
    return 0
}

# Функция для конвертации OGG в MP3
convert_audio_to_mp3() {
    log "🔄 Конвертация OGG в MP3..."
    
    if command -v ffmpeg &> /dev/null; then
        ffmpeg -i "$REAL_AUDIO_PATH" -acodec mp3 -ab 128k "$TEMP_MP3_PATH" -y
        success "✅ Аудио конвертировано в MP3: $TEMP_MP3_PATH"
        return 0
    elif command -v sox &> /dev/null; then
        sox "$REAL_AUDIO_PATH" "$TEMP_MP3_PATH"
        success "✅ Аудио конвертировано в MP3 с помощью sox: $TEMP_MP3_PATH"
        return 0
    else
        warning "⚠️ ffmpeg и sox не найдены, используем оригинальный OGG файл"
        return 1
    fi
}

# Функция для загрузки файлов в облачное хранилище (симуляция)
upload_files_to_cloud() {
    log "☁️ Загрузка файлов в облачное хранилище (симуляция)..."
    
    # В реальном проекте здесь была бы загрузка в S3, Google Drive, etc.
    # Пока создаем локальные URL для тестирования
    
    local image_url="file://$(pwd)/$REAL_IMAGE_PATH"
    local audio_url="file://$(pwd)/$REAL_AUDIO_PATH"
    
    # Если есть MP3 версия, используем её
    if [ -f "$TEMP_MP3_PATH" ]; then
        audio_url="file://$TEMP_MP3_PATH"
    fi
    
    success "✅ Файлы подготовлены для загрузки:"
    info "  📸 Изображение URL: $image_url"
    info "  🎵 Аудио URL: $audio_url"
    
    # Сохраняем URL для использования
    echo "$image_url" > /tmp/real_image_url.txt
    echo "$audio_url" > /tmp/real_audio_url.txt
    
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

# Функция для создания Talking Photo с реальными данными
create_talking_photo_real() {
    if [ -z "$AKOOL_ACCESS_TOKEN" ]; then
        error "Сначала нужно получить токен AKOOL"
        return 1
    fi
    
    log "🎭 Создание Talking Photo с реальными данными..."
    
    # Читаем URL из файлов
    local image_url=$(cat /tmp/real_image_url.txt)
    local audio_url=$(cat /tmp/real_audio_url.txt)
    local webhook_url="https://webhook.site/your-unique-id"
    
    info "Используемые файлы:"
    info "  📸 Изображение: $image_url"
    info "  🎵 Аудио: $audio_url"
    
    # Создаем запрос с реальными данными
    local response=$(curl -s --max-time 30 -X POST "${AKOOL_BASE_URL}/content/video/createbytalkingphoto" \
        -H "Authorization: Bearer ${AKOOL_ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"talking_photo_url\": \"${image_url}\", \"audio_url\": \"${audio_url}\", \"webhookUrl\": \"${webhook_url}\"}")

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
            warning "📋 Диагностика ошибки 1015 с реальными данными:"
            warning "  1. Проверьте доступность файлов по URL"
            warning "  2. Убедитесь, что файлы в поддерживаемом формате"
            warning "  3. Проверьте размер файлов"
            warning "  4. Попробуйте загрузить файлы в облачное хранилище"
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
create_real_data_report() {
    local report_file="/tmp/akool_real_data_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
=== ОТЧЕТ О ТЕСТИРОВАНИИ С РЕАЛЬНЫМИ ДАННЫМИ ===
Время: $(date)
Task ID: $AKOOL_TASK_ID

=== РЕАЛЬНЫЕ ФАЙЛЫ ===
Изображение: $REAL_IMAGE_PATH
Размер: $(ls -lh "$REAL_IMAGE_PATH" | awk '{print $5}')
Тип: $(file "$REAL_IMAGE_PATH" | cut -d: -f2)

Аудио: $REAL_AUDIO_PATH
Размер: $(ls -lh "$REAL_AUDIO_PATH" | awk '{print $5}')
Тип: $(file "$REAL_AUDIO_PATH" | cut -d: -f2)

=== ИСПОЛЬЗОВАННЫЕ URL ===
Image URL: $(cat /tmp/real_image_url.txt 2>/dev/null || echo "Не определен")
Audio URL: $(cat /tmp/real_audio_url.txt 2>/dev/null || echo "Не определен")

=== РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ ===
Токен получен: $([ -n "$AKOOL_ACCESS_TOKEN" ] && echo "Да" || echo "Нет")
Задача создана: $([ -n "$AKOOL_TASK_ID" ] && echo "Да" || echo "Нет")

=== РЕКОМЕНДАЦИИ ===
1. Используйте реальные файлы вместо тестовых URL
2. Загружайте файлы в облачное хранилище для публичного доступа
3. Убедитесь, что файлы в поддерживаемых форматах
4. Проверьте размер файлов (рекомендуется < 100MB)
EOF
    
    log "📄 Отчет с реальными данными создан: $report_file"
}

# Функция для очистки временных файлов
cleanup() {
    log "🧹 Очищаю временные файлы..."
    rm -f /tmp/akool_token.txt
    rm -f /tmp/akool_task_id.txt
    rm -f /tmp/real_image_url.txt
    rm -f /tmp/real_audio_url.txt
    rm -f "$TEMP_MP3_PATH"
    success "Временные файлы удалены"
}

# Основная функция
main() {
    log "🚀 Тестирование AKOOL API с реальными данными"
    echo
    
    # Шаг 1: Проверка реальных файлов
    info "=== ШАГ 1: Проверка реальных файлов ==="
    if ! check_real_files; then
        error "Реальные файлы не найдены. Прерываю тестирование."
        exit 1
    fi
    echo
    
    # Шаг 2: Конвертация аудио
    info "=== ШАГ 2: Подготовка аудио файла ==="
    convert_audio_to_mp3
    echo
    
    # Шаг 3: Загрузка файлов
    info "=== ШАГ 3: Подготовка файлов для загрузки ==="
    if ! upload_files_to_cloud; then
        error "Не удалось подготовить файлы. Прерываю тестирование."
        exit 1
    fi
    echo
    
    # Шаг 4: Получение токена
    info "=== ШАГ 4: Получение токена AKOOL ==="
    if ! get_akool_token; then
        error "Не удалось получить токен. Прерываю тестирование."
        exit 1
    fi
    echo
    
    # Шаг 5: Создание Talking Photo
    info "=== ШАГ 5: Создание Talking Photo с реальными данными ==="
    if create_talking_photo_real; then
        success "Talking Photo создан успешно"
        
        # Шаг 6: Проверка статуса
        info "=== ШАГ 6: Проверка статуса видео ==="
        check_video_status
    else
        error "Не удалось создать Talking Photo с реальными данными"
    fi
    echo
    
    # Создание отчета
    create_real_data_report
    
    success "🎉 Тестирование с реальными данными завершено!"
    info "Проверьте отчет выше для детальной информации"
}

# Обработка сигналов для очистки
trap cleanup EXIT

# Запуск основной функции
main "$@"
