/**
 * Типы для AKOOL контроллера
 */

import { AkoolVideoResponse } from './akool.types';
import { AkoolWebhookLog } from './akool-webhook.types';

// ============================================================================
// CONTROLLER RESPONSE ТИПЫ
// ============================================================================

export interface AkoolControllerResponse<T = unknown> {
  message: string;
  status: 'success' | 'error';
  data?: T;
  error?: string;
}

export interface AkoolVideoStatusResponse extends AkoolControllerResponse<unknown> {
  data?: unknown;
}

export interface AkoolWebhookLogsResponse extends AkoolControllerResponse<AkoolWebhookLog[]> {
  data?: AkoolWebhookLog[];
  count?: number;
}

// ============================================================================
// ВАЛИДАЦИЯ
// ============================================================================

export function validateAkoolControllerResponse(data: unknown): data is AkoolControllerResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).message === 'string' &&
    ['success', 'error'].includes((data as any).status) &&
    ((data as any).data === undefined || typeof (data as any).data === 'object') &&
    ((data as any).error === undefined || typeof (data as any).error === 'string')
  );
}

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

export const AKOOL_CONTROLLER_MESSAGES = {
  VIDEO_STATUS_SUCCESS: 'Статус видео получен успешно',
  VIDEO_STATUS_ERROR: 'Ошибка получения статуса',
  WEBHOOK_LOGS_SUCCESS: 'Webhook логи получены успешно',
  WEBHOOK_LOGS_ERROR: 'Ошибка получения webhook логов',
} as const;
