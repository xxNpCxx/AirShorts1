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
  const isObject = typeof data === 'object';
  const isNull = data === null;
  const isInvalidTop = isObject === false || isNull === true;
  if (isInvalidTop === true) {
    console.log('❌ isTelegramUpdate: data is not object or is null');
    return false;
  }

  const update = data as any;

  // Проверяем обязательное поле update_id
  const isUpdateIdNumber = typeof update.update_id === 'number';
  if (isUpdateIdNumber === false) {
    console.log(
      '❌ isTelegramUpdate: update_id is not number, type:',
      typeof update.update_id,
      'value:',
      update.update_id
    );
    return false;
  }

  // Проверяем, что есть хотя бы одно из возможных обновлений
  const hasValidUpdate =
    update.message !== undefined ||
    update.callback_query !== undefined ||
    update.inline_query !== undefined ||
    update.chosen_inline_result !== undefined ||
    update.channel_post !== undefined ||
    update.edited_message !== undefined ||
    update.edited_channel_post !== undefined ||
    update.shipping_query !== undefined ||
    update.pre_checkout_query !== undefined ||
    update.poll !== undefined ||
    update.poll_answer !== undefined ||
    update.my_chat_member !== undefined ||
    update.chat_member !== undefined ||
    update.chat_join_request !== undefined;

  const isHasValidUpdate = hasValidUpdate === true;
  if (isHasValidUpdate === false) {
    console.log('❌ isTelegramUpdate: no valid update type found');
    console.log('Available keys:', Object.keys(update));
  } else {
    console.log('✅ isTelegramUpdate: validation passed');
  }

  return isHasValidUpdate;
}

export function isTelegramMessage(data: unknown): data is TelegramMessage {
  const isObject = typeof data === 'object';
  const isNull = data === null;
  const isMessageIdNumber = typeof (data as any).message_id === 'number';
  const isChatObject = typeof (data as any).chat === 'object';
  const isDateNumber = typeof (data as any).date === 'number';
  return (
    isObject === true &&
    isNull === false &&
    isMessageIdNumber === true &&
    isChatObject === true &&
    isDateNumber === true
  );
}

export function isTelegramCallbackQuery(data: unknown): data is TelegramCallbackQuery {
  const isObject = typeof data === 'object';
  const isNull = data === null;
  const isIdString = typeof (data as any).id === 'string';
  const isFromObject = typeof (data as any).from === 'object';
  return isObject === true && isNull === false && isIdString === true && isFromObject === true;
}

export function isTelegramUser(data: unknown): data is TelegramUser {
  const isObject = typeof data === 'object';
  const isNull = data === null;
  const isIdNumber = typeof (data as any).id === 'number';
  const isIsBotBoolean = typeof (data as any).is_bot === 'boolean';
  const isFirstNameString = typeof (data as any).first_name === 'string';
  return (
    isObject === true &&
    isNull === false &&
    isIdNumber === true &&
    isIsBotBoolean === true &&
    isFirstNameString === true
  );
}

export function isTelegramChat(data: unknown): data is TelegramChat {
  const isObject = typeof data === 'object';
  const isNull = data === null;
  const isIdNumber = typeof (data as any).id === 'number';
  const isTypeString = typeof (data as any).type === 'string';
  const isTypeAllowed =
    ['private', 'group', 'supergroup', 'channel'].includes((data as any).type) === true;
  return (
    isObject === true &&
    isNull === false &&
    isIdNumber === true &&
    isTypeString === true &&
    isTypeAllowed === true
  );
}

// ============================================================================
// FILE TYPE GUARDS
// ============================================================================

export function isFileUpload(data: unknown): data is FileUpload {
  const isObject = typeof data === 'object';
  const isNull = data === null;
  const isFieldNameString = typeof (data as any).fieldname === 'string';
  const isOriginalNameString = typeof (data as any).originalname === 'string';
  const isEncodingString = typeof (data as any).encoding === 'string';
  const isMimeTypeString = typeof (data as any).mimetype === 'string';
  const isSizeNumber = typeof (data as any).size === 'number';
  const isBufferInstance = Buffer.isBuffer((data as any).buffer) === true;
  return (
    isObject === true &&
    isNull === false &&
    isFieldNameString === true &&
    isOriginalNameString === true &&
    isEncodingString === true &&
    isMimeTypeString === true &&
    isSizeNumber === true &&
    isBufferInstance === true
  );
}

// ============================================================================
// WEBHOOK TYPE GUARDS
// ============================================================================

export function isWebhookPayload(data: unknown): data is WebhookPayload {
  const isObject = typeof data === 'object';
  const isNull = data === null;
  const isIdString = typeof (data as any).id === 'string';
  const isStatusString = typeof (data as any).status === 'string';
  const isTypeString = typeof (data as any).type === 'string';
  const isTimestampDate = (data as any).timestamp instanceof Date;
  return (
    isObject === true &&
    isNull === false &&
    isIdString === true &&
    isStatusString === true &&
    isTypeString === true &&
    isTimestampDate === true
  );
}

// ============================================================================
// ERROR TYPE GUARDS
// ============================================================================

export function isApiError(data: unknown): data is ApiError {
  const isObject = typeof data === 'object';
  const isNull = data === null;
  const isCodeNumber = typeof (data as any).code === 'number';
  const isMessageString = typeof (data as any).message === 'string';
  const isServiceString = typeof (data as any).service === 'string';
  const isRequestIdString = typeof (data as any).requestId === 'string';
  const isTimestampDate = (data as any).timestamp instanceof Date;
  return (
    isObject === true &&
    isNull === false &&
    isCodeNumber === true &&
    isMessageString === true &&
    isServiceString === true &&
    isRequestIdString === true &&
    isTimestampDate === true
  );
}

export function isValidationError(data: unknown): data is ValidationError {
  const isObject = typeof data === 'object';
  const isNull = data === null;
  const isFieldString = typeof (data as any).field === 'string';
  const isMessageString = typeof (data as any).message === 'string';
  const isServiceString = typeof (data as any).service === 'string';
  return (
    isObject === true &&
    isNull === false &&
    isFieldString === true &&
    isMessageString === true &&
    isServiceString === true
  );
}

// ============================================================================
// ENUM TYPE GUARDS
// ============================================================================

export function isProcessStatus(data: unknown): data is ProcessStatus {
  const isStringType = typeof data === 'string';
  const isAllowed =
    ['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(data as string) === true;
  return isStringType === true && isAllowed === true;
}

export function isServiceType(data: unknown): data is ServiceType {
  const isStringType = typeof data === 'string';
  const isAllowed = ['heygen', 'd-id', 'akool', 'elevenlabs'].includes(data as string) === true;
  return isStringType === true && isAllowed === true;
}

export function isUserRole(data: unknown): data is UserRole {
  const isStringType = typeof data === 'string';
  const isAllowed = ['owner', 'admin', 'operator'].includes(data as string) === true;
  return isStringType === true && isAllowed === true;
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
  const isObject = typeof data === 'object';
  const isNull = data === null;
  const isArray = Array.isArray(data) === true;
  const isDateInstance = data instanceof Date;
  const isBufferInstance = data instanceof Buffer;
  return (
    isObject === true &&
    isNull === false &&
    isArray === false &&
    isDateInstance === false &&
    isBufferInstance === false
  );
}

export function isStringRecord(data: unknown): data is Record<string, string> {
  const isRec = isRecord(data) === true;
  const isAllStrings =
    Object.values(data as Record<string, unknown>).every(value => typeof value === 'string') ===
    true;
  return isRec === true && isAllStrings === true;
}

export function isNumberRecord(data: unknown): data is Record<string, number> {
  const isRec = isRecord(data) === true;
  const isAllNumbers =
    Object.values(data as Record<string, unknown>).every(value => typeof value === 'number') ===
    true;
  return isRec === true && isAllNumbers === true;
}

// ============================================================================
// PRIMITIVE TYPE GUARDS
// ============================================================================

export function isString(data: unknown): data is string {
  return typeof data === 'string';
}

export function isNumber(data: unknown): data is number {
  const isNum = typeof data === 'number';
  const isValueNaN = Number.isNaN(data as number) === true;
  return isNum === true && isValueNaN === false;
}

export function isBoolean(data: unknown): data is boolean {
  return typeof data === 'boolean';
}

export function isDate(data: unknown): data is Date {
  const isDateInstance = data instanceof Date;
  const isTimeNaN = Number.isNaN((data as Date).getTime()) === true;
  return isDateInstance === true && isTimeNaN === false;
}

export function isBuffer(data: unknown): data is Buffer {
  return Buffer.isBuffer(data) === true;
}

// ============================================================================
// COMPLEX TYPE GUARDS
// ============================================================================

export function isNonEmptyString(data: unknown): data is string {
  const isStr = typeof data === 'string';
  const isLengthPositive = (data as string).length > 0;
  return isStr === true && isLengthPositive === true;
}

export function isPositiveNumber(data: unknown): data is number {
  const isNum = typeof data === 'number';
  const isPositive = (data as number) > 0;
  const isValueNaN = Number.isNaN(data as number) === true;
  return isNum === true && isPositive === true && isValueNaN === false;
}

export function isNonNegativeNumber(data: unknown): data is number {
  const isNum = typeof data === 'number';
  const isNonNegative = (data as number) >= 0;
  const isValueNaN = Number.isNaN(data as number) === true;
  return isNum === true && isNonNegative === true && isValueNaN === false;
}

export function isInteger(data: unknown): data is number {
  const isNum = typeof data === 'number';
  const isInt = Number.isInteger(data) === true;
  return isNum === true && isInt === true;
}

export function isPositiveInteger(data: unknown): data is number {
  const isInt = isInteger(data) === true;
  const isPositive = (data as number) > 0;
  return isInt === true && isPositive === true;
}

// ============================================================================
// UTILITY TYPE GUARDS
// ============================================================================

export function isDefined<T>(data: T | null | undefined): data is T {
  const isNull = data === null;
  const isUndef = data === undefined;
  return isNull === false && isUndef === false;
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
  const isUndef = data === undefined;
  const isNum = typeof data === 'number';
  const isValueNaN = Number.isNaN(data as number) === true;
  return isUndef === true || (isNum === true && isValueNaN === false);
}

export function isBooleanOrUndefined(data: unknown): data is boolean | undefined {
  return data === undefined || typeof data === 'boolean';
}

export function isArrayOrUndefined<T>(
  data: unknown,
  guard: (item: unknown) => item is T
): data is T[] | undefined {
  const isUndef = data === undefined;
  const isArr = Array.isArray(data) === true;
  const isEveryGuard = isArr === true ? (data as unknown[]).every(guard) === true : false;
  return isUndef === true || (isArr === true && isEveryGuard === true);
}
