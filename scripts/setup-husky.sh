#!/bin/bash
# Скрипт для настройки husky в dev окружении

echo "🔧 Настройка Husky для разработки..."

# Проверяем, что мы в dev окружении
if [ "$NODE_ENV" = "production" ]; then
    echo "⚠️  Пропускаем настройку Husky в production окружении"
    exit 0
fi

# Проверяем наличие husky
if ! command -v husky >/dev/null 2>&1; then
    echo "❌ Husky не установлен. Устанавливаем..."
    npm install --save-dev husky
fi

# Инициализируем husky
echo "📝 Инициализация Husky..."
npx husky install

# Делаем хуки исполняемыми
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg

echo "✅ Husky настроен успешно!"
echo "Теперь git hooks будут работать автоматически."
