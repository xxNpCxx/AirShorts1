-- Добавляем поле для хранения предпочтения пользователя по сервису генерации видео
-- Проверяем, существует ли колонка, и добавляем только если её нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'preferred_service'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN preferred_service VARCHAR(10) DEFAULT 'did' CHECK (preferred_service IN ('did', 'heygen'));
        
        -- Комментарий для ясности
        COMMENT ON COLUMN users.preferred_service IS 'Предпочтительный сервис генерации видео: did (D-ID API) или heygen (HeyGen API)';
    END IF;
END $$;
