---
alwaysApply: true
---

# 🎯 Правила разработки AirShorts1 - ВСЕГДА ПРИМЕНЯТЬ

## 🤖 ОБЯЗАТЕЛЬНЫЕ ПРАВИЛА РАБОТЫ С ПОЛЬЗОВАТЕЛЕМ

### 1. **НЕ ВЫДУМЫВАТЬ** 
- ❌ Не гадать и не тестировать случайные варианты
- ❌ Не делать предположений без оснований
- ❌ Не отклоняться от четких инструкций
- ✅ Сначала изучить документацию, потом действовать
- ✅ Использовать только проверенные методы

### 2. **ЕСТЬ ЛИ У ТЕБЯ КАКИЕ-ТО ВОПРОСЫ КО МНЕ КОТОРЫЕ ПОМОГУТ ТЕБЕ ВЫПОЛНИТЬ ЭТО ЗАДАНИЕ ЛУЧШЕ**
- ✅ Всегда задавать уточняющие вопросы перед началом работы
- ✅ Уточнять детали, если что-то неясно
- ✅ Просить дополнительную информацию, если нужно
- ✅ Спрашивать о предпочтениях и ограничениях
- ❌ Не начинать работу без полного понимания задачи

### 3. **ЧЕТКО СЛЕДОВАТЬ ПЛАНУ**
- ✅ Выполнять именно то, что просит пользователь
- ✅ В том порядке, в котором просит
- ✅ Не отклоняться от инструкций
- ✅ Следовать указанному алгоритму действий
- ❌ Не добавлять "улучшения" без разрешения

---

## ⚠️ КРИТИЧЕСКИ ВАЖНО - Специфика проекта AirShorts1

### **О проекте:**
- 🎬 **Генератор AI видео** с D-ID API и HeyGen API
- 📱 **Платформа**: Короткие вертикальные видео
- 🏗️ **Стек**: NestJS + Telegraf + PostgreSQL + Redis
- 🌐 **Хостинг**: Render.com
- 👥 **Аудитория**: Создатели контента

---

## 🎯 ПРАВИЛО #1: Пользовательский опыт

### **НЕ УПОМИНАТЬ ТЕХНИЧЕСКИЕ ДЕТАЛИ В БОТЕ!**

**Запрещено в сообщениях пользователям:**
- ❌ Названия API (D-ID, HeyGen, YouTube API, TikTok API)
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

### **Конфигурация Telegraf:**
```typescript
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

### **Обязательные модули:**
- [ ] **WebhookModule** - кастомный обработчик webhook
- [ ] **VideoGenerationScene** - сцена генерации видео  
- [ ] **DidModule** - интеграция с D-ID API
- [ ] **HeyGenModule** - интеграция с HeyGen API
- [ ] **DatabaseModule** - PostgreSQL с миграциями
- [ ] **RedisModule** - кеширование сессий

---

## 🎬 ПРАВИЛО #3: Генерация видео

### **Валидация файлов:**
```typescript
// ✅ Валидация фото
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

## 🔧 ПРАВИЛО #4: Интеграция с внешними API

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

---

## 📋 API Integration Standards

### **Обязательные стандарты:**

#### 1. **Документация сначала**
```typescript
/**
 * Avatar IV API Implementation
 * 
 * @see https://docs.heygen.com/reference/create-avatar-iv-video
 * @endpoint POST /v2/video/av4/generate
 * @requires image_key from Upload Asset API
 * @requires video_title (string, required)
 * @requires script (string, required) - NOT input_text!
 * @requires voice_id (string, required)
 */
```

#### 2. **TypeScript интерфейсы**
```typescript
export interface AvatarIVPayload {
  image_key: string;                    // Required
  video_title: string;                  // Required  
  script: string;                       // Required (NOT input_text!)
  voice_id: string;                     // Required
  video_orientation?: 'portrait' | 'landscape'; // Optional enum
  fit?: 'cover' | 'contain';           // Optional enum
}
```

#### 3. **Валидация параметров**
```typescript
export function validateAvatarIVPayload(payload: any): payload is AvatarIVPayload {
  return (
    typeof payload.image_key === 'string' &&
    typeof payload.video_title === 'string' &&
    typeof payload.script === 'string' &&
    typeof payload.voice_id === 'string' &&
    (!payload.video_orientation || ['portrait', 'landscape'].includes(payload.video_orientation)) &&
    (!payload.fit || ['cover', 'contain'].includes(payload.fit))
  );
}
```

#### 4. **Обработка ошибок**
```typescript
try {
  if (!validateAvatarIVPayload(payload)) {
    throw new ApiValidationError('Invalid Avatar IV parameters', payload);
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new ApiResponseError(
      `Avatar IV API failed: ${response.status}`,
      response.status,
      errorData
    );
  }

  return await response.json();
} catch (error) {
  this.logger.error(`Avatar IV API error:`, error);
  throw error;
}
```

---

## 🚫 ПРАВИЛО #5: Специфичные ошибки AirShorts1

### **Частые проблемы:**
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

## 🔧 ПРАВИЛО #6: Диагностика

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

## 📋 ОБЯЗАТЕЛЬНЫЙ ЧЕК-ЛИСТ

### **При разработке функций:**
- [ ] **Проверить миграции** БД перед кодом
- [ ] **Добавить валидацию** входных файлов
- [ ] **Использовать inline кнопки** вместо текстового ввода
- [ ] **Скрыть технические детали** от пользователей
- [ ] **Обработать ошибки** D-ID API и HeyGen API

### **При интеграции с API:**
- [ ] **Изучить ВСЮ документацию** API
- [ ] **Найти ВСЕ возможные базовые URL**
- [ ] **Найти ВСЕ возможные endpoint'ы**
- [ ] **Поискать примеры в интернете**
- [ ] **Создать тестовый скрипт**
- [ ] **Протестировать ВСЕ комбинации URL**
- [ ] **Не делать выводы после первой ошибки**

### **При деплое на Render:**
- [ ] **Обновить DATABASE_URL** с SSL параметром
- [ ] **Проверить переменные** окружения
- [ ] **Выполнить миграции** БД вручную
- [ ] **Сбросить webhook** если нужно
- [ ] **Проверить логи** после деплоя

---

## 🚨 КРИТИЧЕСКИЕ ПРАВИЛА (НЕ НАРУШАТЬ!)

### **1. Никогда не упоминать технические детали пользователям**
```typescript
// ❌ НИКОГДА
"Ошибка HeyGen API"
"Проблема с базой данных"
"Timeout на сервере"

// ✅ ВСЕГДА
"Ошибка генерации видео"
"Временная проблема, попробуйте позже"
"Сервис временно недоступен"
```

### **2. Всегда проверять все возможные API endpoint'ы**
```markdown
❌ НИКОГДА: "404 ошибка = API недоступен"
✅ ВСЕГДА: "404 ошибка = проверить другие URL"
```

### **3. Всегда использовать inline кнопки вместо текстового ввода**
```typescript
// ❌ НИКОГДА
await ctx.reply("Введите платформу:");

// ✅ ВСЕГДА
await ctx.reply("Выберите платформу:", {
  reply_markup: { inline_keyboard: [...] }
});
```

### **4. Всегда валидировать пользовательские файлы**
```typescript
// ✅ ВСЕГДА проверять размер файлов
if (fileSize > MAX_SIZE) {
  await ctx.reply("Файл слишком большой!");
  return;
}
```

---

## 💡 ГЛАВНЫЕ ПРИНЦИПЫ AIRSHORTS1

**Пользователь не должен знать о технической сложности!**

1. 🎬 **Простота**: "Создать видео" вместо "Запустить D-ID генерацию"
2. 🔒 **Надежность**: Валидация файлов + обработка ошибок
3. 🎯 **Фокус**: Только короткие вертикальные видео
4. ⚡ **Скорость**: Inline кнопки вместо текстового ввода
5. 🔍 **Системность**: Всегда проверять все возможные варианты API

---

## 📚 Ресурсы проекта

- **D-ID API**: [Документация](https://docs.d-id.com/)
- **HeyGen API**: [Документация](https://docs.heygen.com/)
- **Render Deploy**: [Гайд](https://render.com/docs)
- **PostgreSQL**: [Migrations Guide](https://node-postgres.com/)
- **NestJS Telegraf**: [GitHub](https://github.com/bukhalo/nestjs-telegraf)

---

## 🗂️ Структура проекта

```
AirShorts1/
├── src/
│   ├── scenes/video-generation.scene.ts  # Главная сцена
│   ├── d-id/did.service.ts              # D-ID API интеграция
│   ├── heygen/heygen.service.ts         # HeyGen API интеграция
│   ├── webhook/webhook.controller.ts     # Webhook обработчик
│   └── users/users.service.ts           # Управление пользователями
├── migrations/                          # БД миграции
├── fix-webhook-conflict.sh             # Скрипт сброса webhook
└── ALWAYS_APPLIED_RULES.md             # Этот файл
```

---

## 🔄 Обновление правил

Эти правила должны обновляться при обнаружении новых типов ошибок или улучшений в процессе разработки.

**Дата создания:** 2025-01-05
**Последнее обновление:** 2025-01-06
**Версия:** 2.0

---

*Эти правила применяются ВСЕГДА при работе с проектом AirShorts1*
