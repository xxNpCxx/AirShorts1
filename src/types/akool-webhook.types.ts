/**
 * AKOOL Webhook типы
 */

import { ProcessStatus } from './index';

// ============================================================================
// WEBHOOK PAYLOAD ТИПЫ
// ============================================================================

export interface AkoolWebhookBody {
  dataEncrypt?: string;
  task_id?: string;
  status?: number;
  type?: string;
  url?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  data?: {
    video_status?: number;
    video_id?: string;
    video?: string;
    task_id?: string;
  };
  signature?: string;
  timestamp?: number;
  nonce?: string;
}

export interface AkoolDecryptedData {
  _id: string;
  status: number;
  type: string;
  url?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// DATABASE ТИПЫ
// ============================================================================

export interface AkoolWebhookLog {
  id: number;
  service: string;
  webhook_type: string;
  payload: AkoolWebhookBody;
  processed: boolean;
  error?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AkoolVideoRequestRecord {
  id: number;
  user_id: number;
  service: string;
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

// ============================================================================
// VOICE ТИПЫ
// ============================================================================

export interface AkoolVoice {
  id: string;
  voice_id?: string;
  name: string;
  description?: string;
  language?: string;
  gender?: 'male' | 'female';
  age_range?: string;
  accent?: string;
  style?: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// ВАЛИДАЦИЯ
// ============================================================================

export function validateAkoolWebhookBody(data: unknown): data is AkoolWebhookBody {
  return (
    typeof data === 'object' &&
    data !== null &&
    ((data as any).dataEncrypt === undefined || typeof (data as any).dataEncrypt === 'string') &&
    ((data as any).task_id === undefined || typeof (data as any).task_id === 'string') &&
    ((data as any).status === undefined || typeof (data as any).status === 'number') &&
    ((data as any).type === undefined || typeof (data as any).type === 'string') &&
    ((data as any).url === undefined || typeof (data as any).url === 'string') &&
    ((data as any).error === undefined || typeof (data as any).error === 'string') &&
    ((data as any).metadata === undefined || typeof (data as any).metadata === 'object')
  );
}

export function validateAkoolDecryptedData(data: unknown): data is AkoolDecryptedData {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any)._id === 'string' &&
    typeof (data as any).status === 'number' &&
    typeof (data as any).type === 'string' &&
    ((data as any).url === undefined || typeof (data as any).url === 'string') &&
    ((data as any).error === undefined || typeof (data as any).error === 'string') &&
    ((data as any).metadata === undefined || typeof (data as any).metadata === 'object')
  );
}

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

export const AKOOL_WEBHOOK_STATUS = {
  QUEUE: 1,
  PROCESSING: 2,
  COMPLETED: 3,
  FAILED: 4,
} as const;

export const AKOOL_WEBHOOK_TYPES = {
  VIDEO_GENERATION: 'video_generation',
  TALKING_PHOTO: 'talking_photo',
  VOICE_CLONING: 'voice_cloning',
  TTS: 'tts',
} as const;
