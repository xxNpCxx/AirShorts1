#!/bin/bash

# Комплексный тестовый скрипт для проверки AKOOL + ELEVENLABS интеграции
# Тестирует весь процесс создания видео с клонированием голоса

set -e # Остановить выполнение при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
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

# Переменные окружения
AKOOL_CLIENT_ID="mrj0kTxsc6LoKCEJX2oyyA=="
AKOOL_CLIENT_SECRET="J6QZyb+g0ucATnJa7MSG9QRm9FfVDsMF"
AKOOL_BASE_URL="https://openapi.akool.com/api/open/v3"

ELEVENLABS_API_KEY=""
ELEVENLABS_BASE_URL="https://api.elevenlabs.io/v1"

# Переменные для хранения данных
AKOOL_ACCESS_TOKEN=""
ELEVENLABS_VOICE_ID=""
AKOOL_TASK_ID=""
TEST_PHOTO_URL=""
TEST_AUDIO_URL=""
TEST_TEXT="Привет! Это тестовое сообщение для проверки работы клонирования голоса."

# Функция для проверки зависимостей
check_dependencies() {
    log "🔍 Проверяю зависимости..."
    
    if ! command -v curl &> /dev/null; then
        error "curl не найден. Установите curl для продолжения."
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        error "jq не найден. Установите jq для продолжения."
        exit 1
    fi
    
    if ! command -v base64 &> /dev/null; then
        error "base64 не найден. Установите base64 для продолжения."
        exit 1
    fi
    
    success "Все зависимости найдены"
}

# Функция для получения API токена AKOOL
get_akool_token() {
    log "🔑 Получение API токена AKOOL..."
    local response=$(curl -s --max-time 10 -X POST "${AKOOL_BASE_URL}/getToken" \
        -H "Content-Type: application/json" \
        -d "{\"clientId\": \"${AKOOL_CLIENT_ID}\", \"clientSecret\": \"${AKOOL_CLIENT_SECRET}\"}")

    echo "Ответ getToken: $response"

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

# Функция для проверки ElevenLabs API ключа
check_elevenlabs_key() {
    log "🔑 Проверка ElevenLabs API ключа..."
    
    if [ -z "$ELEVENLABS_API_KEY" ]; then
        warning "ELEVENLABS_API_KEY не установлен. Пропускаю тесты ElevenLabs."
        return 1
    fi
    
    local response=$(curl -s --max-time 10 -X GET "${ELEVENLABS_BASE_URL}/voices" \
        -H "xi-api-key: ${ELEVENLABS_API_KEY}")
    
    if echo "$response" | jq -e '.voices' > /dev/null 2>&1; then
        success "ElevenLabs API ключ валиден"
        return 0
    else
        error "ElevenLabs API ключ невалиден или ошибка API"
        echo "Ответ: $response"
        return 1
    fi
}

# Функция для создания тестового аудио файла
create_test_audio() {
    log "🎵 Создание тестового аудио файла..."
    
    # Создаем простой WAV файл с помощью sox (если доступен) или используем готовый
    if command -v sox &> /dev/null; then
        sox -n -r 22050 -c 1 /tmp/test_audio.wav synth 2 sine 440
        success "Тестовое аудио создано с помощью sox"
    else
        # Создаем минимальный WAV файл вручную
        cat > /tmp/test_audio.wav << 'EOF'
RIFF....WAVEfmt ........PCM.....
EOF
        # Заполняем заголовок WAV файла
        printf "RIFF" > /tmp/test_audio.wav
        printf "\x24\x00\x00\x00" >> /tmp/test_audio.wav  # Размер файла - 8
        printf "WAVE" >> /tmp/test_audio.wav
        printf "fmt " >> /tmp/test_audio.wav
        printf "\x10\x00\x00\x00" >> /tmp/test_audio.wav  # Размер fmt chunk
        printf "\x01\x00" >> /tmp/test_audio.wav           # Audio format (PCM)
        printf "\x01\x00" >> /tmp/test_audio.wav           # Number of channels
        printf "\x44\xac\x00\x00" >> /tmp/test_audio.wav   # Sample rate
        printf "\x88\x58\x01\x00" >> /tmp/test_audio.wav   # Byte rate
        printf "\x02\x00" >> /tmp/test_audio.wav           # Block align
        printf "\x10\x00" >> /tmp/test_audio.wav           # Bits per sample
        printf "data" >> /tmp/test_audio.wav
        printf "\x00\x00\x00\x00" >> /tmp/test_audio.wav   # Data size
        
        success "Минимальный WAV файл создан"
    fi
    
    TEST_AUDIO_URL="file:///tmp/test_audio.wav"
    log "Тестовое аудио: $TEST_AUDIO_URL"
}

# Функция для создания тестового изображения
create_test_image() {
    log "🖼️ Создание тестового изображения..."
    
    # Создаем простое изображение с помощью ImageMagick (если доступен) или используем готовое
    if command -v convert &> /dev/null; then
        convert -size 400x400 xc:lightblue -pointsize 20 -fill black -gravity center -annotate +0+0 "Test Image" /tmp/test_image.jpg
        success "Тестовое изображение создано с помощью ImageMagick"
    else
        # Создаем минимальный JPEG файл
        printf "\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa\xff\xd9" > /tmp/test_image.jpg
        success "Минимальный JPEG файл создан"
    fi
    
    TEST_PHOTO_URL="file:///tmp/test_image.jpg"
    log "Тестовое изображение: $TEST_PHOTO_URL"
}

# Функция для клонирования голоса через ElevenLabs
clone_voice_elevenlabs() {
    if [ -z "$ELEVENLABS_API_KEY" ]; then
        warning "Пропускаю клонирование голоса - API ключ не установлен"
        return 1
    fi
    
    log "🎤 Клонирование голоса через ElevenLabs..."
    
    # Читаем аудио файл
    local audio_data=$(base64 -w 0 /tmp/test_audio.wav)
    
    local response=$(curl -s --max-time 30 -X POST "${ELEVENLABS_BASE_URL}/voices/add" \
        -H "xi-api-key: ${ELEVENLABS_API_KEY}" \
        -F "name=TestVoice_$(date +%s)" \
        -F "description=Test voice for integration testing" \
        -F "files=@/tmp/test_audio.wav")
    
    echo "Ответ ElevenLabs voice clone: $response"
    
    local voice_id=$(echo "$response" | jq -r '.voice_id // empty')
    
    if [ -n "$voice_id" ] && [ "$voice_id" != "null" ]; then
        success "Голос клонирован успешно. Voice ID: $voice_id"
        ELEVENLABS_VOICE_ID="$voice_id"
        echo "$ELEVENLABS_VOICE_ID" > /tmp/elevenlabs_voice_id.txt
        return 0
    else
        error "Ошибка клонирования голоса"
        echo "Полный ответ: $response"
        return 1
    fi
}

# Функция для создания аудио с клонированным голосом
create_audio_with_voice() {
    if [ -z "$ELEVENLABS_API_KEY" ] || [ -z "$ELEVENLABS_VOICE_ID" ]; then
        warning "Пропускаю создание аудио - API ключ или Voice ID не установлены"
        return 1
    fi
    
    log "🗣️ Создание аудио с клонированным голосом..."
    
    local payload=$(jq -n \
        --arg text "$TEST_TEXT" \
        --arg voice_id "$ELEVENLABS_VOICE_ID" \
        --arg model_id "eleven_multilingual_v2" \
        '{
            text: $text,
            model_id: $model_id,
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.0,
                use_speaker_boost: true
            }
        }')
    
    local response=$(curl -s --max-time 30 -X POST "${ELEVENLABS_BASE_URL}/text-to-speech/${ELEVENLABS_VOICE_ID}" \
        -H "xi-api-key: ${ELEVENLABS_API_KEY}" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        --output /tmp/generated_audio.mp3)
    
    if [ -f "/tmp/generated_audio.mp3" ] && [ -s "/tmp/generated_audio.mp3" ]; then
        success "Аудио с клонированным голосом создано успешно"
        TEST_AUDIO_URL="file:///tmp/generated_audio.mp3"
        log "Сгенерированное аудио: $TEST_AUDIO_URL"
        return 0
    else
        error "Ошибка создания аудио с клонированным голосом"
        return 1
    fi
}

# Функция для загрузки файлов в AKOOL (симуляция)
upload_files_to_akool() {
    log "📤 Загрузка файлов в AKOOL (симуляция)..."
    
    # В реальном проекте здесь была бы загрузка файлов через AKOOL API
    # Пока используем локальные файлы для тестирования
    
    if [ -f "/tmp/test_image.jpg" ]; then
        success "Изображение готово для AKOOL"
    else
        error "Изображение не найдено"
        return 1
    fi
    
    if [ -f "/tmp/generated_audio.mp3" ]; then
        success "Аудио готово для AKOOL"
    elif [ -f "/tmp/test_audio.wav" ]; then
        success "Тестовое аудио готово для AKOOL"
    else
        error "Аудио не найдено"
        return 1
    fi
    
    return 0
}

# Функция для создания Talking Photo через AKOOL
create_talking_photo_akool() {
    if [ -z "$AKOOL_ACCESS_TOKEN" ]; then
        error "Сначала нужно получить токен AKOOL"
        return 1
    fi
    
    log "🎭 Создание Talking Photo через AKOOL..."
    
    # Используем локальные файлы (в реальном проекте это были бы загруженные URL)
    local talking_photo_url="https://example.com/test_photo.jpg"  # Симуляция
    local audio_url="https://example.com/test_audio.mp3"          # Симуляция
    local webhook_url="https://webhook.site/your-unique-id"
    
    local response=$(curl -s --max-time 30 -X POST "${AKOOL_BASE_URL}/content/video/createbytalkingphoto" \
        -H "Authorization: Bearer ${AKOOL_ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"talking_photo_url\": \"${talking_photo_url}\", \"audio_url\": \"${audio_url}\", \"webhookUrl\": \"${webhook_url}\"}")
    
    echo "Ответ AKOOL create talking photo: $response"
    
    local code=$(echo "$response" | jq -r '.code // empty')
    local task_id=$(echo "$response" | jq -r '.data.task_id // empty')
    
    if [ "$code" = "1000" ] && [ -n "$task_id" ] && [ "$task_id" != "null" ]; then
        success "Запрос на создание Talking Photo отправлен успешно. Task ID: $task_id"
        AKOOL_TASK_ID="$task_id"
        echo "$AKOOL_TASK_ID" > /tmp/akool_task_id.txt
        return 0
    else
        error "Ошибка создания Talking Photo. Код: $code"
        echo "Сообщение: $(echo "$response" | jq -r '.msg // empty')"
        echo "Полный ответ: $response"
        return 1
    fi
}

# Функция для проверки статуса видео AKOOL
check_akool_video_status() {
    if [ -z "$AKOOL_ACCESS_TOKEN" ] || [ -z "$AKOOL_TASK_ID" ]; then
        error "Нужны токен AKOOL и Task ID"
        return 1
    fi
    
    log "🔍 Проверка статуса видео AKOOL (Task ID: $AKOOL_TASK_ID)..."
    
    local response=$(curl -s --max-time 10 -X GET "${AKOOL_BASE_URL}/content/video/getvideostatus?task_id=${AKOOL_TASK_ID}" \
        -H "Authorization: Bearer ${AKOOL_ACCESS_TOKEN}")
    
    echo "Ответ AKOOL video status: $response"
    
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
        error "Ошибка проверки статуса видео. Код: $code"
        echo "Сообщение: $(echo "$response" | jq -r '.msg // empty')"
        echo "Полный ответ: $response"
        return 1
    fi
}

# Функция для тестирования полного процесса
test_full_process() {
    log "🚀 Начинаю тестирование полного процесса создания видео с клонированием голоса"
    echo
    
    # Шаг 1: Получение токена AKOOL
    info "=== ШАГ 1: Получение токена AKOOL ==="
    get_akool_token || {
        error "Не удалось получить токен AKOOL. Прерываю тестирование."
        return 1
    }
    echo
    
    # Шаг 2: Проверка ElevenLabs API
    info "=== ШАГ 2: Проверка ElevenLabs API ==="
    if check_elevenlabs_key; then
        success "ElevenLabs API готов к работе"
    else
        warning "ElevenLabs API недоступен, продолжаю без клонирования голоса"
    fi
    echo
    
    # Шаг 3: Создание тестовых файлов
    info "=== ШАГ 3: Создание тестовых файлов ==="
    create_test_audio || {
        error "Не удалось создать тестовое аудио"
        return 1
    }
    create_test_image || {
        error "Не удалось создать тестовое изображение"
        return 1
    }
    echo
    
    # Шаг 4: Клонирование голоса (если доступно)
    info "=== ШАГ 4: Клонирование голоса ==="
    if clone_voice_elevenlabs; then
        success "Голос успешно клонирован"
        
        # Шаг 5: Создание аудио с клонированным голосом
        info "=== ШАГ 5: Создание аудио с клонированным голосом ==="
        if create_audio_with_voice; then
            success "Аудио с клонированным голосом создано"
        else
            warning "Не удалось создать аудио с клонированным голосом, используем тестовое аудио"
        fi
    else
        warning "Клонирование голоса недоступно, используем тестовое аудио"
    fi
    echo
    
    # Шаг 6: Загрузка файлов в AKOOL
    info "=== ШАГ 6: Подготовка файлов для AKOOL ==="
    upload_files_to_akool || {
        error "Не удалось подготовить файлы для AKOOL"
        return 1
    }
    echo
    
    # Шаг 7: Создание Talking Photo
    info "=== ШАГ 7: Создание Talking Photo через AKOOL ==="
    if create_talking_photo_akool; then
        success "Запрос на создание Talking Photo отправлен"
        
        # Шаг 8: Проверка статуса
        info "=== ШАГ 8: Проверка статуса видео ==="
        check_akool_video_status || {
            warning "Не удалось проверить статус видео"
        }
    else
        error "Не удалось создать Talking Photo"
        return 1
    fi
    echo
    
    success "🎉 Тестирование завершено!"
    info "Проверьте логи выше для детальной информации о каждом шаге"
}

# Функция для очистки временных файлов
cleanup() {
    log "🧹 Очищаю временные файлы..."
    rm -f /tmp/akool_token.txt
    rm -f /tmp/akool_task_id.txt
    rm -f /tmp/elevenlabs_voice_id.txt
    rm -f /tmp/test_audio.wav
    rm -f /tmp/test_image.jpg
    rm -f /tmp/generated_audio.mp3
    success "Временные файлы удалены"
}

# Функция для отображения справки
show_help() {
    echo "Комплексный тестовый скрипт для AKOOL + ELEVENLABS интеграции"
    echo
    echo "Использование: $0 [опции]"
    echo
    echo "Опции:"
    echo "  -h, --help              Показать эту справку"
    echo "  -k, --elevenlabs-key    Установить ElevenLabs API ключ"
    echo "  --akool-only            Тестировать только AKOOL API"
    echo "  --elevenlabs-only       Тестировать только ElevenLabs API"
    echo
    echo "Примеры:"
    echo "  $0                                    # Полное тестирование"
    echo "  $0 -k sk-xxx                         # С ElevenLabs API ключом"
    echo "  $0 --akool-only                      # Только AKOOL"
    echo "  $0 --elevenlabs-only                 # Только ElevenLabs"
}

# Обработка аргументов командной строки
AKOOL_ONLY=false
ELEVENLABS_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -k|--elevenlabs-key)
            ELEVENLABS_API_KEY="$2"
            shift 2
            ;;
        --akool-only)
            AKOOL_ONLY=true
            shift
            ;;
        --elevenlabs-only)
            ELEVENLABS_ONLY=true
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
    log "🎬 Комплексное тестирование AKOOL + ELEVENLABS интеграции"
    echo
    
    check_dependencies
    
    if [ "$ELEVENLABS_ONLY" = true ]; then
        info "=== РЕЖИМ: Только ElevenLabs ==="
        check_elevenlabs_key || exit 1
        create_test_audio || exit 1
        clone_voice_elevenlabs || exit 1
        create_audio_with_voice || exit 1
        success "Тестирование ElevenLabs завершено"
    elif [ "$AKOOL_ONLY" = true ]; then
        info "=== РЕЖИМ: Только AKOOL ==="
        get_akool_token || exit 1
        create_test_audio || exit 1
        create_test_image || exit 1
        upload_files_to_akool || exit 1
        create_talking_photo_akool || exit 1
        check_akool_video_status || true
        success "Тестирование AKOOL завершено"
    else
        test_full_process
    fi
}

# Обработка сигналов для очистки
trap cleanup EXIT

# Запуск основной функции
main "$@"


