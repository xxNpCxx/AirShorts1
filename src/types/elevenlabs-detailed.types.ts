/**
 * Детальные типы для ElevenLabs API
 */

// ============================================================================
// FINE TUNING ТИПЫ
// ============================================================================

export interface ElevenLabsFineTuning {
  is_allowed_to_fine_tune: boolean;
  finetuning_requested: boolean;
  finetuning_state: string;
  verification_attempts: ElevenLabsVerificationAttempt[];
  verification_failures: string[];
  verification_attempts_count: number;
  slice_ids: string[];
  manual_verification: ElevenLabsManualVerification;
  manual_verification_requested: boolean;
}

export interface ElevenLabsVerificationAttempt {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  error?: string;
  result?: {
    quality_score: number;
    clarity_score: number;
    similarity_score: number;
  };
}

export interface ElevenLabsManualVerification {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at?: string;
  reviewer_id?: string;
  notes?: string;
  quality_score?: number;
  clarity_score?: number;
  similarity_score?: number;
}

// ============================================================================
// SAFETY CONTROL ТИПЫ
// ============================================================================

export interface ElevenLabsSafetyControl {
  enabled: boolean;
  level: 'low' | 'medium' | 'high';
  filters: {
    profanity: boolean;
    violence: boolean;
    adult_content: boolean;
    hate_speech: boolean;
  };
  custom_rules?: string[];
  last_updated: string;
}

// ============================================================================
// PERMISSION ТИПЫ
// ============================================================================

export interface ElevenLabsPermission {
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  can_share: boolean;
  can_clone: boolean;
  can_use_for_tts: boolean;
  can_use_for_voice_cloning: boolean;
  restrictions?: {
    max_usage_per_day?: number;
    max_usage_per_month?: number;
    allowed_use_cases?: string[];
    blocked_use_cases?: string[];
  };
  granted_by: string;
  granted_at: string;
  expires_at?: string;
}

// ============================================================================
// РАСШИРЕННЫЕ VOICE ТИПЫ
// ============================================================================

export interface ElevenLabsDetailedVoice {
  voice_id: string;
  name: string;
  samples?: ElevenLabsVoiceSample[];
  category: string;
  fine_tuning: ElevenLabsFineTuning;
  labels: Record<string, string>;
  description: string;
  preview_url: string;
  available_for_tiers: string[];
  settings: ElevenLabsVoiceSettings;
  sharing: ElevenLabsVoiceSharing;
  high_quality_base_model_ids: string[];
  safety_control: ElevenLabsSafetyControl;
  voice_verification: ElevenLabsVoiceVerification;
  owner_id: string;
  permission_on_resource: ElevenLabsPermission;
  created_at: string;
  updated_at: string;
}

export interface ElevenLabsVoiceSample {
  sample_id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  hash: string;
  created_at: string;
}

export interface ElevenLabsVoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost: boolean;
}

export interface ElevenLabsVoiceSharing {
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
}

export interface ElevenLabsVoiceVerification {
  requires_verification: boolean;
  is_verified: boolean;
  verification_failures: string[];
  verification_attempts_count: number;
  language: string;
}

// ============================================================================
// ВАЛИДАЦИЯ
// ============================================================================

export function validateElevenLabsVerificationAttempt(
  data: unknown
): data is ElevenLabsVerificationAttempt {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).id === 'string' &&
    ['pending', 'processing', 'completed', 'failed'].includes((data as any).status) &&
    typeof (data as any).created_at === 'string' &&
    typeof (data as any).updated_at === 'string'
  );
}

export function validateElevenLabsManualVerification(
  data: unknown
): data is ElevenLabsManualVerification {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).id === 'string' &&
    ['pending', 'approved', 'rejected'].includes((data as any).status) &&
    typeof (data as any).requested_at === 'string'
  );
}

export function validateElevenLabsSafetyControl(data: unknown): data is ElevenLabsSafetyControl {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).enabled === 'boolean' &&
    ['low', 'medium', 'high'].includes((data as any).level) &&
    typeof (data as any).filters === 'object' &&
    typeof (data as any).last_updated === 'string'
  );
}

export function validateElevenLabsPermission(data: unknown): data is ElevenLabsPermission {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).can_read === 'boolean' &&
    typeof (data as any).can_write === 'boolean' &&
    typeof (data as any).can_delete === 'boolean' &&
    typeof (data as any).can_share === 'boolean' &&
    typeof (data as any).can_clone === 'boolean' &&
    typeof (data as any).can_use_for_tts === 'boolean' &&
    typeof (data as any).can_use_for_voice_cloning === 'boolean' &&
    typeof (data as any).granted_by === 'string' &&
    typeof (data as any).granted_at === 'string'
  );
}
