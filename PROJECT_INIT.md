# 🚀 Инициализация нового проекта Telegram бота

## 🎯 Назначение
Этот файл содержит пошаговые инструкции по созданию нового проекта Telegram бота с использованием структурированных правил Cursor AI.

## 📋 Предварительные требования

### 1. Установленные инструменты
- [ ] Node.js (версия 18+)
- [ ] npm или yarn
- [ ] Git
- [ ] Cursor AI
- [ ] PostgreSQL (для базы данных)
- [ ] Redis (для кеширования)

### 2. Telegram Bot API
- [ ] Создан бот через @BotFather
- [ ] Получен токен бота
- [ ] Настроены команды бота

## 🔧 Пошаговая инициализация

### Шаг 1: Создание структуры проекта
```bash
# Создать директорию проекта
mkdir my-telegram-bot
cd my-telegram-bot

# Инициализировать Git репозиторий
git init

# Создать базовую структуру
mkdir -p src/{controllers,services,models,middleware,utils}
mkdir -p src/{scenes,keyboards,config}
mkdir -p tests
mkdir -p docs
mkdir -p .cursor/rules
```

### Шаг 2: Копирование правил Cursor AI
```bash
# Скопировать структуру правил
cp -r /path/to/tgpaybot/.cursor/rules .cursor/

# Создать .cursorrules файл
echo "rules: .cursor/rules/**/*.mdc" > .cursorrules

# Адаптировать business-context.mdc под новый проект
# Изменить название проекта, описание, модули
```

### Шаг 3: Инициализация Node.js проекта
```bash
# Создать package.json
npm init -y

# Установить основные зависимости
npm install telegraf @telegraf/session
npm install nestjs @nestjs/core @nestjs/common
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/config dotenv
npm install class-validator class-transformer

# Установить dev зависимости
npm install -D typescript @types/node
npm install -D @nestjs/testing jest
npm install -D eslint prettier
npm install -D nodemon ts-node
```

### Шаг 4: Настройка TypeScript
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Шаг 5: Настройка переменных окружения
```bash
# Создать .env файл
touch .env

# Добавить необходимые переменные
echo "TELEGRAM_BOT_TOKEN=your_bot_token_here" >> .env
echo "ADMIN_USER_ID=your_telegram_id" >> .env
echo "DATABASE_URL=postgresql://user:password@localhost:5432/dbname" >> .env
echo "REDIS_URL=redis://localhost:6379" >> .env
echo "NODE_ENV=development" >> .env
```

### Шаг 6: Создание базовой структуры приложения
```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();

// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotModule } from './bot/bot.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    BotModule,
  ],
})
export class AppModule {}
```

### Шаг 7: Настройка базы данных
```typescript
// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
```

### Шаг 8: Создание базового бота
```typescript
// src/bot/bot.module.ts
import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotUpdate } from './bot.update';

@Module({
  providers: [BotService, BotUpdate],
})
export class BotModule {}

// src/bot/bot.service.ts
import { Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BotService {
  private bot: Telegraf;

  constructor(private configService: ConfigService) {
    this.bot = new Telegraf(this.configService.get('TELEGRAM_BOT_TOKEN'));
    this.setupBot();
  }

  private setupBot() {
    // Настройка команд и обработчиков
    this.bot.command('start', (ctx) => ctx.reply('Привет! 👋'));
    this.bot.command('help', (ctx) => ctx.reply('Помощь по командам'));
  }

  async launch() {
    await this.bot.launch();
  }
}
```

## 📁 Структура проекта после инициализации

```
my-telegram-bot/
├── .cursor/
│   └── rules/                    # Правила Cursor AI
├── src/
│   ├── bot/                      # Основной модуль бота
│   ├── users/                    # Управление пользователями
│   ├── database/                 # Настройки базы данных
│   ├── config/                   # Конфигурация
│   ├── middleware/               # Middleware
│   ├── utils/                    # Утилиты
│   └── main.ts                   # Точка входа
├── tests/                        # Тесты
├── docs/                         # Документация
├── .env                          # Переменные окружения
├── .gitignore                    # Git ignore
├── package.json                  # Зависимости
├── tsconfig.json                 # TypeScript конфигурация
└── .cursorrules                  # Правила Cursor AI
```

## 🚀 Запуск проекта

### Режим разработки
```bash
# Установить зависимости
npm install

# Запустить в режиме разработки
npm run start:dev

# Или с nodemon
npm run dev
```

### Продакшн режим
```bash
# Собрать проект
npm run build

# Запустить
npm run start:prod
```

## 🔍 Проверка работоспособности

### 1. Проверить подключение к базе данных
```bash
# Проверить PostgreSQL
psql $DATABASE_URL -c "SELECT version();"

# Проверить Redis
redis-cli ping
```

### 2. Проверить бота
- Отправить команду `/start`
- Проверить ответы бота
- Проверить логи в консоли

### 3. Проверить правила Cursor AI
- Открыть проект в Cursor
- Убедиться, что правила применяются
- Проверить отсутствие конфликтов

## 📝 Следующие шаги

### 1. Адаптация под конкретный проект
- [ ] Изменить `business-context.mdc`
- [ ] Настроить модули под бизнес-логику
- [ ] Создать необходимые сущности
- [ ] Настроить сцены и клавиатуры

### 2. Разработка функционала
- [ ] Создать основные команды
- [ ] Реализовать бизнес-логику
- [ ] Добавить обработку ошибок
- [ ] Настроить логирование

### 3. Тестирование
- [ ] Написать unit тесты
- [ ] Написать integration тесты
- [ ] Протестировать все сценарии
- [ ] Проверить производительность

## 🚨 Возможные проблемы

### 1. Ошибки подключения к базе данных
**Решение:** Проверить настройки PostgreSQL и Redis

### 2. Ошибки токена бота
**Решение:** Проверить токен в @BotFather

### 3. Конфликты правил Cursor AI
**Решение:** Проверить структуру `.cursor/rules/`

### 4. Ошибки TypeScript
**Решение:** Проверить `tsconfig.json` и зависимости

## 📞 Поддержка

При возникновении проблем:
1. Проверить логи в консоли
2. Сравнить с примерами в документации
3. Проверить настройки окружения
4. Создать issue с описанием проблемы

---

**Помни: Хорошая инициализация - залог успешной разработки!**
**Помни: Следуй правилам Cursor AI для качественного кода!**
**Помни: Тестируй каждый шаг перед переходом к следующему!**
