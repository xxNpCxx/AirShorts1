# 🧪 Руководство по тестированию AKOOL + ELEVENLABS интеграции

Этот документ описывает, как тестировать интеграцию AKOOL и ELEVENLABS API для создания видео с клонированием голоса.

## 📋 Обзор

Мы создали два тестовых скрипта для проверки всей цепочки создания видео:

1. **`test_full_video_creation.sh`** - Bash скрипт для быстрого тестирования
2. **`test_video_creation_detailed.py`** - Python скрипт с детальным логированием

## 🚀 Быстрый старт

### Предварительные требования

```bash
# Установка зависимостей
# Для bash скрипта:
sudo apt-get install curl jq base64  # Ubuntu/Debian
brew install curl jq coreutils       # macOS

# Для Python скрипта:
pip install requests
```

### Настройка переменных окружения

```bash
# Установите ваш ElevenLabs API ключ
export ELEVENLABS_API_KEY="sk-your-api-key-here"

# Или передайте его как параметр
./test_full_video_creation.sh -k sk-your-api-key-here
```

## 🔧 Использование

### Bash скрипт (рекомендуется для быстрого тестирования)

```bash
# Полное тестирование
./test_full_video_creation.sh

# С ElevenLabs API ключом
./test_full_video_creation.sh -k sk-your-api-key-here

# Только AKOOL API
./test_full_video_creation.sh --akool-only

# Только ElevenLabs API
./test_full_video_creation.sh --elevenlabs-only

# Показать справку
./test_full_video_creation.sh --help
```

### Python скрипт (рекомендуется для детального анализа)

```bash
# Полное тестирование
python3 test_video_creation_detailed.py

# С ElevenLabs API ключом
python3 test_video_creation_detailed.py -k sk-your-api-key-here

# Только AKOOL API
python3 test_video_creation_detailed.py --akool-only

# Только ElevenLabs API
python3 test_video_creation_detailed.py --elevenlabs-only

# Подробный вывод
python3 test_video_creation_detailed.py --verbose
```

## 📊 Что тестируется

### 1. AKOOL API
- ✅ Получение API токена
- ✅ Создание Talking Photo запроса
- ✅ Проверка статуса видео
- ✅ Обработка ошибок и retry логика

### 2. ElevenLabs API
- ✅ Проверка API ключа
- ✅ Клонирование голоса из аудиофайла
- ✅ Создание аудио с клонированным голосом
- ✅ Text-to-Speech с настройками голоса

### 3. Интеграция
- ✅ Полный процесс создания видео
- ✅ Обработка файлов (аудио/изображения)
- ✅ Передача данных между сервисами
- ✅ Webhook настройки

## 🔍 Интерпретация результатов

### Успешное выполнение
```
[SUCCESS] API токен AKOOL получен успешно
[SUCCESS] ElevenLabs API ключ валиден
[SUCCESS] Голос клонирован успешно. Voice ID: abc123
[SUCCESS] Аудио с клонированным голосом создано успешно
[SUCCESS] Запрос на создание Talking Photo отправлен. Task ID: xyz789
[SUCCESS] Видео готово! URL: https://example.com/video.mp4
```

### Частичное выполнение
```
[WARNING] ELEVENLABS_API_KEY не установлен. Пропускаю тесты ElevenLabs.
[SUCCESS] API токен AKOOL получен успешно
[SUCCESS] Запрос на создание Talking Photo отправлен. Task ID: xyz789
[INFO] Видео обрабатывается...
```

### Ошибки
```
[ERROR] Ошибка получения API токена AKOOL. Код: 1001
[ERROR] ElevenLabs API ключ невалиден. Статус: 401
[ERROR] Ошибка клонирования голоса. Статус: 400
```

## 🛠️ Устранение неполадок

### AKOOL API ошибки

| Код | Описание | Решение |
|-----|----------|---------|
| 1001 | Неверные учетные данные | Проверьте CLIENT_ID и CLIENT_SECRET |
| 1015 | Временная ошибка сервера | Повторите запрос через несколько секунд |
| 2001 | Неверный формат запроса | Проверьте структуру JSON |

### ElevenLabs API ошибки

| Статус | Описание | Решение |
|--------|----------|---------|
| 401 | Неверный API ключ | Проверьте ELEVENLABS_API_KEY |
| 400 | Неверный формат аудио | Используйте WAV/MP3 файлы |
| 429 | Превышен лимит запросов | Подождите или обновите план |

### Общие проблемы

1. **"curl не найден"**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install curl
   
   # macOS
   brew install curl
   ```

2. **"jq не найден"**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install jq
   
   # macOS
   brew install jq
   ```

3. **"Permission denied"**
   ```bash
   chmod +x test_full_video_creation.sh
   chmod +x test_video_creation_detailed.py
   ```

## 📝 Логирование

### Bash скрипт
- Выводит результаты в консоль с цветовой кодировкой
- Сохраняет токены в `/tmp/` для повторного использования

### Python скрипт
- Выводит результаты в консоль
- Сохраняет детальные логи в `test_video_creation.log`
- Создает временные файлы в `/tmp/video_test_*/`

## 🔄 Автоматическое тестирование

### GitHub Actions (пример)
```yaml
name: Test Video Creation APIs
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: pip install requests
      - name: Test AKOOL only
        run: python3 test_video_creation_detailed.py --akool-only
        env:
          ELEVENLABS_API_KEY: ${{ secrets.ELEVENLABS_API_KEY }}
```

### Cron задача
```bash
# Тестирование каждый день в 9:00
0 9 * * * /path/to/test_full_video_creation.sh >> /var/log/video_test.log 2>&1
```

## 📈 Мониторинг

### Ключевые метрики
- Время получения токена AKOOL
- Время клонирования голоса ElevenLabs
- Время создания Talking Photo
- Процент успешных запросов
- Время обработки видео

### Алерты
- Ошибки аутентификации
- Превышение лимитов API
- Долгое время обработки (>5 минут)
- Недоступность сервисов

## 🚨 Важные замечания

1. **API ключи**: Никогда не коммитьте API ключи в репозиторий
2. **Лимиты**: ElevenLabs имеет лимиты на количество запросов
3. **Файлы**: Тестовые файлы создаются автоматически и удаляются после тестирования
4. **Webhook**: Для полного тестирования нужен доступный webhook URL
5. **Сеть**: Убедитесь, что серверы API доступны из вашей сети

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи в `test_video_creation.log`
2. Убедитесь, что все зависимости установлены
3. Проверьте доступность API сервисов
4. Проверьте правильность API ключей
5. Обратитесь к документации API:
   - [AKOOL API Docs](https://docs.akool.com/)
   - [ElevenLabs API Docs](https://docs.elevenlabs.io/)

---

**Удачного тестирования! 🎬✨**
