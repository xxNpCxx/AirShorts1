# 📚 Документация AI Генератора Видео

## 🎯 Обзор проекта

AI Генератор Видео - это Telegram бот, который позволяет пользователям создавать персонализированные 3D видео с использованием API d-id.com. Бот оптимизирован для создания контента для YouTube Shorts.

## 🏗️ Архитектура системы

### Модульная структура NestJS

```
src/
├── app.module.ts              # Главный модуль приложения
├── main.ts                    # Точка входа
├── d-id/                      # Модуль для работы с d-id.com API
│   ├── did.module.ts          # Модуль d-id
│   ├── did.service.ts         # Сервис для генерации видео
│   └── did.controller.ts      # API контроллер
├── scenes/                    # Сцены бота
│   ├── scenes.module.ts       # Модуль сцен
│   └── video-generation.scene.ts # Сцена генерации видео
├── menu/                      # Главное меню
│   ├── menu.module.ts         # Модуль меню
│   └── menu.service.ts        # Сервис меню
├── keyboards/                 # Клавиатуры
│   ├── keyboards.module.ts    # Модуль клавиатур
│   └── keyboards.service.ts   # Сервис клавиатур
├── users/                     # Управление пользователями
├── database/                  # База данных
├── redis/                     # Redis кэш
├── logger/                    # Логирование
└── updates/                   # Обработчики обновлений
    ├── bot.update.ts          # Главный обработчик
    └── menu.update.ts         # Обработчик меню
```

### Поток данных

1. **Пользователь** → Telegram Bot
2. **Telegram Bot** → NestJS Application
3. **NestJS** → d-id.com API
4. **d-id.com** → Генерация видео
5. **Результат** → Пользователь

## 🔧 Технические детали

### d-id.com API интеграция

#### Основные endpoints:
- `POST /talks` - Создание видео
- `GET /talks/{id}` - Проверка статуса
- `POST /audios` - Загрузка аудио
- `POST /images` - Загрузка изображений

#### Параметры генерации:
```typescript
interface VideoGenerationRequest {
  photoUrl: string;           // URL фото
  audioUrl: string;           // URL аудио
  script: string;             // Сценарий
  platform: 'youtube-shorts'; // Платформа
  duration: number;           // Длительность (15-60 сек)
  quality: '720p' | '1080p'; // Качество
  textPrompt?: string;        // Дополнительный промпт
}
```

### Telegram Bot сцены

#### Сцена генерации видео:
1. **Загрузка фото** - пользователь отправляет фото
2. **Загрузка аудио** - пользователь отправляет голосовую запись
3. **Ввод сценария** - пользователь пишет сценарий
4. **Выбор платформы** - YouTube Shorts
5. **Настройка длительности** - 15-60 секунд
6. **Выбор качества** - 720p или 1080p
7. **Дополнительный промпт** - опционально
8. **Генерация видео** - отправка в d-id.com API

### Валидация данных

#### Фото:
- Формат: JPEG, PNG
- Размер: до 10MB
- Содержание: должен быть человек

#### Аудио:
- Формат: OGG, MP3, WAV
- Длительность: до 60 секунд
- Качество: моно или стерео

#### Сценарий:
- Длина: до 1000 символов
- Язык: русский или английский
- Содержание: без запрещенного контента

## 🚀 Развертывание

### Локальная разработка

1. **Установка зависимостей:**
```bash
npm install
```

2. **Настройка базы данных:**
```bash
# PostgreSQL
createdb airshorts_dev

# Redis
redis-server
```

3. **Переменные окружения:**
```env
BOT_TOKEN=your_bot_token
DATABASE_URL=postgresql://localhost/airshorts_dev
REDIS_URL=redis://localhost:6379
DID_API_KEY=your_did_api_key
```

4. **Запуск:**
```bash
npm run start:dev
```

### Production (Render.com)

1. **Подключение репозитория**
2. **Настройка переменных окружения**
3. **Команды:**
   - Build: `npm run build`
   - Start: `npm run start:prod`

## 📊 Мониторинг и логирование

### Логирование

```typescript
// Пример логирования в сервисе
this.logger.log('Starting video generation with d-id API');
this.logger.error('Error generating video:', error);
```

### Метрики

- Количество созданных видео
- Время генерации
- Успешность операций
- Ошибки API

## 🔒 Безопасность

### Telegram Bot безопасность

- **Аутентификация**: Telegram обеспечивает
- **Авторизация**: Проверка ролей пользователей
- **Валидация**: Проверка входных данных
- **Rate Limiting**: Ограничение запросов

### API безопасность

- **API ключи**: В переменных окружения
- **HTTPS**: Обязательно для webhook
- **Валидация**: Проверка всех входных данных

## 🧪 Тестирование

### Unit тесты

```bash
npm run test
```

### E2E тесты

```bash
npm run test:e2e
```

### Тестирование API

```bash
# Создание видео
curl -X POST "http://localhost:3000/did/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "photoUrl": "https://example.com/photo.jpg",
    "audioUrl": "https://example.com/audio.wav",
    "script": "Привет, это тестовое видео!",
    "platform": "youtube-shorts",
    "duration": 30,
    "quality": "720p"
  }'

# Проверка статуса
curl "http://localhost:3000/did/status/video_id_here"
```

## 🐛 Отладка

### Логи

```bash
# Просмотр логов в реальном времени
tail -f logs/app.log

# Поиск ошибок
grep "ERROR" logs/app.log
```

### Telegram Bot

```bash
# Проверка webhook
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Установка webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/webhook"}'
```

## 📈 Производительность

### Оптимизации

1. **Кэширование**: Redis для часто используемых данных
2. **Асинхронность**: Неблокирующие операции
3. **Очереди**: Обработка видео в фоне
4. **Масштабирование**: Горизонтальное масштабирование

### Мониторинг

- Время ответа API
- Использование памяти
- Нагрузка на CPU
- Количество подключений к БД

## 🔄 CI/CD

### GitHub Actions

```yaml
name: Deploy to Render
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        run: |
          # Деплой на Render.com
```

## 📚 Дополнительные ресурсы

### Документация

- [NestJS Documentation](https://nestjs.com/)
- [Telegraf Documentation](https://telegraf.js.org/)
- [d-id.com API Documentation](https://docs.d-id.com/)
- [Telegram Bot API](https://core.telegram.org/bots/api)

### Полезные ссылки

- [Telegram Bot Examples](https://github.com/telegraf/telegraf/tree/master/examples)
- [NestJS Best Practices](https://docs.nestjs.com/techniques/database)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Поддержка

### Создание Issue

При возникновении проблем:

1. Проверьте логи
2. Убедитесь в правильности настроек
3. Создайте issue с описанием проблемы
4. Приложите логи и скриншоты

### Контакты

- **Telegram**: @your_username
- **Email**: support@yourdomain.com
- **GitHub**: [Issues](https://github.com/your-username/repo/issues)

---

**Версия документации**: 1.0.0  
**Последнее обновление**: 2024  
**Автор**: Your Name
