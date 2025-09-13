/**
 * Type guards для замены any типов
 */

import {
  TelegramUpdate,
  TelegramMessage,
  TelegramCallbackQuery,
  TelegramUser,
  TelegramChat,
  FileUpload,
  WebhookPayload,
  ApiError,
  ValidationError,
  ProcessStatus,
  ServiceType,
  UserRole,
} from '../types';

// ============================================================================
// TELEGRAM TYPE GUARDS
// ============================================================================

export function isTelegramUpdate(data: unknown): data is TelegramUpdate {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).update_id === 'number' &&
    ((data as any).message !== undefined || (data as any).callback_query !== undefined)
  );
}

export function isTelegramMessage(data: unknown): data is TelegramMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).message_id === 'number' &&
    typeof (data as any).chat === 'object' &&
    typeof (data as any).date === 'number'
  );
}

export function isTelegramCallbackQuery(data: unknown): data is TelegramCallbackQuery {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).id === 'string' &&
    typeof (data as any).from === 'object'
  );
}

export function isTelegramUser(data: unknown): data is TelegramUser {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).id === 'number' &&
    typeof (data as any).is_bot === 'boolean' &&
    typeof (data as any).first_name === 'string'
  );
}

export function isTelegramChat(data: unknown): data is TelegramChat {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).id === 'number' &&
    typeof (data as any).type === 'string' &&
    ['private', 'group', 'supergroup', 'channel'].includes((data as any).type)
  );
}

// ============================================================================
// FILE TYPE GUARDS
// ============================================================================

export function isFileUpload(data: unknown): data is FileUpload {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).fieldname === 'string' &&
    typeof (data as any).originalname === 'string' &&
    typeof (data as any).encoding === 'string' &&
    typeof (data as any).mimetype === 'string' &&
    typeof (data as any).size === 'number' &&
    Buffer.isBuffer((data as any).buffer)
  );
}

// ============================================================================
// WEBHOOK TYPE GUARDS
// ============================================================================

export function isWebhookPayload(data: unknown): data is WebhookPayload {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).id === 'string' &&
    typeof (data as any).status === 'string' &&
    typeof (data as any).type === 'string' &&
    (data as any).timestamp instanceof Date
  );
}

// ============================================================================
// ERROR TYPE GUARDS
// ============================================================================

export function isApiError(data: unknown): data is ApiError {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).code === 'number' &&
    typeof (data as any).message === 'string' &&
    typeof (data as any).service === 'string' &&
    typeof (data as any).requestId === 'string' &&
    (data as any).timestamp instanceof Date
  );
}

export function isValidationError(data: unknown): data is ValidationError {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).field === 'string' &&
    typeof (data as any).message === 'string' &&
    typeof (data as any).service === 'string'
  );
}

// ============================================================================
// ENUM TYPE GUARDS
// ============================================================================

export function isProcessStatus(data: unknown): data is ProcessStatus {
  return (
    typeof data === 'string' &&
    ['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(data)
  );
}

export function isServiceType(data: unknown): data is ServiceType {
  return typeof data === 'string' && ['heygen', 'd-id', 'akool', 'elevenlabs'].includes(data);
}

export function isUserRole(data: unknown): data is UserRole {
  return typeof data === 'string' && ['owner', 'admin', 'operator'].includes(data);
}

// ============================================================================
// ARRAY TYPE GUARDS
// ============================================================================

export function isArrayOf<T>(data: unknown, guard: (item: unknown) => item is T): data is T[] {
  return Array.isArray(data) && data.every(guard);
}

export function isStringArray(data: unknown): data is string[] {
  return Array.isArray(data) && data.every(item => typeof item === 'string');
}

export function isNumberArray(data: unknown): data is number[] {
  return Array.isArray(data) && data.every(item => typeof item === 'number');
}

// ============================================================================
// OBJECT TYPE GUARDS
// ============================================================================

export function isRecord(data: unknown): data is Record<string, unknown> {
  return (
    typeof data === 'object' &&
    data !== null &&
    !Array.isArray(data) &&
    !(data instanceof Date) &&
    !(data instanceof Buffer)
  );
}

export function isStringRecord(data: unknown): data is Record<string, string> {
  return isRecord(data) && Object.values(data).every(value => typeof value === 'string');
}

export function isNumberRecord(data: unknown): data is Record<string, number> {
  return isRecord(data) && Object.values(data).every(value => typeof value === 'number');
}

// ============================================================================
// PRIMITIVE TYPE GUARDS
// ============================================================================

export function isString(data: unknown): data is string {
  return typeof data === 'string';
}

export function isNumber(data: unknown): data is number {
  return typeof data === 'number' && !isNaN(data);
}

export function isBoolean(data: unknown): data is boolean {
  return typeof data === 'boolean';
}

export function isDate(data: unknown): data is Date {
  return data instanceof Date && !isNaN(data.getTime());
}

export function isBuffer(data: unknown): data is Buffer {
  return Buffer.isBuffer(data);
}

// ============================================================================
// COMPLEX TYPE GUARDS
// ============================================================================

export function isNonEmptyString(data: unknown): data is string {
  return typeof data === 'string' && data.length > 0;
}

export function isPositiveNumber(data: unknown): data is number {
  return typeof data === 'number' && data > 0 && !isNaN(data);
}

export function isNonNegativeNumber(data: unknown): data is number {
  return typeof data === 'number' && data >= 0 && !isNaN(data);
}

export function isInteger(data: unknown): data is number {
  return typeof data === 'number' && Number.isInteger(data);
}

export function isPositiveInteger(data: unknown): data is number {
  return isInteger(data) && data > 0;
}

// ============================================================================
// UTILITY TYPE GUARDS
// ============================================================================

export function isDefined<T>(data: T | null | undefined): data is T {
  return data !== null && data !== undefined;
}

export function isNull(data: unknown): data is null {
  return data === null;
}

export function isUndefined(data: unknown): data is undefined {
  return data === undefined;
}

export function isNullOrUndefined(data: unknown): data is null | undefined {
  return data === null || data === undefined;
}

// ============================================================================
// COMBINED TYPE GUARDS
// ============================================================================

export function isStringOrUndefined(data: unknown): data is string | undefined {
  return data === undefined || typeof data === 'string';
}

export function isNumberOrUndefined(data: unknown): data is number | undefined {
  return data === undefined || (typeof data === 'number' && !isNaN(data));
}

export function isBooleanOrUndefined(data: unknown): data is boolean | undefined {
  return data === undefined || typeof data === 'boolean';
}

export function isArrayOrUndefined<T>(
  data: unknown,
  guard: (item: unknown) => item is T
): data is T[] | undefined {
  return data === undefined || (Array.isArray(data) && data.every(guard));
}
