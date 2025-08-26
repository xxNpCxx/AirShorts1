# 🚀 Правила разработки Telegram ботов на NestJS

## ⚠️ КРИТИЧЕСКИ ВАЖНО - Читать перед началом работы!

### **Проблема, которую мы решили:**
- ❌ 404 ошибка при обращении к webhook
- ❌ Конфликт портов (EADDRINUSE)
- ❌ Rate Limiting (429 Too Many Requests)
- ❌ Неправильная архитектура webhook

---

## 🎯 ПРАВИЛО #1: Диагностика перед действием

### **НЕ НАЧИНАЙТЕ КОДИТЬ СРАЗУ!**

**Порядок действий:**
1. 📖 **Прочитать логи полностью** - понять суть ошибки
2. 📚 **Изучить документацию** используемых библиотек
3. 🏗️ **Понять архитектуру** решения
4. 📋 **Спланировать подход** целиком
5. ✅ **Реализовать** за один подход

**Пример неправильного подхода:**
```typescript
// ❌ НЕПРАВИЛЬНО - исправлять по одной ошибке
// Ошибка 1: создаем webhook контроллер
// Ошибка 2: исправляем порты
// Ошибка 3: добавляем retry логику
// Результат: потратили много времени
```

**Пример правильного подхода:**
```typescript
// ✅ ПРАВИЛЬНО - системное решение
// 1. Изучили документацию nestjs-telegraf
// 2. Поняли архитектуру webhook
// 3. Создали полное решение сразу
// Результат: быстро и качественно
```

---

## 🏗️ ПРАВИЛО #2: Архитектура Telegram ботов

### **Webhook vs Polling - понимать разницу!**

```typescript
// ✅ ПРАВИЛЬНАЯ архитектура webhook
@Module({
  imports: [
    TelegrafModule.forRoot({
      token: process.env.BOT_TOKEN,
      middlewares: [session()],
      launchOptions: {
        webhook: {
          domain: process.env.WEBHOOK_URL,
          hookPath: '/webhook'
          // НЕ указывать порт - будет конфликт!
        }
      }
    })
  ]
})
export class AppModule {}
```

### **Обязательные компоненты:**
- [ ] **WebhookController** - обработка `/webhook` маршрута
- [ ] **Правильная конфигурация** TelegrafModule
- [ ] **Middleware для JSON** - `app.use(json())`
- [ ] **Retry логика** для API вызовов

---

## 🔧 ПРАВИЛО #3: Обработка ошибок Telegram API

### **Rate Limiting (429) - всегда добавлять retry!**

```typescript
// ✅ ПРАВИЛЬНО - умная установка webhook
async setupWebhook() {
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      await bot.telegram.setWebhook(webhookPath);
      break;
    } catch (error: any) {
      if (error.message?.includes('429')) {
        const retryAfter = parseInt(error.message.match(/retry after (\d+)/)?.[1] || '5');
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      }
      retryCount++;
    }
  }
}
```

### **Обязательные проверки:**
- [ ] **Текущий статус webhook** перед изменением
- [ ] **Сброс старого webhook** при необходимости
- [ ] **Задержки** между операциями (2+ секунды)
- [ ] **Retry логика** для всех API вызовов

---

## 🚫 ПРАВИЛО #4: Что НЕ делать

### **Антипаттерны:**
```typescript
// ❌ НЕПРАВИЛЬНО - хардкод портов
launchOptions: {
  webhook: {
    port: 10000  // КОНФЛИКТ с основным приложением!
  }
}

// ❌ НЕПРАВИЛЬНО - игнорировать Rate Limiting
await bot.telegram.setWebhook(webhookPath); // Может упасть с 429

// ❌ НЕПРАВИЛЬНО - исправлять по одной ошибке
// Создаем контроллер → исправляем порты → добавляем retry
```

---

## 📋 ЧЕК-ЛИСТ для быстрого старта

### **При создании Telegram бота:**
- [ ] **Изучить документацию** `nestjs-telegraf`
- [ ] **Понять разницу** webhook vs polling
- [ ] **Сразу добавить** retry логику для API
- [ ] **Настроить** подробное логирование
- [ ] **Создать** debug endpoints

### **При возникновении проблем:**
- [ ] **Прочитать логи** полностью
- [ ] **Понять контекст** ошибки
- [ ] **Изучить документацию** по проблеме
- [ ] **Спланировать решение** целиком
- [ ] **Реализовать** системно

---

## 🎯 ПРАВИЛО #5: Быстрая диагностика

### **Добавить в проект сразу:**

```typescript
@Controller('debug')
export class DebugController {
  @Get()
  async debugInfo() {
    return {
      webhook: await this.bot.telegram.getWebhookInfo(),
      bot: await this.bot.telegram.getMe(),
      env: {
        PORT: process.env.PORT,
        WEBHOOK_URL: process.env.WEBHOOK_URL,
        NODE_ENV: process.env.NODE_ENV
      }
    };
  }
}
```

---

## 💡 ГЛАВНЫЙ УРОК

**НЕ СПЕШИТЕ ИСПРАВЛЯТЬ ОШИБКИ ПО ОДНОЙ!**

Лучше потратить время на понимание проблемы целиком, чем исправлять последствия неправильного подхода.

**Время на изучение + планирование = Экономия времени на исправления**

---

## 📚 Полезные ссылки

- [nestjs-telegraf Documentation](https://github.com/botgram/nestjs-telegraf)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Webhook vs Polling](https://core.telegram.org/bots/webhooks)
- [Rate Limiting](https://core.telegram.org/bots/faq#my-bot-is-hitting-limits-how-do-i-avoid-this)

---

*Создано на основе опыта решения проблем с webhook в проекте AirShorts1*
