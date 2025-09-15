#!/bin/bash

# Скрипт для запуска миграции 011: Исправление функции update_referral_stats
# Дата: 2025-09-15

echo "🔄 Запуск миграции 011: Исправление функции update_referral_stats..."

# Проверяем наличие переменной DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Ошибка: переменная DATABASE_URL не установлена"
    echo "Установите переменную окружения: export DATABASE_URL='your_database_url'"
    exit 1
fi

# Проверяем наличие файла миграции
if [ ! -f "migrations/011_fix_referral_stats_function.sql" ]; then
    echo "❌ Ошибка: файл миграции не найден"
    exit 1
fi

echo "📋 Применяем миграцию к базе данных..."

# Применяем миграцию
psql -d "$DATABASE_URL" -f migrations/011_fix_referral_stats_function.sql

# Проверяем результат
if [ $? -eq 0 ]; then
    echo "✅ Миграция 011 успешно применена!"
    echo "🔧 Функция update_referral_stats исправлена"
    echo "📊 Теперь кнопка 'Моя статистика' должна работать корректно"
else
    echo "❌ Ошибка при применении миграции"
    exit 1
fi

echo "🚀 Готово! Перезапустите бота для применения изменений."
