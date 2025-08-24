# 🤖 Telegram Bot Template

Шаблон для создания Telegram ботов с использованием NestJS и структурированных правил Cursor AI.

## ✨ Особенности

- 🚀 **NestJS** - современный фреймворк для Node.js
- 🔧 **TypeScript** - типизированный JavaScript
- 📱 **Telegraf** - мощная библиотека для Telegram ботов
- 🗄️ **TypeORM** - ORM для работы с базами данных
- 🔐 **Redis** - кеширование и сессии
- 📚 **Структурированные правила** Cursor AI для качественного кода
- 🧪 **Jest** - тестирование
- 📝 **ESLint + Prettier** - качество кода

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+
- npm или yarn
- PostgreSQL
- Redis
- Telegram Bot Token

### Установка

```bash
# Клонировать репозиторий
git clone https://github.com/yourusername/telegram-bot-template.git
cd telegram-bot-template

# Установить зависимости
npm install

# Настроить переменные окружения
cp .env.example .env
# Отредактировать .env файл

# Запустить в режиме разработки
npm run start:dev
```

### Переменные окружения

Создайте `.env` файл:

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here
ADMIN_USER_ID=your_telegram_id

# База данных
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Redis
REDIS_URL=redis://localhost:6379

# Окружение
NODE_ENV=development
```

## 📁 Структура проекта

```
src/
├── bot/                    # Основной модуль бота
├── users/                  # Управление пользователями
├── database/               # Настройки базы данных
├── config/                 # Конфигурация
├── middleware/             # Middleware
├── utils/                  # Утилиты
├── scenes/                 # FSM сцены
├── keyboards/              # Клавиатуры
└── main.ts                 # Точка входа
```

## 🔧 Команды

```bash
# Разработка
npm run start:dev          # Запуск с автоперезагрузкой
npm run dev                # Запуск с nodemon

# Продакшн
npm run build              # Сборка проекта
npm run start:prod         # Запуск продакшн версии

# Тестирование
npm run test               # Запуск тестов
npm run test:watch         # Тесты в режиме наблюдения
npm run test:cov           # Тесты с покрытием

# Качество кода
npm run lint               # Проверка ESLint
npm run format             # Форматирование Prettier
```

## 📚 Правила Cursor AI

Проект использует структурированные правила Cursor AI для обеспечения качества кода:

- **00-core/** - универсальные принципы программирования
- **10-telegram/** - специфика Telegram ботов
- **20-project-specific/** - бизнес-контекст проекта
- **90-personal/** - персональные настройки

Подробнее: [Документация правил](.cursor/rules/README.md)

## 🎯 Основные принципы

### 1. Безопасность
- Telegram сам обеспечивает базовую безопасность
- Параметризованные SQL запросы
- Валидация входных данных
- Проверка прав доступа

### 2. UX/UI
- Клавиатуры никогда не смешиваются
- Текст кнопок максимум 20 символов
- Команда /start всегда работает
- Принудительный выход из FSM при /start

### 3. Архитектура
- Модульная структура
- Dependency Injection
- Разделение ответственности
- SOLID принципы

## 🧪 Тестирование

```bash
# Unit тесты
npm run test

# E2E тесты
npm run test:e2e

# Покрытие кода
npm run test:cov
```

## 📦 Развертывание

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
EXPOSE 3000

CMD ["node", "dist/main"]
```

### PM2

```bash
npm run build
pm2 start dist/main.js --name "telegram-bot"
```

## 🔍 Отладка

### Логирование

```typescript
// Подробное логирование входящих апдейтов
bot.use(async (ctx, next) => {
  console.log(`[Incoming] Update type: ${ctx.updateType}`);
  console.log(`[Incoming] User: ${ctx.from?.id} (${ctx.from?.username})`);
  return next();
});
```

### Обработка ошибок

```typescript
try {
  await riskyOperation();
} catch (error) {
  console.error('[ModuleName] Ошибка:', error);
  console.error('[ModuleName] Детали:', error instanceof Error ? error.stack : error);
}
```

## 📖 Документация

- [NestJS](https://nestjs.com/)
- [Telegraf](https://telegraf.js.org/)
- [TypeORM](https://typeorm.io/)
- [Правила Cursor AI](.cursor/rules/README.md)

## 🤝 Вклад в проект

1. Fork репозитория
2. Создать feature ветку (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в ветку (`git push origin feature/amazing-feature`)
5. Открыть Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 🆘 Поддержка

Если у вас есть вопросы или проблемы:

1. Проверьте [Issues](../../issues)
2. Создайте новый Issue с описанием проблемы
3. Обратитесь к [документации](.cursor/rules/README.md)

---

**Создано с ❤️ и структурированными правилами Cursor AI**
