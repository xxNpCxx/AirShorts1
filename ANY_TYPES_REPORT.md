# 📊 Отчет по any типам в бизнес-логике

## Статистика
- **any типов в бизнес-логике**:       24
- **any типов в валидации**:      141 (игнорируем)
- **Дата анализа**: Sat Sep 13 18:52:57 MSK 2025

## Файлы с any типами в бизнес-логике

  22 src/scenes/video-generation.scene.ts
   2 src/webhook/webhook.controller.ts

## Примеры any типов в бизнес-логике

src/webhook/webhook.controller.ts:      // eslint-disable-next-line @typescript-eslint/no-explicit-any
src/webhook/webhook.controller.ts:      await this.bot.handleUpdate(update as any);
src/scenes/video-generation.scene.ts:    const session = (ctx as any).session as SessionData;
src/scenes/video-generation.scene.ts:      const photo = (ctx.message as any).photo[(ctx.message as any).photo.length - 1];
src/scenes/video-generation.scene.ts:      (session as any).photoFileId = photo.file_id;
src/scenes/video-generation.scene.ts:    const session = (ctx as any).session as SessionData;
src/scenes/video-generation.scene.ts:      (session as any).voiceFileId = (ctx.message as any).voice.file_id;
src/scenes/video-generation.scene.ts:    const session = (ctx as any).session as SessionData;
src/scenes/video-generation.scene.ts:    const text = (ctx.message as any).text;
src/scenes/video-generation.scene.ts:      await (ctx as any).scene.leave();

## Рекомендации

### 1. Замените any на конкретные типы
```typescript
// ❌ Плохо
function processData(data: any) {
  return data.someProperty;
}

// ✅ Хорошо
function processData(data: unknown) {
  if (isValidData(data)) {
    return data.someProperty;
  }
}
```

### 2. Используйте type guards
```typescript
// ❌ Плохо
if (typeof data === 'object' && data !== null) {
  // data все еще any
}

// ✅ Хорошо
if (isTelegramUpdate(data)) {
  // data теперь типизирован как TelegramUpdate
}
```

### 3. Валидируйте входные данные
```typescript
// ❌ Плохо
function createUser(userData: any) {
  // Прямое использование
}

// ✅ Хорошо
function createUser(userData: unknown) {
  const validation = validateCreateUserData(userData);
  if (!validation.isValid) {
    throw new Error('Invalid user data');
  }
  // userData теперь типизирован
}
```

## План действий

1. **Приоритет 1**: Замените any в API контроллерах
2. **Приоритет 2**: Замените any в сервисах
3. **Приоритет 3**: Замените any в утилитах
4. **Приоритет 4**: Замените any в типах

## Полезные команды

```bash
# Найти все any типы
grep -r "any" src/ --include="*.ts" | grep -v "// any"

# Найти any в конкретном файле
grep "any" src/path/to/file.ts

# Проверить типы
npm run type-check
```
