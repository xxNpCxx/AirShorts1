-- Добавление недостающих колонок в таблицу users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS requests_count INTEGER DEFAULT 0;

-- Создание индекса для быстрого поиска по last_active
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);

-- Обновление существующих записей
UPDATE users 
SET last_active = updated_at, 
    requests_count = 0 
WHERE last_active IS NULL OR requests_count IS NULL;

-- Комментарии к новым колонкам
COMMENT ON COLUMN users.last_active IS 'Время последней активности пользователя';
COMMENT ON COLUMN users.requests_count IS 'Количество запросов пользователя';
