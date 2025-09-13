# 📊 Отчет по any типам

## Статистика
- **Общее количество any типов**:      167
- **Дата анализа**: Sat Sep 13 18:15:15 MSK 2025

## Файлы с any типами

  32 src/utils/type-guards.ts
  23 src/types/akool.types.ts
  21 src/types/api.types.ts
  19 src/types/heygen.types.ts
  17 src/types/database.types.ts
  13 src/heygen/heygen.service.ts
   8 src/types/elevenlabs.types.ts
   7 src/types/d-id.types.ts
   5 src/heygen/mock-heygen.service.ts
   4 src/elevenlabs/elevenlabs.service.ts
   4 src/akool/akool-webhook.controller.ts
   2 src/users/users.service.ts
   2 src/scenes/video-generation.scene.ts
   2 src/heygen/heygen-webhook.controller.ts
   2 src/d-id/did.service.ts
   2 src/akool/akool.controller.ts
   1 src/webhook/webhook.controller.ts
   1 src/types/index.ts
   1 src/test-files/test-files.controller.ts
   1 src/akool/akool.service.ts

## Примеры any типов

src/webhook/webhook.controller.ts:  async handleWebhook(@Body() update: any, @Res() res: Response) {
src/scenes/video-generation.scene.ts:      const session = (ctx as any).session as SessionData;
src/scenes/video-generation.scene.ts:      const session = (ctx as any).session as SessionData;
src/types/heygen.types.ts:    typeof (data as any).image_url === 'string' &&
src/types/heygen.types.ts:    typeof (data as any).audio_url === 'string' &&
src/types/heygen.types.ts:    typeof (data as any).script === 'string' &&
src/types/heygen.types.ts:    (data as any).platform === 'youtube-shorts' &&
src/types/heygen.types.ts:    typeof (data as any).duration === 'number' &&
src/types/heygen.types.ts:    ['720p', '1080p'].includes((data as any).quality) &&
src/types/heygen.types.ts:    ((data as any).text_prompt === undefined || typeof (data as any).text_prompt === 'string')

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
