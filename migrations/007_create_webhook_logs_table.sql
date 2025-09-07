-- Создание таблицы для логов webhook'ов
CREATE TABLE IF NOT EXISTS webhook_logs (
    id SERIAL PRIMARY KEY,
    service VARCHAR(20) NOT NULL CHECK (service IN ('did', 'heygen', 'akool', 'elevenlabs')),
    webhook_type VARCHAR(50),
    request_id VARCHAR(255),
    task_id VARCHAR(255),
    status VARCHAR(20),
    payload JSONB,
    processed BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_webhook_logs_service ON webhook_logs(service);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_request_id ON webhook_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_task_id ON webhook_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON webhook_logs(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);

-- Комментарии к таблице
COMMENT ON TABLE webhook_logs IS 'Логи входящих webhook уведомлений';
COMMENT ON COLUMN webhook_logs.service IS 'Сервис: did, heygen, akool, elevenlabs';
COMMENT ON COLUMN webhook_logs.webhook_type IS 'Тип webhook события';
COMMENT ON COLUMN webhook_logs.payload IS 'Полный payload webhook в JSON формате';
COMMENT ON COLUMN webhook_logs.processed IS 'Обработан ли webhook успешно';
