#!/bin/bash

# Скрипт для создания публичных URL файлов
# Загружает файлы в GitHub Gist для получения публичных URL

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# Функция для создания публичных URL через GitHub Gist
create_github_gist_urls() {
    log "📤 Создание публичных URL через GitHub Gist..."
    
    # Проверяем наличие gh CLI
    if ! command -v gh &> /dev/null; then
        warning "GitHub CLI не найден. Используем альтернативный метод."
        return 1
    fi
    
    # Создаем временную директорию
    local temp_dir=$(mktemp -d)
    
    # Копируем файлы
    cp "src/test/myava.jpeg" "$temp_dir/"
    cp "src/test/audio_me.ogg" "$temp_dir/"
    
    # Создаем Gist
    local gist_url=$(gh gist create "$temp_dir" --public --desc "AKOOL test files")
    
    if [ $? -eq 0 ]; then
        success "✅ Gist создан: $gist_url"
        
        # Извлекаем URL файлов
        local image_url="${gist_url}/raw/myava.jpeg"
        local audio_url="${gist_url}/raw/audio_me.ogg"
        
        echo "IMAGE_URL=$image_url" > /tmp/public_urls.txt
        echo "AUDIO_URL=$audio_url" >> /tmp/public_urls.txt
        
        success "📸 Изображение URL: $image_url"
        success "🎵 Аудио URL: $audio_url"
        
        # Очищаем временную директорию
        rm -rf "$temp_dir"
        
        return 0
    else
        error "❌ Не удалось создать Gist"
        rm -rf "$temp_dir"
        return 1
    fi
}

# Функция для создания публичных URL через file.io
create_fileio_urls() {
    log "📤 Создание публичных URL через file.io..."
    
    # Загружаем изображение
    local image_response=$(curl -s -F "file=@src/test/myava.jpeg" https://file.io)
    local image_url=$(echo "$image_response" | jq -r '.link // empty')
    
    if [ -n "$image_url" ] && [ "$image_url" != "null" ]; then
        success "✅ Изображение загружено: $image_url"
    else
        error "❌ Не удалось загрузить изображение"
        return 1
    fi
    
    # Загружаем аудио
    local audio_response=$(curl -s -F "file=@src/test/audio_me.ogg" https://file.io)
    local audio_url=$(echo "$audio_response" | jq -r '.link // empty')
    
    if [ -n "$audio_url" ] && [ "$audio_url" != "null" ]; then
        success "✅ Аудио загружено: $audio_url"
    else
        error "❌ Не удалось загрузить аудио"
        return 1
    fi
    
    # Сохраняем URL
    echo "IMAGE_URL=$image_url" > /tmp/public_urls.txt
    echo "AUDIO_URL=$audio_url" >> /tmp/public_urls.txt
    
    return 0
}

# Функция для создания публичных URL через 0x0.st
create_0x0_urls() {
    log "📤 Создание публичных URL через 0x0.st..."
    
    # Загружаем изображение
    local image_response=$(curl -s -F "file=@src/test/myava.jpeg" https://0x0.st)
    local image_url=$(echo "$image_response" | tr -d '\n')
    
    if [ -n "$image_url" ] && [[ "$image_url" == http* ]]; then
        success "✅ Изображение загружено: $image_url"
    else
        error "❌ Не удалось загрузить изображение"
        return 1
    fi
    
    # Загружаем аудио
    local audio_response=$(curl -s -F "file=@src/test/audio_me.ogg" https://0x0.st)
    local audio_url=$(echo "$audio_response" | tr -d '\n')
    
    if [ -n "$audio_url" ] && [[ "$audio_url" == http* ]]; then
        success "✅ Аудио загружено: $audio_url"
    else
        error "❌ Не удалось загрузить аудио"
        return 1
    fi
    
    # Сохраняем URL
    echo "IMAGE_URL=$image_url" > /tmp/public_urls.txt
    echo "AUDIO_URL=$audio_url" >> /tmp/public_urls.txt
    
    return 0
}

# Основная функция
main() {
    log "🚀 Создание публичных URL для тестовых файлов"
    echo
    
    # Пробуем разные методы
    if create_github_gist_urls; then
        success "✅ Публичные URL созданы через GitHub Gist"
    elif create_0x0_urls; then
        success "✅ Публичные URL созданы через 0x0.st"
    elif create_fileio_urls; then
        success "✅ Публичные URL созданы через file.io"
    else
        error "❌ Не удалось создать публичные URL"
        exit 1
    fi
    
    echo
    success "🎉 Публичные URL готовы для использования в тестах AKOOL API!"
    info "Файл с URL сохранен в: /tmp/public_urls.txt"
}

# Запуск
main "$@"
