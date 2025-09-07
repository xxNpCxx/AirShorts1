-- Миграция 000: Очистка и подготовка таблицы video_requests
-- Выполняется первой, очищает все проблемы с таблицей

-- Удаляем запись о старой миграции 006 если она существует
DELETE FROM migrations WHERE name = '006_create_video_requests_table.sql';

-- Удаляем таблицу video_requests если она существует с неправильной структурой
DROP TABLE IF EXISTS video_requests CASCADE;

-- Создаем таблицу video_requests с правильной структурой
CREATE TABLE video_requests (
    id SERIAL PRIMARY KEY,
    request_id VARCHAR(255) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL,
    service VARCHAR(20) NOT NULL CHECK (service IN ('did', 'heygen', 'akool')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    task_id VARCHAR(255),
    video_id VARCHAR(255),
    photo_url TEXT,
    audio_url TEXT,
    script TEXT,
    quality VARCHAR(10),
    result_url TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Создаем индексы для быстрого поиска
CREATE INDEX idx_video_requests_request_id ON video_requests(request_id);
CREATE INDEX idx_video_requests_user_id ON video_requests(user_id);
CREATE INDEX idx_video_requests_status ON video_requests(status);
CREATE INDEX idx_video_requests_service ON video_requests(service);
CREATE INDEX idx_video_requests_task_id ON video_requests(task_id);
CREATE INDEX idx_video_requests_created_at ON video_requests(created_at);

-- Добавляем комментарии к таблице
COMMENT ON TABLE video_requests IS 'Запросы на создание видео от пользователей';
COMMENT ON COLUMN video_requests.request_id IS 'Уникальный ID запроса';
COMMENT ON COLUMN video_requests.user_id IS 'Telegram ID пользователя';
COMMENT ON COLUMN video_requests.service IS 'Сервис генерации: did, heygen, akool';
COMMENT ON COLUMN video_requests.status IS 'Статус обработки: pending, processing, completed, failed';
COMMENT ON COLUMN video_requests.task_id IS 'ID задачи в внешнем сервисе';
COMMENT ON COLUMN video_requests.video_id IS 'ID видео в внешнем сервисе';
COMMENT ON COLUMN video_requests.result_url IS 'URL готового видео';

-- Записываем миграцию как выполненную (только если её еще нет)
INSERT INTO migrations (name, executed_at) 
SELECT '000_cleanup_video_requests.sql', NOW()
WHERE NOT EXISTS (SELECT 1 FROM migrations WHERE name = '000_cleanup_video_requests.sql');
