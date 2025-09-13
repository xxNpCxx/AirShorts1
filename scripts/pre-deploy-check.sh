#!/bin/bash
# Скрипт для полной проверки перед деплоем

echo "🚀 Запуск полной проверки перед деплоем..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода ошибок
error() {
    echo -e "${RED}❌ $1${NC}"
}

# Функция для вывода успеха
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Функция для вывода предупреждений
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Проверка Node.js версии
echo "📋 Проверка версии Node.js..."
NODE_VERSION=$(node --version)
REQUIRED_VERSION="v22.19.0"
if [ "$NODE_VERSION" != "$REQUIRED_VERSION" ]; then
    warning "Текущая версия Node.js: $NODE_VERSION"
    warning "Рекомендуемая версия: $REQUIRED_VERSION"
else
    success "Версия Node.js корректна: $NODE_VERSION"
fi

# Проверка зависимостей
echo "📦 Проверка зависимостей..."
if ! npm ci --silent; then
    error "Ошибка установки зависимостей"
    exit 1
fi
success "Зависимости установлены"

# Проверка TypeScript
echo "📝 Проверка TypeScript..."
if ! npm run type-check; then
    error "TypeScript ошибки обнаружены"
    exit 1
fi
success "TypeScript проверка пройдена"

# Проверка линтинга
echo "🧹 Проверка линтинга..."
if ! npm run lint:check; then
    error "Ошибки линтинга обнаружены"
    exit 1
fi
success "Линтинг проверка пройдена"

# Проверка форматирования
echo "🎨 Проверка форматирования..."
if ! npm run format:check; then
    error "Ошибки форматирования обнаружены"
    echo "Запустите 'npm run format' для исправления"
    exit 1
fi
success "Форматирование корректно"

# Сборка проекта
echo "🔨 Сборка проекта..."
if ! npm run build; then
    error "Ошибка сборки проекта"
    exit 1
fi
success "Проект успешно собран"

# Проверка безопасности
echo "🔒 Проверка безопасности..."
if ! npm run audit; then
    warning "Обнаружены уязвимости безопасности"
    echo "Запустите 'npm run audit:fix' для исправления"
    # Не блокируем деплой из-за уязвимостей, только предупреждаем
fi

# Проверка размера сборки
echo "📊 Проверка размера сборки..."
BUILD_SIZE=$(du -sh dist/ | cut -f1)
echo "Размер сборки: $BUILD_SIZE"

# Проверка файлов окружения
echo "🌍 Проверка файлов окружения..."
if [ ! -f ".env.example" ]; then
    warning "Файл .env.example не найден"
fi

if [ ! -f ".env" ]; then
    warning "Файл .env не найден (это нормально для CI/CD)"
fi

# Финальная проверка
echo ""
echo "🎉 Все проверки завершены!"
echo "Проект готов к деплою"
echo ""
echo "📋 Сводка:"
echo "  • Node.js: $NODE_VERSION"
echo "  • TypeScript: ✅"
echo "  • Линтинг: ✅"
echo "  • Форматирование: ✅"
echo "  • Сборка: ✅"
echo "  • Размер сборки: $BUILD_SIZE"
