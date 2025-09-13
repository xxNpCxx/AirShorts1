/**
 * D-ID API типы
 * @see https://docs.d-id.com/
 */

import { ProcessStatus } from './index';

// ============================================================================
// ОСНОВНЫЕ ЗАПРОСЫ
// ============================================================================

export interface VideoGenerationRequest {
  photo_url: string;
  audio_url: string;
  script: string;
  platform: 'youtube-shorts';
  duration: number;
  quality: '720p' | '1080p';
  text_prompt?: string;
}

// ============================================================================
// ОТВЕТЫ API
// ============================================================================

export interface VideoGenerationResponse {
  id: string;
  status: ProcessStatus;
  result_url?: string;
  error?: string;
  progress?: number;
  estimated_time?: number;
}

export interface DidApiResponse<T = unknown> {
  id: string;
  status: ProcessStatus;
  result_url?: string;
  error?: string;
  progress?: number;
  estimated_time?: number;
  data?: T;
}

export interface AudioUploadResponse {
  id: string;
  url: string;
  duration: number;
  file_size: number;
  mime_type: string;
}

export interface ImageUploadResponse {
  id: string;
  url: string;
  file_size: number;
  mime_type: string;
  dimensions: {
    width: number;
    height: number;
  };
}

// ============================================================================
// ВАЛИДАЦИЯ
// ============================================================================

export function validateVideoGenerationRequest(data: unknown): data is VideoGenerationRequest {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).photo_url === 'string' &&
    typeof (data as any).audio_url === 'string' &&
    typeof (data as any).script === 'string' &&
    (data as any).platform === 'youtube-shorts' &&
    typeof (data as any).duration === 'number' &&
    ['720p', '1080p'].includes((data as any).quality) &&
    ((data as any).text_prompt === undefined || typeof (data as any).text_prompt === 'string')
  );
}

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

export const DID_API_ENDPOINTS = {
  BASE_URL: 'https://api.d-id.com',
  TALKS: '/talks',
  TALK_STATUS: '/talks/{id}',
  AUDIOS: '/audios',
  IMAGES: '/images',
} as const;

export const DID_SUPPORTED_FORMATS = {
  IMAGE: ['image/jpeg', 'image/png', 'image/webp'],
  AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
  VIDEO: ['video/mp4', 'video/webm', 'video/quicktime'],
} as const;
