-- Очищаем запись о старой миграции 006
DELETE FROM migrations WHERE name = '006_create_video_requests_table.sql';

-- Удаляем таблицу video_requests если она существует с неправильной структурой
DROP TABLE IF EXISTS video_requests CASCADE;
