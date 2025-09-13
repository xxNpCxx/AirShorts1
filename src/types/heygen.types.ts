/**
 * HeyGen API типы
 * @see https://docs.heygen.com/
 */

import { ServiceType, VideoQuality, VideoOrientation, ProcessStatus } from './index';

// ============================================================================
// ОСНОВНЫЕ ЗАПРОСЫ
// ============================================================================

export interface HeyGenVideoRequest {
  image_url: string;
  audio_url: string;
  script: string;
  platform: 'youtube-shorts';
  duration: number;
  quality: VideoQuality;
  text_prompt?: string;
}

export interface DigitalTwinRequest {
  image_url: string;
  voice_id: string;
  script: string;
  video_title: string;
  video_orientation?: VideoOrientation;
  fit?: 'cover' | 'contain';
}

export interface PhotoAvatarRequest {
  image_url: string;
  voice_id: string;
  script: string;
  video_title: string;
  video_orientation?: VideoOrientation;
  fit?: 'cover' | 'contain';
}

export interface VoiceCloningRequest {
  name: string;
  audio_url: string;
  callback_url?: string;
  callback_id?: string;
}

export interface UploadAssetRequest {
  type: 'image' | 'audio' | 'video';
  file: Buffer;
  filename: string;
  mime_type: string;
}

// ============================================================================
// ОТВЕТЫ API
// ============================================================================

export interface HeyGenVideoResponse {
  id: string;
  status: ProcessStatus;
  result_url?: string;
  error?: string;
  progress?: number;
  estimated_time?: number;
}

export interface UploadAssetResponse {
  asset_id: string;
  asset_url: string;
  asset_type: 'image' | 'audio' | 'video';
  file_size: number;
  duration?: number; // для аудио/видео
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface StandardVideoPayload {
  image_key: string;
  video_title: string;
  script: string;
  voice_id: string;
  video_orientation?: VideoOrientation;
  fit?: 'cover' | 'contain';
}

export interface VideoInput {
  image_url: string;
  script: string;
  voice_id: string;
  video_title: string;
  video_orientation?: VideoOrientation;
  fit?: 'cover' | 'contain';
}

export interface AvatarIVPayload {
  image_key: string;
  video_title: string;
  script: string;
  voice_id: string;
  video_orientation?: VideoOrientation;
  fit?: 'cover' | 'contain';
}

// ============================================================================
// ВНУТРЕННИЕ ТИПЫ API
// ============================================================================

export interface HeyGenApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface HeyGenStatusResponse {
  id: string;
  status: ProcessStatus;
  result_url?: string;
  error?: string;
  progress?: number;
  estimated_time?: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// WEBHOOK ТИПЫ
// ============================================================================

export interface HeyGenWebhookPayload {
  id: string;
  status: ProcessStatus;
  type: 'video_generation' | 'voice_cloning' | 'asset_upload';
  url?: string;
  error?: string;
  metadata?: {
    video_title?: string;
    voice_id?: string;
    image_key?: string;
    duration?: number;
    quality?: VideoQuality;
  };
  timestamp: string;
}

// ============================================================================
// ПРОЦЕССЫ
// ============================================================================

export interface DigitalTwinProcess {
  id: string;
  userId: number;
  status: ProcessStatus;
  serviceType: ServiceType;
  requestData: DigitalTwinRequest;
  responseData?: HeyGenVideoResponse;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// ============================================================================
// ВАЛИДАЦИЯ
// ============================================================================

export function validateHeyGenVideoRequest(data: unknown): data is HeyGenVideoRequest {
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

export function validateDigitalTwinRequest(data: unknown): data is DigitalTwinRequest {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).image_url === 'string' &&
    typeof (data as any).voice_id === 'string' &&
    typeof (data as any).script === 'string' &&
    typeof (data as any).video_title === 'string' &&
    ((data as any).video_orientation === undefined ||
      ['portrait', 'landscape'].includes((data as any).video_orientation)) &&
    ((data as any).fit === undefined || ['cover', 'contain'].includes((data as any).fit))
  );
}

export function validateAvatarIVPayload(data: unknown): data is AvatarIVPayload {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).image_key === 'string' &&
    typeof (data as any).video_title === 'string' &&
    typeof (data as any).script === 'string' &&
    typeof (data as any).voice_id === 'string' &&
    ((data as any).video_orientation === undefined ||
      ['portrait', 'landscape'].includes((data as any).video_orientation)) &&
    ((data as any).fit === undefined || ['cover', 'contain'].includes((data as any).fit))
  );
}

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

export const HEYGEN_API_ENDPOINTS = {
  BASE_URL: 'https://api.heygen.com',
  UPLOAD_ASSET: '/v1/asset',
  CREATE_AVATAR_IV: '/v2/video/av4/generate',
  CREATE_DIGITAL_TWIN: '/v2/video/digital_twin/generate',
  GET_VIDEO_STATUS: '/v2/video/status',
  VOICE_CLONING: '/v1/voice/clone',
  GET_VOICES: '/v1/voice.list',
} as const;

export const HEYGEN_SUPPORTED_FORMATS = {
  IMAGE: ['image/jpeg', 'image/png', 'image/webp'],
  AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
  VIDEO: ['video/mp4', 'video/webm', 'video/quicktime'],
} as const;
