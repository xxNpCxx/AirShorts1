import { ConfigService } from "@nestjs/config";
export interface VoiceCloneRequest {
    name: string;
    audioBuffer: Buffer;
    description?: string;
}
export interface VoiceCloneResponse {
    voice_id: string;
    name: string;
    status: string;
    message?: string;
}
export interface TextToSpeechRequest {
    text: string;
    voice_id: string;
    model_id?: string;
    voice_settings?: {
        stability: number;
        similarity_boost: number;
        style?: number;
        use_speaker_boost?: boolean;
    };
}
export interface ElevenLabsVoiceResponse {
    voice_id: string;
    name: string;
    samples: Array<{
        sample_id: string;
        file_name: string;
        mime_type: string;
        size_bytes: number;
        hash: string;
    }>;
    category: string;
    fine_tuning: {
        is_allowed_to_fine_tune: boolean;
        finetuning_requested: boolean;
        finetuning_state: string;
        verification_attempts: any[];
        verification_failures: string[];
        verification_attempts_count: number;
        slice_ids: string[];
        manual_verification: any;
        manual_verification_requested: boolean;
    };
    labels: Record<string, string>;
    description: string;
    preview_url: string;
    available_for_tiers: string[];
    settings: {
        stability: number;
        similarity_boost: number;
        style: number;
        use_speaker_boost: boolean;
    };
    sharing: {
        status: string;
        history_item_sample_id: string;
        original_voice_id: string;
        public_owner_id: string;
        liked_by_count: number;
        cloned_by_count: number;
        name: string;
        description: string;
        labels: Record<string, string>;
        created_at_unix: number;
    };
    high_quality_base_model_ids: string[];
    safety_control: any;
    voice_verification: {
        requires_verification: boolean;
        is_verified: boolean;
        verification_failures: string[];
        verification_attempts_count: number;
        language: string;
    };
    owner_id: string;
    permission_on_resource: any;
}
export declare class ElevenLabsService {
    private readonly configService;
    private readonly logger;
    private readonly apiKey;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    cloneVoiceAsync(request: VoiceCloneRequest): Promise<VoiceCloneResponse>;
    cloneVoice(request: VoiceCloneRequest): Promise<VoiceCloneResponse>;
    textToSpeech(request: TextToSpeechRequest): Promise<Buffer>;
    getVoices(): Promise<ElevenLabsVoiceResponse[]>;
    getVoiceStatus(voiceId: string): Promise<{
        status: string;
        ready: boolean;
        error?: string;
    }>;
    deleteVoice(voiceId: string): Promise<boolean>;
}
//# sourceMappingURL=elevenlabs.service.d.ts.map