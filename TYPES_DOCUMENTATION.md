# 📚 Документация по типам

Этот документ описывает полную систему типизации проекта, которая заменяет все `any` типы на строгую типизацию.

## 🎯 Цель

Создать полную типизацию для всех структур данных проекта, чтобы:
- ✅ Заменить все `any` типы
- ✅ Гарантировать точность взаимодействия по API
- ✅ Предотвратить ошибки на этапе компиляции
- ✅ Улучшить читаемость и поддерживаемость кода

## 📁 Структура типов

```
src/types/
├── index.ts              # Основные типы и экспорты
├── api.types.ts          # Общие API типы
├── heygen.types.ts       # HeyGen API типы
├── akool.types.ts        # AKOOL API типы
├── elevenlabs.types.ts   # ElevenLabs API типы
├── d-id.types.ts         # D-ID API типы
└── database.types.ts     # Типы базы данных
```

## 🔧 Основные типы

### Базовые типы
```typescript
import { ServiceType, ProcessStatus, UserRole, VideoQuality } from '../types';

// Сервисы
type ServiceType = 'heygen' | 'd-id' | 'akool' | 'elevenlabs';

// Статусы процессов
type ProcessStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Роли пользователей
type UserRole = 'owner' | 'admin' | 'operator';

// Качество видео
type VideoQuality = '720p' | '1080p';
```

### Telegram типы
```typescript
import { TelegramUpdate, TelegramUser, TelegramMessage } from '../types';

// Обновление от Telegram
const update: TelegramUpdate = {
  update_id: 123,
  message: {
    message_id: 456,
    from: { id: 789, is_bot: false, first_name: 'John' },
    chat: { id: 789, type: 'private' },
    date: 1234567890,
    text: 'Hello!'
  }
};
```

## 🚀 API типы

### HeyGen API
```typescript
import { 
  HeyGenVideoRequest, 
  DigitalTwinRequest, 
  VoiceCloningRequest,
  validateHeyGenVideoRequest 
} from '../types';

// Создание видео
const videoRequest: HeyGenVideoRequest = {
  image_url: 'https://example.com/image.jpg',
  audio_url: 'https://example.com/audio.mp3',
  script: 'Hello world!',
  platform: 'youtube-shorts',
  duration: 30,
  quality: '720p'
};

// Валидация
if (validateHeyGenVideoRequest(data)) {
  // data теперь типизирован как HeyGenVideoRequest
  console.log(data.image_url);
}
```

### AKOOL API
```typescript
import { 
  AkoolVideoRequest, 
  AkoolTalkingPhotoRequest,
  validateAkoolVideoRequest 
} from '../types';

// Talking Photo
const talkingPhotoRequest: AkoolTalkingPhotoRequest = {
  talking_photo_url: 'https://example.com/photo.jpg',
  audio_url: 'https://example.com/audio.mp3',
  webhookUrl: 'https://your-webhook.com/callback',
  options: {
    quality: 'high',
    resolution: '1080p',
    duration: 30
  }
};
```

### ElevenLabs API
```typescript
import { 
  VoiceCloneRequest, 
  TextToSpeechRequest,
  validateVoiceCloneRequest 
} from '../types';

// Клонирование голоса
const voiceCloneRequest: VoiceCloneRequest = {
  name: 'My Voice',
  audio_url: 'https://example.com/audio.mp3',
  description: 'Personal voice clone'
};
```

## 🗄️ База данных

### Пользователи
```typescript
import { UserTable, CreateUserData, UpdateUserData } from '../types';

// Создание пользователя
const newUser: CreateUserData = {
  telegram_id: 123456789,
  first_name: 'John',
  last_name: 'Doe',
  username: 'johndoe',
  preferred_service: 'heygen'
};

// Обновление пользователя
const userUpdate: UpdateUserData = {
  preferred_service: 'akool'
};
```

### Запросы видео
```typescript
import { VideoRequestsTable, CreateVideoRequestData } from '../types';

const videoRequest: CreateVideoRequestData = {
  user_id: 1,
  service: 'heygen',
  request_id: 'req_123',
  status: 'pending',
  image_url: 'https://example.com/image.jpg',
  script: 'Hello world!'
};
```

## 🛡️ Type Guards

### Проверка типов
```typescript
import { 
  isTelegramUpdate, 
  isTelegramUser, 
  isFileUpload,
  isProcessStatus 
} from '../utils/type-guards';

// Проверка Telegram обновления
if (isTelegramUpdate(data)) {
  // data теперь типизирован как TelegramUpdate
  console.log(data.update_id);
}

// Проверка файла
if (isFileUpload(file)) {
  // file теперь типизирован как FileUpload
  console.log(file.originalname);
}
```

### Валидация данных
```typescript
import { 
  validateString, 
  validateNumber, 
  validateServiceType,
  validateVideoDuration 
} from '../utils/validation';

// Валидация строки
const result = validateString(value, 'username', 1, 32);
if (!result.isValid) {
  console.error(result.errors);
}

// Валидация сервиса
const serviceResult = validateServiceType('heygen', 'service');
if (serviceResult.isValid) {
  // 'heygen' является валидным ServiceType
}
```

## 🔄 Замена any типов

### До (с any)
```typescript
function processWebhook(data: any) {
  if (data.status === 'completed') {
    console.log(data.result_url);
  }
}
```

### После (с типизацией)
```typescript
import { WebhookPayload, isWebhookPayload } from '../types';

function processWebhook(data: unknown) {
  if (isWebhookPayload(data)) {
    // data теперь типизирован как WebhookPayload
    if (data.status === 'completed') {
      console.log(data.result_url);
    }
  }
}
```

## 📋 Примеры использования

### Обработка Telegram обновлений
```typescript
import { TelegramUpdate, isTelegramUpdate } from '../types';

export function handleTelegramUpdate(update: unknown) {
  if (!isTelegramUpdate(update)) {
    throw new Error('Invalid Telegram update');
  }

  if (update.message) {
    handleMessage(update.message);
  } else if (update.callback_query) {
    handleCallbackQuery(update.callback_query);
  }
}
```

### API запросы
```typescript
import { 
  HeyGenVideoRequest, 
  validateHeyGenVideoRequest,
  HeyGenVideoResponse 
} from '../types';

export async function createVideo(data: unknown): Promise<HeyGenVideoResponse> {
  if (!validateHeyGenVideoRequest(data)) {
    throw new Error('Invalid video request data');
  }

  // data теперь типизирован как HeyGenVideoRequest
  const response = await heygenApi.createVideo(data);
  return response;
}
```

### Работа с базой данных
```typescript
import { 
  CreateUserData, 
  validateCreateUserData,
  UserTable 
} from '../types';

export async function createUser(data: unknown): Promise<UserTable> {
  if (!validateCreateUserData(data)) {
    throw new Error('Invalid user data');
  }

  // data теперь типизирован как CreateUserData
  const user = await database.users.create(data);
  return user;
}
```

## 🎨 Лучшие практики

### 1. Всегда используйте type guards
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
  throw new Error('Invalid data');
}
```

### 2. Валидируйте входные данные
```typescript
// ❌ Плохо
function createVideo(request: any) {
  // Прямое использование без валидации
}

// ✅ Хорошо
function createVideo(request: unknown) {
  const validation = validateVideoRequest(request);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
  }
  // request теперь типизирован
}
```

### 3. Используйте строгие типы
```typescript
// ❌ Плохо
interface User {
  id: any;
  name: any;
  email: any;
}

// ✅ Хорошо
interface User {
  id: number;
  name: string;
  email: string;
}
```

## 🔍 Отладка типов

### Проверка типов в runtime
```typescript
import { isTelegramUpdate } from '../utils/type-guards';

function debugType(data: unknown) {
  console.log('Type check results:');
  console.log('isTelegramUpdate:', isTelegramUpdate(data));
  console.log('typeof data:', typeof data);
  console.log('data:', data);
}
```

### TypeScript строгий режим
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

## 📊 Статистика типизации

- **Всего типов**: 150+
- **API интерфейсов**: 50+
- **Type guards**: 30+
- **Валидаторов**: 25+
- **Констант**: 20+

## 🚀 Следующие шаги

1. **Постепенная замена**: Заменяйте `any` типы по одному файлу
2. **Тестирование**: Проверяйте типы в runtime
3. **Документация**: Обновляйте документацию при добавлении новых типов
4. **Мониторинг**: Отслеживайте количество `any` типов в проекте

## 📚 Полезные ссылки

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
- [Validation Patterns](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
