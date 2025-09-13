/**
 * Типы для базы данных
 */

import { ServiceType, ProcessStatus, UserRole } from './index';

// ============================================================================
// ТАБЛИЦЫ БАЗЫ ДАННЫХ
// ============================================================================

export interface UserTable {
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

export interface SettingsTable {
  id: number;
  key: string;
  value: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface VideoRequestsTable {
  id: number;
  user_id: number;
  service: ServiceType;
  request_id: string;
  status: ProcessStatus;
  image_url?: string;
  audio_url?: string;
  script?: string;
  video_url?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

export interface WebhookLogsTable {
  id: number;
  service: ServiceType;
  payload: Record<string, unknown>;
  processed: boolean;
  error?: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserRolesTable {
  id: number;
  user_id: number;
  role: UserRole;
  granted_by: number;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// ЗАПРОСЫ К БАЗЕ ДАННЫХ
// ============================================================================

export interface CreateUserData {
  telegram_id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  language_code?: string;
  is_premium?: boolean;
  preferred_service?: ServiceType;
}

export interface UpdateUserData {
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
  is_premium?: boolean;
  preferred_service?: ServiceType;
}

export interface CreateVideoRequestData {
  user_id: number;
  service: ServiceType;
  request_id: string;
  status: ProcessStatus;
  image_url?: string;
  audio_url?: string;
  script?: string;
  video_url?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateVideoRequestData {
  status?: ProcessStatus;
  video_url?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  completed_at?: Date;
}

export interface CreateWebhookLogData {
  service: ServiceType;
  payload: Record<string, unknown>;
  processed: boolean;
  error?: string;
}

export interface CreateUserRoleData {
  user_id: number;
  role: UserRole;
  granted_by: number;
}

// ============================================================================
// РЕЗУЛЬТАТЫ ЗАПРОСОВ
// ============================================================================

export interface UserQueryResult {
  user: UserTable | null;
  error?: string;
}

export interface VideoRequestQueryResult {
  videoRequest: VideoRequestsTable | null;
  error?: string;
}

export interface WebhookLogQueryResult {
  webhookLog: WebhookLogsTable | null;
  error?: string;
}

export interface UserRoleQueryResult {
  userRole: UserRolesTable | null;
  error?: string;
}

// ============================================================================
// СТАТИСТИКА
// ============================================================================

export interface UserStats {
  total_users: number;
  active_users: number;
  premium_users: number;
  users_by_service: Record<ServiceType, number>;
  users_by_language: Record<string, number>;
}

export interface VideoRequestStats {
  total_requests: number;
  completed_requests: number;
  failed_requests: number;
  pending_requests: number;
  requests_by_service: Record<ServiceType, number>;
  requests_by_status: Record<ProcessStatus, number>;
  average_processing_time: number;
}

export interface WebhookStats {
  total_webhooks: number;
  processed_webhooks: number;
  failed_webhooks: number;
  webhooks_by_service: Record<ServiceType, number>;
  average_processing_time: number;
}

// ============================================================================
// МИГРАЦИИ
// ============================================================================

export interface Migration {
  id: string;
  name: string;
  up: string;
  down: string;
  executed_at?: Date;
}

export interface MigrationResult {
  success: boolean;
  migration: Migration;
  error?: string;
  execution_time: number;
}

// ============================================================================
// КОНФИГУРАЦИЯ БАЗЫ ДАННЫХ
// ============================================================================

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
  pool: {
    min: number;
    max: number;
    idle: number;
  };
  migrations: {
    directory: string;
    table: string;
  };
}

// ============================================================================
// ВАЛИДАЦИЯ
// ============================================================================

export function validateCreateUserData(data: unknown): data is CreateUserData {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).telegram_id === 'number' &&
    typeof (data as any).first_name === 'string' &&
    ((data as any).username === undefined || typeof (data as any).username === 'string') &&
    ((data as any).last_name === undefined || typeof (data as any).last_name === 'string') &&
    ((data as any).language_code === undefined ||
      typeof (data as any).language_code === 'string') &&
    ((data as any).is_premium === undefined || typeof (data as any).is_premium === 'boolean') &&
    ((data as any).preferred_service === undefined ||
      ['heygen', 'd-id', 'akool', 'elevenlabs'].includes((data as any).preferred_service))
  );
}

export function validateCreateVideoRequestData(data: unknown): data is CreateVideoRequestData {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).user_id === 'number' &&
    ['heygen', 'd-id', 'akool', 'elevenlabs'].includes((data as any).service) &&
    typeof (data as any).request_id === 'string' &&
    ['pending', 'processing', 'completed', 'failed', 'cancelled'].includes((data as any).status) &&
    ((data as any).image_url === undefined || typeof (data as any).image_url === 'string') &&
    ((data as any).audio_url === undefined || typeof (data as any).audio_url === 'string') &&
    ((data as any).script === undefined || typeof (data as any).script === 'string') &&
    ((data as any).video_url === undefined || typeof (data as any).video_url === 'string') &&
    ((data as any).error === undefined || typeof (data as any).error === 'string') &&
    ((data as any).metadata === undefined || typeof (data as any).metadata === 'object')
  );
}

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

export const DATABASE_TABLES = {
  USERS: 'users',
  SETTINGS: 'settings',
  VIDEO_REQUESTS: 'video_requests',
  WEBHOOK_LOGS: 'webhook_logs',
  USER_ROLES: 'user_roles',
} as const;

export const USER_ROLES: UserRole[] = ['owner', 'admin', 'operator'];

export const PROCESS_STATUSES: ProcessStatus[] = [
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
];
