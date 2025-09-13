import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  ElevenLabsVerificationAttempt, 
  ElevenLabsManualVerification, 
  ElevenLabsSafetyControl, 
  ElevenLabsPermission 
} from '../types';

export interface VoiceCloneRequest {
  name: string;
  audioBuffer: Buffer;
  description?: string;
  contentType?: string;
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
    verification_attempts: ElevenLabsVerificationAttempt[];
    verification_failures: string[];
    verification_attempts_count: number;
    slice_ids: string[];
    manual_verification: ElevenLabsManualVerification;
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
  safety_control: ElevenLabsSafetyControl;
  voice_verification: {
    requires_verification: boolean;
    is_verified: boolean;
    verification_failures: string[];
    verification_attempts_count: number;
    language: string;
  };
  owner_id: string;
  permission_on_resource: ElevenLabsPermission;
}

@Injectable()
export class ElevenLabsService {
  private readonly logger = new Logger(ElevenLabsService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.elevenlabs.io/v1';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ELEVENLABS_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn('ELEVENLABS_API_KEY не найден в переменных окружения');
    }
  }

  /**
   * Конвертирует аудио в WAV формат для ElevenLabs
   * Пока что возвращает оригинальный буфер, так как ElevenLabs поддерживает OGG
   */
  private async convertToWav(audioBuffer: Buffer, originalFormat: string): Promise<Buffer> {
    const convertId = `convert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    try {
      this.logger.log(`[${convertId}] 🔄 Audio format conversion`, {
        convertId,
        originalSize: audioBuffer.length,
        originalFormat,
        timestamp: new Date().toISOString(),
      });

      // Пока что возвращаем оригинальный буфер
      // ElevenLabs поддерживает OGG формат от Telegram
      this.logger.log(`[${convertId}] ✅ Using original audio format (ElevenLabs supports OGG)`, {
        convertId,
        originalSize: audioBuffer.length,
        originalFormat,
        timestamp: new Date().toISOString(),
      });

      return audioBuffer;
    } catch (error) {
      this.logger.error(`[${convertId}] ❌ Error processing audio:`, {
        convertId,
        error: error instanceof Error ? error.message : String(error),
        originalFormat,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Создает клон голоса из аудиофайла (асинхронно через fine-tuning)
   */
  async cloneVoiceAsync(request: VoiceCloneRequest): Promise<VoiceCloneResponse> {
    const cloneId = `clone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      this.logger.log(`[${cloneId}] 🎤 Starting voice fine-tuning with ElevenLabs`);
      this.logger.debug(
        `[${cloneId}] Voice name: ${request.name}, Audio size: ${request.audioBuffer.length} bytes`
      );

      // Конвертируем аудио в WAV формат если нужно
      let audioBuffer = request.audioBuffer;
      const contentType = request.contentType || 'application/octet-stream';

      if (contentType !== 'audio/wav') {
        this.logger.log(`[${cloneId}] 🔄 Converting audio from ${contentType} to WAV`);
        audioBuffer = await this.convertToWav(request.audioBuffer, contentType);
      }

      // Создаем базовый голос
      const formData = new FormData();
      formData.append('name', request.name);
      formData.append('description', request.description || 'Клонированный голос пользователя');
      formData.append('files', new Blob([audioBuffer], { type: 'audio/wav' }), 'voice_sample.wav');

      // Добавляем метки для fine-tuning
      formData.append(
        'labels',
        JSON.stringify({
          accent: 'russian',
          age: 'young_adult',
          gender: 'neutral',
          use_case: 'conversational',
        })
      );

      const response = await fetch(`${this.baseUrl}/voices/add`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
        },
        body: formData,
      });

      this.logger.debug(
        `[${cloneId}] 📥 Voice creation response: ${response.status} ${response.statusText}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`[${cloneId}] ❌ Failed to create voice:`, {
          status: response.status,
          statusText: response.statusText,
          url: `${this.baseUrl}/voices/add`,
          audioSize: request.audioBuffer.length,
          errorBody: errorText,
        });

        // Если instant cloning недоступен, пробуем fine-tuning
        if (errorText.includes('can_not_use_instant_voice_cloning')) {
          this.logger.warn(`[${cloneId}] Instant cloning недоступен, используем fine-tuning`);
          return await this.createVoiceWithFineTuning(request, cloneId);
        }

        throw new Error(`Failed to create voice: ${response.status} - ${errorText}`);
      }

      const result = (await response.json()) as ElevenLabsVoiceResponse;
      this.logger.log(`[${cloneId}] ✅ Voice created successfully with ID: ${result.voice_id}`);
      this.logger.debug(`[${cloneId}] Full response:`, result);

      return {
        voice_id: result.voice_id,
        name: result.name,
        status: 'processing',
        message: 'Клонирование голоса запущено. Вы получите уведомление, когда оно будет готово.',
      };
    } catch (error) {
      this.logger.error(`[${cloneId}] 💥 Critical error creating voice:`, {
        error: error instanceof Error ? error.message : String(error),
        audioSize: request.audioBuffer.length,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Создает голос через fine-tuning (для бесплатных аккаунтов)
   */
  private async createVoiceWithFineTuning(
    request: VoiceCloneRequest,
    cloneId: string
  ): Promise<VoiceCloneResponse> {
    try {
      this.logger.log(`[${cloneId}] 🔧 Using fine-tuning approach for voice creation`);

      // Создаем голос без instant cloning
      const formData = new FormData();
      formData.append('name', request.name);
      formData.append(
        'description',
        request.description || 'Клонированный голос пользователя (fine-tuning)'
      );
      formData.append(
        'files',
        new Blob([request.audioBuffer], { type: 'audio/wav' }),
        'voice_sample.wav'
      );

      const response = await fetch(`${this.baseUrl}/voices/add`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`[${cloneId}] ❌ Fine-tuning also failed:`, errorText);
        throw new Error(`Fine-tuning failed: ${response.status} - ${errorText}`);
      }

      const result = (await response.json()) as ElevenLabsVoiceResponse;
      this.logger.log(`[${cloneId}] ✅ Voice created via fine-tuning with ID: ${result.voice_id}`);

      return {
        voice_id: result.voice_id,
        name: result.name,
        status: 'processing',
        message: 'Клонирование голоса запущено через fine-tuning. Это может занять больше времени.',
      };
    } catch (error) {
      this.logger.error(`[${cloneId}] 💥 Fine-tuning error:`, error);
      throw error;
    }
  }

  /**
   * Создает клон голоса из аудиофайла (синхронно - для обратной совместимости)
   */
  async cloneVoice(request: VoiceCloneRequest): Promise<VoiceCloneResponse> {
    const cloneId = `clone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      this.logger.log(`[${cloneId}] 🎤 Starting voice cloning with ElevenLabs`);
      this.logger.debug(
        `[${cloneId}] Voice name: ${request.name}, Audio size: ${request.audioBuffer.length} bytes`
      );

      const formData = new FormData();
      formData.append('name', request.name);
      formData.append('description', request.description || 'Клонированный голос пользователя');

      // Создаем Blob для Node.js совместимости
      const audioBlob = new Blob([request.audioBuffer], { type: 'audio/wav' });
      formData.append('files', audioBlob, 'voice_sample.wav');

      const response = await fetch(`${this.baseUrl}/voices/add`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
        },
        body: formData,
      });

      this.logger.debug(
        `[${cloneId}] 📥 Voice cloning response: ${response.status} ${response.statusText}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`[${cloneId}] ❌ Failed to clone voice:`, {
          status: response.status,
          statusText: response.statusText,
          url: `${this.baseUrl}/voices/add`,
          audioSize: request.audioBuffer.length,
          errorBody: errorText,
        });
        throw new Error(`Failed to clone voice: ${response.status} - ${errorText}`);
      }

      const result = (await response.json()) as ElevenLabsVoiceResponse;
      this.logger.log(`[${cloneId}] ✅ Voice cloned successfully with ID: ${result.voice_id}`);
      this.logger.debug(`[${cloneId}] Full response:`, result);

      return {
        voice_id: result.voice_id,
        name: result.name,
        status: 'created',
      };
    } catch (error) {
      this.logger.error(`[${cloneId}] 💥 Critical error cloning voice:`, {
        error: error instanceof Error ? error.message : String(error),
        audioSize: request.audioBuffer.length,
        stack: error instanceof Error ? error.stack : undefined,
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
        model_id: request.model_id || 'eleven_multilingual_v2',
        voice_settings: request.voice_settings || {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      };

      const response = await fetch(`${this.baseUrl}/text-to-speech/${request.voice_id}`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
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
          errorBody: errorText,
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
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Получает список всех голосов пользователя
   */
  async getVoices(): Promise<ElevenLabsVoiceResponse[]> {
    try {
      this.logger.debug('📋 Fetching user voices from ElevenLabs');

      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('❌ Failed to fetch voices:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
        });
        throw new Error(`Failed to fetch voices: ${response.status} - ${errorText}`);
      }

      const result = (await response.json()) as { voices: ElevenLabsVoiceResponse[] };
      this.logger.log(`✅ Retrieved ${result.voices?.length || 0} voices`);

      return result.voices || [];
    } catch (error) {
      this.logger.error('💥 Critical error fetching voices:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Проверяет статус клонирования голоса
   */
  async getVoiceStatus(
    voiceId: string
  ): Promise<{ status: string; ready: boolean; error?: string }> {
    try {
      this.logger.debug(`🔍 Checking voice status: ${voiceId}`);

      const response = await fetch(`${this.baseUrl}/voices/${voiceId}`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`❌ Failed to get voice status for ${voiceId}:`, {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
        });
        return { status: 'error', ready: false, error: errorText };
      }

      const result = (await response.json()) as ElevenLabsVoiceResponse;

      // Проверяем статус клонирования
      const isReady =
        result.fine_tuning?.finetuning_state === 'completed' ||
        result.fine_tuning?.finetuning_state === 'ready';

      this.logger.debug(`📊 Voice ${voiceId} status:`, {
        finetuning_state: result.fine_tuning?.finetuning_state,
        isReady,
        hasSamples: result.samples?.length > 0,
      });

      return {
        status: result.fine_tuning?.finetuning_state || 'unknown',
        ready: isReady,
        error: result.fine_tuning?.verification_failures?.join(', '),
      };
    } catch (error) {
      this.logger.error(`💥 Critical error getting voice status for ${voiceId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return {
        status: 'error',
        ready: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Удаляет клонированный голос
   */
  async deleteVoice(voiceId: string): Promise<boolean> {
    try {
      this.logger.log(`🗑️ Deleting voice: ${voiceId}`);

      const response = await fetch(`${this.baseUrl}/voices/${voiceId}`, {
        method: 'DELETE',
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`❌ Failed to delete voice ${voiceId}:`, {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
        });
        return false;
      }

      this.logger.log(`✅ Voice ${voiceId} deleted successfully`);
      return true;
    } catch (error) {
      this.logger.error(`💥 Critical error deleting voice ${voiceId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return false;
    }
  }
}
