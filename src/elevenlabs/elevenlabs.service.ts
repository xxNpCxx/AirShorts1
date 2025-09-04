import { Injectable, Logger } from "@nestjs/common";
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

@Injectable()
export class ElevenLabsService {
  private readonly logger = new Logger(ElevenLabsService.name);
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.elevenlabs.io/v1";

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>("ELEVENLABS_API_KEY") || "";
    if (!this.apiKey) {
      this.logger.warn("ELEVENLABS_API_KEY не найден в переменных окружения");
    }
  }

  /**
   * Создает клон голоса из аудиофайла
   */
  async cloneVoice(request: VoiceCloneRequest): Promise<VoiceCloneResponse> {
    const cloneId = `clone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      this.logger.log(`[${cloneId}] 🎤 Starting voice cloning with ElevenLabs`);
      this.logger.debug(`[${cloneId}] Voice name: ${request.name}, Audio size: ${request.audioBuffer.length} bytes`);

      const formData = new FormData();
      formData.append("name", request.name);
      formData.append("description", request.description || "Клонированный голос пользователя");
      formData.append("files", new Blob([request.audioBuffer], { type: "audio/wav" }), "voice_sample.wav");

      const response = await fetch(`${this.baseUrl}/voices/add`, {
        method: "POST",
        headers: {
          "xi-api-key": this.apiKey,
        },
        body: formData,
      });

      this.logger.debug(`[${cloneId}] 📥 Voice cloning response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`[${cloneId}] ❌ Failed to clone voice:`, {
          status: response.status,
          statusText: response.statusText,
          url: `${this.baseUrl}/voices/add`,
          audioSize: request.audioBuffer.length,
          errorBody: errorText
        });
        throw new Error(`Failed to clone voice: ${response.status} - ${errorText}`);
      }

      const result = await response.json() as ElevenLabsVoiceResponse;
      this.logger.log(`[${cloneId}] ✅ Voice cloned successfully with ID: ${result.voice_id}`);
      this.logger.debug(`[${cloneId}] Full response:`, result);

      return {
        voice_id: result.voice_id,
        name: result.name,
        status: "created",
      };
    } catch (error) {
      this.logger.error(`[${cloneId}] 💥 Critical error cloning voice:`, {
        error: error instanceof Error ? error.message : String(error),
        audioSize: request.audioBuffer.length,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Генерирует речь с использованием клонированного голоса
   */
  async textToSpeech(request: TextToSpeechRequest): Promise<Buffer> {
    const ttsId = `tts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      this.logger.log(`[${ttsId}] 🗣️ Starting text-to-speech with voice: ${request.voice_id}`);
      this.logger.debug(`[${ttsId}] Text length: ${request.text.length} characters`);

      const payload = {
        text: request.text,
        model_id: request.model_id || "eleven_multilingual_v2",
        voice_settings: request.voice_settings || {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      };

      const response = await fetch(`${this.baseUrl}/text-to-speech/${request.voice_id}`, {
        method: "POST",
        headers: {
          "xi-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      this.logger.debug(`[${ttsId}] 📥 TTS response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`[${ttsId}] ❌ Failed to generate speech:`, {
          status: response.status,
          statusText: response.statusText,
          url: `${this.baseUrl}/text-to-speech/${request.voice_id}`,
          textLength: request.text.length,
          errorBody: errorText
        });
        throw new Error(`Failed to generate speech: ${response.status} - ${errorText}`);
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      this.logger.log(`[${ttsId}] ✅ Speech generated successfully: ${audioBuffer.length} bytes`);

      return audioBuffer;
    } catch (error) {
      this.logger.error(`[${ttsId}] 💥 Critical error generating speech:`, {
        error: error instanceof Error ? error.message : String(error),
        textLength: request.text.length,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Получает список всех голосов пользователя
   */
  async getVoices(): Promise<ElevenLabsVoiceResponse[]> {
    try {
      this.logger.debug("📋 Fetching user voices from ElevenLabs");

      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          "xi-api-key": this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error("❌ Failed to fetch voices:", {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        });
        throw new Error(`Failed to fetch voices: ${response.status} - ${errorText}`);
      }

      const result = await response.json() as { voices: ElevenLabsVoiceResponse[] };
      this.logger.log(`✅ Retrieved ${result.voices?.length || 0} voices`);

      return result.voices || [];
    } catch (error) {
      this.logger.error("💥 Critical error fetching voices:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Удаляет клонированный голос
   */
  async deleteVoice(voiceId: string): Promise<boolean> {
    try {
      this.logger.log(`🗑️ Deleting voice: ${voiceId}`);

      const response = await fetch(`${this.baseUrl}/voices/${voiceId}`, {
        method: "DELETE",
        headers: {
          "xi-api-key": this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`❌ Failed to delete voice ${voiceId}:`, {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        });
        return false;
      }

      this.logger.log(`✅ Voice ${voiceId} deleted successfully`);
      return true;
    } catch (error) {
      this.logger.error(`💥 Critical error deleting voice ${voiceId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }
}
