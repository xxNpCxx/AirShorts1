# 🎬 AI Генератор Видео - Telegram Bot

Telegram бот для создания персонализированных видео с использованием API d-id.com. Бот позволяет пользователям загружать фото, голосовые записи и сценарии для генерации 3D видео с их аватаром.

## ✨ Возможности

- 📸 Загрузка фото с человеком
- 🎵 Загрузка голосовой записи (до 1 минуты)
- 📝 Написание сценария ролика
- 🎬 Генерация 3D видео с аватаром
- 📱 Оптимизация для YouTube Shorts
- ⚙️ Настройка качества и длительности видео

## 🚀 Технологии

- **Backend**: NestJS + TypeScript
- **Telegram Bot**: Telegraf
- **AI Video Generation**: d-id.com API
- **Database**: PostgreSQL + TypeORM
- **Cache**: Redis
- **Deployment**: Render.com

## 📋 Требования

- Node.js 18+
- PostgreSQL
- Redis
- Telegram Bot Token
- d-id.com API Key

## 🛠️ Быстрый старт

1. **Установите зависимости**
```bash
npm install
```

2. **Создайте файл `.env`**
```env
BOT_TOKEN=8462345506:AAEjL9aOKB6_J1YbrR-YgkKmRUawBfxoTfY
DATABASE_URL=postgresql://paymeeasy_db_user:DO3RcXuC7OjEJJTHcFeIkMStWOMo7Rsq@dpg-d1mht1adbo4c73fbcf10-a/airshorts_db
REDIS_URL=redis://red-d2erqm2dbo4c738pk8o0:6379
DID_API_KEY=eHhucGN4eEBnbWFpbC5jb20:coOsJoP3VqEWDKyQ7F0bG
```

3. **Запустите бота**
```bash
npm run start:dev
```

4. **Настройте webhook в Telegram**
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-domain.com/webhook"}'
```

## 📋 Полная установка

Подробные инструкции по установке и настройке смотрите в [DOC.md](DOC.md).

## 🔧 Настройка Telegram Bot

1. Создайте бота через [@BotFather](https://t.me/botfather)
2. Получите токен бота
3. Настройте webhook:
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-domain.com/webhook"}'
```

## 📱 Как использовать

1. **Запустите бота**: `/start`
2. **Нажмите "🎬 Создать видео"**
3. **Следуйте инструкциям**:
   - 📸 Загрузите фото с человеком
   - 🎵 Отправьте голосовую запись (до 1 минуты)
   - 📝 Напишите сценарий ролика
   - ⚙️ Выберите настройки видео
4. **Дождитесь генерации** (несколько минут)

### 🎯 Что получится

- 🎭 **3D аватар** на основе вашего фото
- 🗣️ **Голос** из вашей записи
- 📱 **Видео** оптимизированное для YouTube Shorts
- ⚡ **Быстрая генерация** через d-id.com API

## 🏗️ Архитектура

```
src/
├── d-id/                 # d-id.com API интеграция
│   ├── did.service.ts    # Сервис для генерации видео
│   ├── did.controller.ts # API контроллер
│   └── did.module.ts     # Модуль d-id
├── scenes/               # Сцены бота
│   ├── video-generation.scene.ts # Сцена генерации видео
│   └── scenes.module.ts  # Модуль сцен
├── menu/                 # Главное меню
├── keyboards/            # Клавиатуры
├── users/                # Управление пользователями
├── database/             # База данных
└── main.ts               # Точка входа
```

## 🔒 Безопасность

- Telegram обеспечивает аутентификацию пользователей
- API ключи хранятся в переменных окружения
- Валидация входных данных
- Обработка ошибок и логирование

## 📊 API Endpoints

- `POST /did/generate` - Создание видео
- `GET /did/status/:id` - Проверка статуса видео
- `GET /health` - Проверка здоровья сервиса

## 🚀 Развертывание на Render.com

1. Подключите GitHub репозиторий
2. Настройте переменные окружения
3. Укажите команду сборки: `npm run build`
4. Укажите команду запуска: `npm run start:prod`

## 📝 Лицензия

MIT License

## 🤝 Поддержка

По вопросам работы бота обращайтесь к администратору или создайте issue в репозитории.
