-- Добавляем поле для хранения предпочтения пользователя по сервису генерации видео
ALTER TABLE users 
ADD COLUMN preferred_service VARCHAR(10) DEFAULT 'did' CHECK (preferred_service IN ('did', 'heygen'));

-- Комментарий для ясности
COMMENT ON COLUMN users.preferred_service IS 'Предпочтительный сервис генерации видео: did (D-ID API) или heygen (HeyGen API)';
