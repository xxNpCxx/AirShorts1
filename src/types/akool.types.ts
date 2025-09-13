/**
 * AKOOL API типы
 * @see https://www.postman.com/akoolai/team-workspace/folder/wl1p2dw/v3
 */

import { ProcessStatus } from './index';

// ============================================================================
// АУТЕНТИФИКАЦИЯ
// ============================================================================

export interface AkoolAuthRequest {
  clientId: string;
  clientSecret: string;
}

export interface AkoolTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope?: string;
}

// ============================================================================
// ВИДЕО ЗАПРОСЫ
// ============================================================================

export interface AkoolVideoRequest {
  image_url: string;
  audio_url: string;
  script: string;
  platform: 'youtube-shorts';
  duration: number;
  quality: '720p' | '1080p';
  text_prompt?: string;
}

export interface AkoolTalkingPhotoRequest {
  talking_photo_url: string;
  audio_url: string;
  webhookUrl: string;
  options?: {
    quality?: 'high' | 'medium' | 'low';
    resolution?: '720p' | '1080p';
    duration?: number;
  };
}

// ============================================================================
// ОТВЕТЫ API
// ============================================================================

export interface AkoolVideoResponse {
  code: number;
  msg: string;
  data?: {
    task_id: string;
    status: ProcessStatus;
    video_url?: string;
    error?: string;
  };
}

export interface AkoolTalkingPhotoResponse {
  code: number;
  msg: string;
  data?: {
    task_id: string;
    status: ProcessStatus;
    video_url?: string;
    error?: string;
  };
}

export interface AkoolStatusResponse {
  code: number;
  msg: string;
  data?: {
    task_id: string;
    status: ProcessStatus;
    progress?: number;
    video_url?: string;
    error?: string;
    created_at: string;
    updated_at: string;
  };
}

// ============================================================================
// TTS ЗАПРОСЫ
// ============================================================================

export interface AkoolTTSRequest {
  text: string;
  voice_id: string;
  speed?: number;
  pitch?: number;
  volume?: number;
  format?: 'mp3' | 'wav' | 'ogg';
}

export interface AkoolTTSResponse {
  code: number;
  msg: string;
  data?: {
    audio_url: string;
    duration: number;
    file_size: number;
  };
}

// ============================================================================
// КЛОНИРОВАНИЕ ГОЛОСА
// ============================================================================

export interface AkoolVoiceCloneRequest {
  name: string;
  audio_url: string;
  description?: string;
  callback_url?: string;
}

export interface AkoolVoiceCloneResponse {
  code: number;
  msg: string;
  data?: {
    voice_id: string;
    name: string;
    status: ProcessStatus;
    audio_url?: string;
    error?: string;
  };
}

// ============================================================================
// WEBHOOK ТИПЫ
// ============================================================================

export interface AkoolWebhookPayload {
  task_id: string;
  status: ProcessStatus;
  type: 'video_generation' | 'talking_photo' | 'voice_cloning' | 'tts';
  video_url?: string;
  audio_url?: string;
  error?: string;
  metadata?: {
    duration?: number;
    quality?: string;
    resolution?: string;
    voice_id?: string;
    script?: string;
  };
  timestamp: string;
}

// ============================================================================
// ВАЛИДАЦИЯ
// ============================================================================

export function validateAkoolAuthRequest(data: unknown): data is AkoolAuthRequest {
  return (
    typeof data === 'object' &&
    data !== null &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (data as any).clientId === 'string' &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (data as any).clientSecret === 'string'
  );
}

export function validateAkoolVideoRequest(data: unknown): data is AkoolVideoRequest {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).image_url === 'string' &&
    typeof (data as any).audio_url === 'string' &&
    typeof (data as any).script === 'string' &&
    (data as any).platform === 'youtube-shorts' &&
    typeof (data as any).duration === 'number' &&
    ['720p', '1080p'].includes((data as any).quality) &&
    ((data as any).text_prompt === undefined || typeof (data as any).text_prompt === 'string')
  );
}

export function validateAkoolTalkingPhotoRequest(data: unknown): data is AkoolTalkingPhotoRequest {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).talking_photo_url === 'string' &&
    typeof (data as any).audio_url === 'string' &&
    typeof (data as any).webhookUrl === 'string' &&
    ((data as any).options === undefined || typeof (data as any).options === 'object')
  );
}

export function validateAkoolTTSRequest(data: unknown): data is AkoolTTSRequest {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).text === 'string' &&
    typeof (data as any).voice_id === 'string' &&
    ((data as any).speed === undefined || typeof (data as any).speed === 'number') &&
    ((data as any).pitch === undefined || typeof (data as any).pitch === 'number') &&
    ((data as any).volume === undefined || typeof (data as any).volume === 'number') &&
    ((data as any).format === undefined || ['mp3', 'wav', 'ogg'].includes((data as any).format))
  );
}

export function validateAkoolVoiceCloneRequest(data: unknown): data is AkoolVoiceCloneRequest {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).name === 'string' &&
    typeof (data as any).audio_url === 'string' &&
    ((data as any).description === undefined || typeof (data as any).description === 'string') &&
    ((data as any).callback_url === undefined || typeof (data as any).callback_url === 'string')
  );
}

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

export const AKOOL_API_ENDPOINTS = {
  BASE_URL: 'https://api.akool.com',
  AUTH: '/auth',
  GET_TOKEN: '/api/open/v3/getToken', // Fallback endpoint
  TALKING_PHOTO: '/photo/talking',
  CREATE_TALKING_PHOTO: '/api/open/v3/content/video/createbytalkingphoto', // Fallback
  VIDEO_STATUS: '/video/status',
  GET_VIDEO_STATUS: '/api/open/v3/content/video/getvideostatus', // Fallback
  TTS: '/api/open/v3/tts/synthesize',
  VOICE_CLONE: '/api/open/v3/voice/clone',
  GET_VOICES: '/api/open/v3/voice/list',
} as const;

export const AKOOL_SUPPORTED_FORMATS = {
  IMAGE: ['image/jpeg', 'image/png', 'image/webp'],
  AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
  VIDEO: ['video/mp4', 'video/webm', 'video/quicktime'],
} as const;

export const AKOOL_ERROR_CODES = {
  SUCCESS: 1000,
  INVALID_PARAMS: 1001,
  AUTH_FAILED: 1002,
  RATE_LIMIT: 1003,
  QUOTA_EXCEEDED: 1004,
  PROCESSING_ERROR: 1015,
  FILE_NOT_FOUND: 2001,
  INVALID_FORMAT: 2002,
  FILE_TOO_LARGE: 2003,
} as const;
