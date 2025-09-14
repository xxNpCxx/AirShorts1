-- Миграция для добавления дедупликации webhook
-- Добавляем поля для предотвращения дублирования уведомлений

-- Добавляем поля в таблицу webhook_logs
ALTER TABLE webhook_logs 
ADD COLUMN IF NOT EXISTS webhook_id VARCHAR(64),
ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT FALSE;

-- Создаем индекс для быстрого поиска по webhook_id
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);

-- Создаем индекс для быстрого поиска обработанных webhook
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON webhook_logs(processed);

-- Комментарии к полям
COMMENT ON COLUMN webhook_logs.webhook_id IS 'Уникальный хеш webhook для предотвращения дублирования';
COMMENT ON COLUMN webhook_logs.processed IS 'Флаг обработки webhook (true = обработан, false = не обработан)';
