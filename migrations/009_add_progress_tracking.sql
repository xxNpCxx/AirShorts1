-- Миграция для добавления отслеживания прогресса
-- Добавляем поле для хранения ID сообщения с прогресс-баром

-- Добавляем поле в таблицу video_requests
ALTER TABLE video_requests 
ADD COLUMN IF NOT EXISTS progress_message_id INTEGER;

-- Комментарий к полю
COMMENT ON COLUMN video_requests.progress_message_id IS 'ID сообщения Telegram с прогресс-баром для отслеживания статуса обработки';
