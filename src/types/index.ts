/**
 * Централизованные типы для всего проекта
 * Заменяет все 'any' типы на строгую типизацию
 */

// ============================================================================
// БАЗОВЫЕ ТИПЫ
// ============================================================================

export type ServiceType = 'heygen' | 'd-id' | 'akool' | 'elevenlabs';
export type VideoQuality = '720p' | '1080p';
export type VideoOrientation = 'portrait' | 'landscape';
export type ProcessStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type UserRole = 'owner' | 'admin' | 'operator';

// ============================================================================
// TELEGRAM ТИПЫ
// ============================================================================

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  photo?: TelegramPhotoSize[];
  voice?: TelegramVoice;
  video?: TelegramVideo;
  document?: TelegramDocument;
  caption?: string;
}

export interface TelegramPhotoSize {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

export interface TelegramVoice {
  file_id: string;
  file_unique_id: string;
  duration: number;
  mime_type?: string;
  file_size?: number;
}

export interface TelegramVideo {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  duration: number;
  thumb?: TelegramPhotoSize;
  mime_type?: string;
  file_size?: number;
}

export interface TelegramDocument {
  file_id: string;
  file_unique_id: string;
  thumb?: TelegramPhotoSize;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

// ============================================================================
// ПОЛЬЗОВАТЕЛЬСКИЕ ТИПЫ
// ============================================================================

export interface User {
  id: number;
  telegram_id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  language_code?: string;
  is_premium?: boolean;
  preferred_service?: ServiceType;
  created_at: Date;
  updated_at: Date;
}

export interface UserSettings {
  commission_percent: number;
  referral_commission_percent: number;
  owner_id: number;
  admin_ids: number[];
  operator_ids: number[];
}

// ============================================================================
// СЕССИОННЫЕ ТИПЫ
// ============================================================================

export interface SessionData {
  userId: number;
  currentStep: string;
  photoUrl?: string;
  audioUrl?: string;
  script?: string;
  platform?: string;
  duration?: number;
  quality?: VideoQuality;
  textPrompt?: string;
  serviceType?: ServiceType;
  voiceId?: string;
  imageKey?: string;
  videoTitle?: string;
  requestId?: string;
}

// ============================================================================
// API ОТВЕТЫ (ОБЩИЕ)
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// ФАЙЛОВЫЕ ТИПЫ
// ============================================================================

export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
}

// ============================================================================
// WEBHOOK ТИПЫ
// ============================================================================

export interface WebhookPayload {
  id: string;
  status: ProcessStatus;
  type: string;
  url?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface WebhookLog {
  id: string;
  service: ServiceType;
  payload: WebhookPayload;
  processed: boolean;
  error?: string;
  created_at: Date;
}

// ============================================================================
// ЛОГИРОВАНИЕ
// ============================================================================

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

// ============================================================================
// КОНТЕКСТЫ TELEGRAM
// ============================================================================

export interface TelegramContext {
  update: TelegramUpdate;
  message?: TelegramMessage;
  callbackQuery?: TelegramCallbackQuery;
  user?: TelegramUser;
  chat?: TelegramChat;
  session?: SessionData;
}

export interface PhotoContext extends TelegramContext {
  message: TelegramMessage & { photo: TelegramPhotoSize[] };
}

export interface VoiceContext extends TelegramContext {
  message: TelegramMessage & { voice: TelegramVoice };
}

export interface TextContext extends TelegramContext {
  message: TelegramMessage & { text: string };
}

// ============================================================================
// ВАЛИДАЦИЯ
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// КОНФИГУРАЦИЯ
// ============================================================================

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: boolean;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
  retries?: number;
}

// ============================================================================
// УТИЛИТЫ
// ============================================================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const SUPPORTED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'] as const;
export const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'] as const;

export const MAX_FILE_SIZE = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  AUDIO: 25 * 1024 * 1024, // 25MB
  VIDEO: 100 * 1024 * 1024, // 100MB
} as const;

export const VIDEO_DURATION_LIMITS = {
  MIN: 15, // seconds
  MAX: 60, // seconds
} as const;

// ============================================================================
// ЭКСПОРТ ВСЕХ ТИПОВ
// ============================================================================

// API типы
export * from './api.types';
export * from './akool.types';
export * from './akool-webhook.types';
export * from './akool-controller.types';
export * from './elevenlabs.types';
export * from './elevenlabs-detailed.types';

// Telegraf типы
export * from './telegraf.types';

// База данных
export * from './database.types';
