# 🎬 AirShorts1 Video Generator Bot - Правила разработки

## ⚠️ КРИТИЧЕСКИ ВАЖНО - Специфика проекта!

### **О проекте AirShorts1:**
- 🎬 **Генератор AI видео** с D-ID API
- 📱 **Платформа**: Короткие вертикальные видео
- 🏗️ **Стек**: NestJS + Telegraf + PostgreSQL + Redis
- 🌐 **Хостинг**: Render.com
- 👥 **Аудитория**: Создатели контента

---

## 🎯 ПРАВИЛО #1: Пользовательский опыт

### **НЕ УПОМИНАТЬ ТЕХНИЧЕСКИЕ ДЕТАЛИ В БОТЕ!**

**Запрещено в сообщениях пользователям:**
- ❌ Названия API (D-ID, YouTube API, TikTok API)
- ❌ Технические термины (webhook, database, server)
- ❌ Названия сервисов (Render, PostgreSQL, Redis)
- ❌ Ошибки разработки (500, 404, timeout)

**Правильные формулировки:**
```typescript
// ❌ НЕПРАВИЛЬНО
"Ошибка d-id API генерации"
"Проблема с базой данных"
"YouTube Shorts"

// ✅ ПРАВИЛЬНО  
"Ошибка генерации видео"
"Временная проблема, попробуйте позже"
"Короткие вертикальные видео"
```

---

## 🏗️ ПРАВИЛО #2: Архитектура AirShorts1

### **Наша конкретная архитектура:**

```typescript
// ✅ ТЕКУЩАЯ конфигурация AirShorts1
TelegrafModule.forRoot({
  token: process.env.BOT_TOKEN,
  botName: "airshorts1_bot",
  middlewares: [session()],
  launchOptions: {
    dropPendingUpdates: true,
    webhook: {
      domain: process.env.WEBHOOK_URL || "https://airshorts1.onrender.com",
      path: "/webhook",
    },
  },
  options: {
    telegram: {
      webhookReply: false,
    },
  },
})
```

### **Обязательные модули AirShorts1:**
- [ ] **WebhookModule** - кастомный обработчик webhook
- [ ] **VideoGenerationScene** - сцена генерации видео  
- [ ] **DidModule** - интеграция с D-ID API
- [ ] **DatabaseModule** - PostgreSQL с миграциями
- [ ] **RedisModule** - кеширование сессий

---

## 🎬 ПРАВИЛО #3: Генерация видео

### **Валидация файлов пользователей:**

```typescript
// ✅ НАША валидация фото
if (bestPhoto.file_size && bestPhoto.file_size > 10 * 1024 * 1024) {
  await ctx.reply(
    "❌ Фото слишком большое! Максимальный размер: 10 МБ\n\n" +
    "💡 Попробуйте:\n" +
    "• Сжать фото в настройках камеры\n" +
    "• Использовать другое фото"
  );
  return;
}
```

### **Требования к контенту:**
- [ ] **Фото**: до 10 МБ, 512x512+, JPG/PNG/WebP
- [ ] **Аудио**: до 60 секунд, WAV/MP3/OGG
- [ ] **Сценарий**: текст, до 1000 символов
- [ ] **Платформа**: только короткие вертикальные видео
- [ ] **Качество**: 720p/1080p

---

## 🚫 ПРАВИЛО #4: Специфичные ошибки AirShorts1

### **Частые проблемы проекта:**
```typescript
// ❌ НЕПРАВИЛЬНО - конфликт webhook/polling
TelegramError: 409: Conflict: terminated by other getUpdates request

// ❌ НЕПРАВИЛЬНО - отсутствие колонок БД
error: column users.requests_count does not exist

// ❌ НЕПРАВИЛЬНО - упоминание сервисов в UI
"Ошибка YouTube Shorts API"
"Проблема с d-id сервером"
```

**Наши решения:**
- ✅ Использовать `fix-webhook-conflict.sh` для сброса webhook
- ✅ Добавить миграции для недостающих колонок БД
- ✅ Заменить технические термины на пользовательские

---

## 📋 ЧЕК-ЛИСТ AirShorts1

### **При разработке функций:**
- [ ] **Проверить миграции** БД перед кодом
- [ ] **Добавить валидацию** входных файлов
- [ ] **Использовать inline кнопки** вместо текстового ввода
- [ ] **Скрыть технические детали** от пользователей
- [ ] **Обработать ошибки** D-ID API

### **При деплое на Render:**
- [ ] **Обновить DATABASE_URL** с SSL параметром
- [ ] **Проверить переменные** окружения
- [ ] **Выполнить миграции** БД вручную
- [ ] **Сбросить webhook** если нужно
- [ ] **Проверить логи** после деплоя

---

## 🔧 ПРАВИЛО #5: Диагностика AirShorts1

### **Полезные команды:**

```bash
# Проверка webhook статуса
./fix-webhook-conflict.sh

# Проверка БД
PGPASSWORD="pass" psql -h host -U user -d airshorts_db -c "\dt"

# Выполнение миграций
PGPASSWORD="pass" psql -h host -U user -d airshorts_db -f migrations/001_create_users_table.sql

# Просмотр логов Render
# Через Render Dashboard → Logs
```

### **Health Check эндпоинт:**
```typescript
@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'AirShorts1 Video Generator'
    };
  }
}
```

---

## 💡 ГЛАВНЫЕ ПРИНЦИПЫ AIRSHORTS1

**Пользователь не должен знать о технической сложности!**

1. 🎬 **Простота**: "Создать видео" вместо "Запустить D-ID генерацию"
2. 🔒 **Надежность**: Валидация файлов + обработка ошибок
3. 🎯 **Фокус**: Только короткие вертикальные видео
4. ⚡ **Скорость**: Inline кнопки вместо текстового ввода

---

## 📚 Ресурсы проекта

- **D-ID API**: [Документация](https://docs.d-id.com/)
- **Render Deploy**: [Гайд](https://render.com/docs)
- **PostgreSQL**: [Migrations Guide](https://node-postgres.com/)
- **NestJS Telegraf**: [GitHub](https://github.com/bukhalo/nestjs-telegraf)

---

## 🗂️ Структура проекта

```
AirShorts1/
├── src/
│   ├── scenes/video-generation.scene.ts  # Главная сцена
│   ├── d-id/did.service.ts              # API интеграция
│   ├── webhook/webhook.controller.ts     # Webhook обработчик
│   └── users/users.service.ts           # Управление пользователями
├── migrations/                          # БД миграции
├── fix-webhook-conflict.sh             # Скрипт сброса webhook
└── DEVELOPMENT_RULES.md                # Этот файл
```

---

## 🔧 ПРАВИЛО #6: Интеграция с внешними API

### **Системный подход к поиску endpoint'ов:**

**❌ НЕ ДЕЛАТЬ:**
- Искать только один endpoint
- Использовать только один базовый URL
- Сдаваться при первой 404 ошибке

**✅ ДЕЛАТЬ:**
```markdown
1. Изучить ВСЮ документацию API
2. Найти ВСЕ возможные базовые URL:
   - api.domain.com
   - upload.domain.com
   - cdn.domain.com
   - api-v2.domain.com
3. Проверить ВСЕ возможные endpoint'ы:
   - /v1/upload
   - /v2/upload
   - /upload
   - /assets
4. Создать тестовый скрипт для проверки всех комбинаций
```

### **Поиск готовых решений:**
```markdown
1. Поиск в интернете:
   - "API name" + "upload file" + "working example"
   - "API name" + "custom avatar" + "code example"
   - "API name" + "endpoint" + "github"
2. Проверить GitHub репозитории с примерами
3. Изучить Stack Overflow с рабочими решениями
```

### **Критические ошибки, которых нужно избегать:**
```markdown
❌ "404 ошибка = API недоступен"
✅ "404 ошибка = проверить другие URL"

❌ Использовать только api.domain.com
✅ Проверить upload.domain.com, cdn.domain.com и другие

❌ Тестировать только один endpoint
✅ Тестировать все возможные комбинации
```

### **Чек-лист для API интеграции:**
- [ ] Изучить ВСЮ документацию API
- [ ] Найти ВСЕ возможные базовые URL
- [ ] Найти ВСЕ возможные endpoint'ы
- [ ] Поискать примеры в интернете
- [ ] Создать тестовый скрипт
- [ ] Протестировать ВСЕ комбинации URL
- [ ] Не делать выводы после первой ошибки

---

*Обновлено специально для AirShorts1 Video Generator Bot*
