/**
 * ElevenLabs API типы
 * @see https://docs.elevenlabs.io/
 */

import { ProcessStatus } from './index';

// ============================================================================
// КЛОНИРОВАНИЕ ГОЛОСА
// ============================================================================

export interface VoiceCloneRequest {
  name: string;
  audio_url: string;
  description?: string;
  labels?: Record<string, string>;
}

export interface VoiceCloneResponse {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  labels?: Record<string, string>;
  available_for_tiers: string[];
  settings: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost: boolean;
  };
  sharing: {
    status: 'public' | 'private';
    history_item_id?: string;
    original_voice_id?: string;
    public_owner_id?: string;
    liked_by_count: number;
    name?: string;
    labels?: Record<string, string>;
    description?: string;
    created_at_unix: number;
    sharing_status: 'public' | 'private';
    availability: 'public' | 'private';
    permission_on_resource: 'public' | 'private';
  };
  high_quality_base_model_ids: string[];
  safety_control: string;
  voice_verification: {
    requires_verification: boolean;
    is_verified: boolean;
    verification_failures: string[];
    verification_attempts: number;
  };
  permission_on_resource: 'public' | 'private';
}

// ============================================================================
// TEXT-TO-SPEECH
// ============================================================================

export interface TextToSpeechRequest {
  text: string;
  voice_id: string;
  model_id?: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost: boolean;
  };
  pronunciation_dictionary_locators?: Array<{
    pronunciation_dictionary_id: string;
    version_id?: string;
  }>;
  seed?: number;
  previous_text?: string;
  next_text?: string;
  previous_request_ids?: string[];
  next_request_ids?: string[];
}

export interface TextToSpeechResponse {
  audio: Buffer;
  content_type: string;
  request_id: string;
  character_count_change_from_user: number;
  character_count_change_from_eleven: number;
}

// ============================================================================
// ГОЛОСА
// ============================================================================

export interface ElevenLabsVoiceResponse {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  labels?: Record<string, string>;
  available_for_tiers: string[];
  settings: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost: boolean;
  };
  sharing: {
    status: 'public' | 'private';
    history_item_id?: string;
    original_voice_id?: string;
    public_owner_id?: string;
    liked_by_count: number;
    name?: string;
    labels?: Record<string, string>;
    description?: string;
    created_at_unix: number;
    sharing_status: 'public' | 'private';
    availability: 'public' | 'private';
    permission_on_resource: 'public' | 'private';
  };
  high_quality_base_model_ids: string[];
  safety_control: string;
  voice_verification: {
    requires_verification: boolean;
    is_verified: boolean;
    verification_failures: string[];
    verification_attempts: number;
  };
  permission_on_resource: 'public' | 'private';
}

// ============================================================================
// WEBHOOK ТИПЫ
// ============================================================================

export interface ElevenLabsWebhookPayload {
  voice_id: string;
  status: ProcessStatus;
  type: 'voice_cloning' | 'text_to_speech';
  audio_url?: string;
  error?: string;
  metadata?: {
    name?: string;
    description?: string;
    character_count?: number;
    model_id?: string;
  };
  timestamp: string;
}

// ============================================================================
// ВАЛИДАЦИЯ
// ============================================================================

export function validateVoiceCloneRequest(data: unknown): data is VoiceCloneRequest {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).name === 'string' &&
    typeof (data as any).audio_url === 'string' &&
    ((data as any).description === undefined || typeof (data as any).description === 'string') &&
    ((data as any).labels === undefined || typeof (data as any).labels === 'object')
  );
}

export function validateTextToSpeechRequest(data: unknown): data is TextToSpeechRequest {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).text === 'string' &&
    typeof (data as any).voice_id === 'string' &&
    ((data as any).model_id === undefined || typeof (data as any).model_id === 'string') &&
    ((data as any).voice_settings === undefined || typeof (data as any).voice_settings === 'object')
  );
}

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

export const ELEVENLABS_API_ENDPOINTS = {
  BASE_URL: 'https://api.elevenlabs.io',
  VOICES: '/v1/voices',
  VOICE_CLONE: '/v1/voices/add',
  TEXT_TO_SPEECH: '/v1/text-to-speech',
  VOICE_SETTINGS: '/v1/voices/{voice_id}/settings',
  VOICE_DELETE: '/v1/voices/{voice_id}',
} as const;

export const ELEVENLABS_SUPPORTED_FORMATS = {
  AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
} as const;
