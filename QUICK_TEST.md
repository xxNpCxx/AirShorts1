# 🚀 Быстрый старт тестирования

## Запуск тестов

### 1. Тестирование только AKOOL API
```bash
./test_full_video_creation.sh --akool-only
```

### 2. Тестирование с ElevenLabs (требует API ключ)
```bash
./test_full_video_creation.sh -k your-elevenlabs-api-key
```

### 3. Детальное тестирование (Python)
```bash
# Установка зависимостей
python3 -m venv test_env
source test_env/bin/activate
pip install requests

# Запуск тестов
python test_video_creation_detailed.py --akool-only
```

## Ожидаемые результаты

### ✅ Успешное выполнение
- AKOOL токен получен
- Тестовые файлы созданы
- API запросы отправлены

### ⚠️ Временные ошибки
- Код 1015 от AKOOL - это нормально (сервер перегружен)
- Повторите тест через несколько минут

## Файлы результатов
- `test_video_creation.log` - детальные логи Python скрипта
- Временные файлы автоматически удаляются

---
**Время выполнения**: ~30 секунд  
**Статус**: Готово к использованию ✅
