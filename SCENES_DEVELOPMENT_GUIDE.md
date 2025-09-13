# 🎭 Руководство по разработке сцен

## 📋 Общие принципы

### 1. **Обработка главного меню**
- ✅ **Главное меню** (`🏠 Главное меню`, `Главное меню`) **ВСЕГДА** обрабатывается в `BotUpdate`
- ✅ **Сцены НЕ должны** обрабатывать главное меню самостоятельно
- ✅ **BotUpdate принудительно** выходит из любой сцены при получении главного меню

### 2. **Создание новых сцен**

#### **Обязательно наследуйтесь от `BaseScene`:**
```typescript
import { BaseScene } from './base-scene';

@Scene('your-scene-name')
export class YourScene extends BaseScene {
  // Ваша логика сцены
}
```

#### **Обработка текстовых сообщений:**
```typescript
@On('text')
async onText(@Ctx() ctx: Context) {
  const text = (ctx.message as any).text;
  
  // 1. Логируем сообщения главного меню (для отладки)
  this.logMainMenuMessage(text);
  
  // 2. Обрабатываем команды выхода из сцены
  if (await this.handleExitCommand(ctx, text)) {
    return; // Команда обработана, выходим
  }
  
  // 3. Ваша логика обработки сообщений
  // ...
}
```

### 3. **Доступные методы BaseScene**

#### **`isExitCommand(text: string): boolean`**
Проверяет, является ли сообщение командой выхода:
- `/start`
- `Назад в меню`

#### **`handleExitCommand(ctx: Context, text: string): Promise<boolean>`**
Обрабатывает команды выхода из сцены:
- Выходит из сцены
- Показывает сообщение "🏠 Возвращаемся в главное меню..."
- Возвращает `true` если команда была обработана

#### **`isMainMenuMessage(text: string): boolean`**
Проверяет, является ли сообщение главным меню:
- `🏠 Главное меню`
- `Главное меню`

#### **`logMainMenuMessage(text: string): void`**
Логирует получение сообщения главного меню (для отладки)

## 🚀 Пример создания новой сцены

```typescript
import { Ctx, Scene, SceneEnter, On } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { BaseScene } from './base-scene';

@Scene('example-scene')
export class ExampleScene extends BaseScene {
  
  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: Context) {
    await ctx.reply('Добро пожаловать в пример сцены!');
  }

  @On('text')
  async onText(@Ctx() ctx: Context) {
    const text = (ctx.message as any).text;
    
    // Логируем главное меню (обрабатывается в BotUpdate)
    this.logMainMenuMessage(text);
    
    // Обрабатываем команды выхода
    if (await this.handleExitCommand(ctx, text)) {
      return;
    }
    
    // Ваша логика
    if (text === 'Привет') {
      await ctx.reply('Привет! Как дела?');
    } else {
      await ctx.reply('Не понимаю, попробуйте "Привет"');
    }
  }
}
```

## ⚠️ Важные правила

### **НЕ ДЕЛАЙТЕ:**
- ❌ Не обрабатывайте главное меню в сценах
- ❌ Не создавайте сцены без наследования от `BaseScene`
- ❌ Не дублируйте логику выхода из сцены

### **ДЕЛАЙТЕ:**
- ✅ Наследуйтесь от `BaseScene`
- ✅ Используйте `handleExitCommand()` для выхода
- ✅ Используйте `logMainMenuMessage()` для отладки
- ✅ Следуйте единому паттерну обработки сообщений

## 🔧 Отладка

### **Логи при правильной работе:**
```
[@On text] Обнаружено сообщение главного меню: "🏠 Главное меню" - ПРИНУДИТЕЛЬНЫЙ выход из сцены
[@On text] ПРИНУДИТЕЛЬНО выходим из сцены: "your-scene-name"
[MainMenuHandler] ✅ Главное меню успешно показано
```

### **Логи в сцене:**
```
[YourScene] ℹ️ Получено сообщение главного меню: "🏠 Главное меню" - обрабатывается в BotUpdate
[YourScene] 🚪 Выходим из сцены по команде: "/start"
```

## 📝 Заключение

Этот подход обеспечивает:
- **Единообразное поведение** всех сцен
- **Централизованную обработку** главного меню
- **Простоту разработки** новых сцен
- **Надежность** и отсутствие дублирования кода
