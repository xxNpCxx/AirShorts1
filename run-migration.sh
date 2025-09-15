#!/bin/bash

# Скрипт для выполнения миграции на Render.com
# Выполните эту команду в консоли Render:

echo "🔧 Выполнение миграции базы данных..."

# Подключаемся к базе данных и выполняем миграцию
psql $DATABASE_URL -c "
-- Добавляем поле для хранения предпочтения пользователя по сервису генерации видео
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS preferred_service VARCHAR(10) DEFAULT 'did' CHECK (preferred_service IN ('did', 'heygen'));

-- Комментарий для ясности  
COMMENT ON COLUMN users.preferred_service IS 'Предпочтительный сервис генерации видео: did (D-ID API) или heygen (HeyGen API)';

-- Проверяем результат
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'preferred_service';
"

echo "✅ Миграция завершена!"

echo "🔧 Применяем миграцию 011: Исправление функции update_referral_stats..."

# Применяем миграцию 011
psql $DATABASE_URL -f migrations/011_fix_referral_stats_function.sql

if [ $? -eq 0 ]; then
    echo "✅ Миграция 011 успешно применена!"
    echo "🔧 Функция update_referral_stats исправлена"
    echo "📊 Теперь кнопка 'Моя статистика' должна работать корректно"
else
    echo "❌ Ошибка при применении миграции 011"
    exit 1
fi

echo "🚀 Все миграции завершены! Перезапустите бота для применения изменений."
