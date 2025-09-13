/**
 * Общие типы для всех API сервисов
 */

import { ServiceType, ProcessStatus, VideoQuality, VideoOrientation } from './index';

// ============================================================================
// ОБЩИЕ API ТИПЫ
// ============================================================================

export interface BaseApiRequest {
  service: ServiceType;
  requestId: string;
  userId: number;
  timestamp: Date;
}

export interface BaseApiResponse {
  success: boolean;
  requestId: string;
  service: ServiceType;
  data?: unknown;
  error?: string;
  code?: number;
  message?: string;
  timestamp: Date;
}

// ============================================================================
// ВИДЕО ГЕНЕРАЦИЯ
// ============================================================================

export interface BaseVideoGenerationRequest extends BaseApiRequest {
  service: ServiceType;
  imageUrl: string;
  audioUrl: string;
  script: string;
  platform: 'youtube-shorts';
  duration: number;
  quality: VideoQuality;
  textPrompt?: string;
  voiceId?: string;
  imageKey?: string;
  videoTitle?: string;
  videoOrientation?: VideoOrientation;
  fit?: 'cover' | 'contain';
}

export interface BaseVideoGenerationResponse extends BaseApiResponse {
  service: ServiceType;
  videoId: string;
  status: ProcessStatus;
  videoUrl?: string;
  progress?: number;
  estimatedTime?: number;
  error?: string;
}

// ============================================================================
// ЗАГРУЗКА ФАЙЛОВ
// ============================================================================

export interface FileUploadRequest extends BaseApiRequest {
  service: ServiceType;
  fileType: 'image' | 'audio' | 'video';
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileBuffer: Buffer;
}

export interface FileUploadResponse extends BaseApiResponse {
  service: ServiceType;
  fileId: string;
  fileUrl: string;
  fileType: 'image' | 'audio' | 'video';
  fileSize: number;
  duration?: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

// ============================================================================
// КЛОНИРОВАНИЕ ГОЛОСА
// ============================================================================

export interface BaseVoiceCloningRequest extends BaseApiRequest {
  service: ServiceType;
  name: string;
  audioUrl: string;
  description?: string;
  labels?: Record<string, string>;
}

export interface BaseVoiceCloningResponse extends BaseApiResponse {
  service: ServiceType;
  voiceId: string;
  name: string;
  status: ProcessStatus;
  audioUrl?: string;
  error?: string;
}

// ============================================================================
// TEXT-TO-SPEECH
// ============================================================================

export interface BaseTextToSpeechRequest extends BaseApiRequest {
  service: ServiceType;
  text: string;
  voiceId: string;
  modelId?: string;
  voiceSettings?: {
    stability: number;
    similarityBoost: number;
    style?: number;
    useSpeakerBoost: boolean;
  };
}

export interface BaseTextToSpeechResponse extends BaseApiResponse {
  service: ServiceType;
  audioUrl: string;
  duration: number;
  characterCount: number;
  requestId: string;
}

// ============================================================================
// СТАТУС ПРОЦЕССА
// ============================================================================

export interface ProcessStatusRequest {
  service: ServiceType;
  processId: string;
  requestId: string;
}

export interface ProcessStatusResponse extends BaseApiResponse {
  service: ServiceType;
  processId: string;
  status: ProcessStatus;
  progress?: number;
  resultUrl?: string;
  error?: string;
  estimatedTime?: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// ============================================================================
// WEBHOOK ТИПЫ
// ============================================================================

export interface WebhookRequest {
  service: ServiceType;
  processId: string;
  status: ProcessStatus;
  type: 'video_generation' | 'voice_cloning' | 'text_to_speech' | 'file_upload';
  resultUrl?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface WebhookResponse {
  success: boolean;
  message: string;
  timestamp: Date;
}

// ============================================================================
// ОШИБКИ API
// ============================================================================

export interface ApiError {
  code: number;
  message: string;
  service: ServiceType;
  requestId: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
  service: ServiceType;
}

// ============================================================================
// КОНФИГУРАЦИЯ API
// ============================================================================

export interface ApiConfig {
  service: ServiceType;
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retries: number;
  rateLimit: {
    requests: number;
    window: number; // в миллисекундах
  };
}

export interface ServiceConfig {
  heygen: ApiConfig;
  akool: ApiConfig;
  elevenlabs: ApiConfig;
  did: ApiConfig;
}

// ============================================================================
// ВАЛИДАЦИЯ
// ============================================================================

export function validateBaseVideoGenerationRequest(
  data: unknown
): data is BaseVideoGenerationRequest {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).service === 'string' &&
    ['heygen', 'd-id', 'akool', 'elevenlabs'].includes((data as any).service) &&
    typeof (data as any).requestId === 'string' &&
    typeof (data as any).userId === 'number' &&
    (data as any).timestamp instanceof Date &&
    typeof (data as any).imageUrl === 'string' &&
    typeof (data as any).audioUrl === 'string' &&
    typeof (data as any).script === 'string' &&
    (data as any).platform === 'youtube-shorts' &&
    typeof (data as any).duration === 'number' &&
    ['720p', '1080p'].includes((data as any).quality)
  );
}

export function validateFileUploadRequest(data: unknown): data is FileUploadRequest {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).service === 'string' &&
    ['heygen', 'd-id', 'akool', 'elevenlabs'].includes((data as any).service) &&
    typeof (data as any).requestId === 'string' &&
    typeof (data as any).userId === 'number' &&
    (data as any).timestamp instanceof Date &&
    ['image', 'audio', 'video'].includes((data as any).fileType) &&
    typeof (data as any).fileName === 'string' &&
    typeof (data as any).fileSize === 'number' &&
    typeof (data as any).mimeType === 'string' &&
    Buffer.isBuffer((data as any).fileBuffer)
  );
}

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

export const API_SERVICES: ServiceType[] = ['heygen', 'd-id', 'akool', 'elevenlabs'];

export const SUPPORTED_PLATFORMS = ['youtube-shorts'] as const;

export const SUPPORTED_QUALITIES: VideoQuality[] = ['720p', '1080p'];

export const SUPPORTED_ORIENTATIONS: VideoOrientation[] = ['portrait', 'landscape'];

export const SUPPORTED_FIT_OPTIONS = ['cover', 'contain'] as const;
