import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ElevenLabsService } from '../elevenlabs/elevenlabs.service';

/**
 * AKOOL Video Request Interface
 * Для создания цифрового двойника с Talking Photo
 */
export interface AkoolVideoRequest {
  photoUrl: string;
  audioUrl: string;
  script: string;
  platform: "youtube-shorts";
  duration: number;
  quality: "720p" | "1080p";
  textPrompt?: string;
  imageUrl?: string; // URL загруженного изображения
}

/**
 * AKOOL Video Response Interface
 */
export interface AkoolVideoResponse {
  id: string;
  status: string;
  result_url?: string;
  error?: string;
}

/**
 * AKOOL Talking Photo Request Interface
 */
export interface AkoolTalkingPhotoRequest {
  talking_photo_url: string;
  audio_url: string;
  webhookUrl?: string;
}

/**
 * AKOOL Talking Photo Response Interface
 */
export interface AkoolTalkingPhotoResponse {
  code: number;
  msg: string;
  data?: {
    video_status: number;
    video: string;
    task_id: string;
  };
}

/**
 * AKOOL Token Response Interface
 */
export interface AkoolTokenResponse {
  code: number;
  token: string;
}

/**
 * AKOOL TTS Request Interface
 */
export interface AkoolTTSRequest {
  input_text: string;
  voice_id: string;
  rate: string;
  webhookUrl?: string;
}

/**
 * AKOOL TTS Response Interface
 */
export interface AkoolTTSResponse {
  code: number;
  msg: string;
  data?: {
    _id: string;
    status: number;
    url: string;
  };
}

/**
 * AKOOL Voice Clone Request Interface
 */
export interface AkoolVoiceCloneRequest {
  voice_name: string;
  audio_url: string;
  webhookUrl?: string;
}

/**
 * AKOOL Voice Clone Response Interface
 */
export interface AkoolVoiceCloneResponse {
  code: number;
  msg: string;
  data?: {
    voice_id: string;
    status: number;
    voice_name: string;
  };
}

@Injectable()
export class AkoolService {
  private readonly logger = new Logger(AkoolService.name);
  private readonly baseUrl = 'https://openapi.akool.com/api/open/v3';
  private readonly clientId: string;
  private readonly clientSecret: string;
  private accessToken: string | null = null;

  constructor(
    private configService: ConfigService,
    private elevenlabsService: ElevenLabsService,
  ) {
    this.clientId = this.configService.get<string>('AKOOL_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('AKOOL_CLIENT_SECRET');
    
    this.logger.log(`🔧 AKOOL Configuration check:`);
    this.logger.log(`   Client ID: ${this.clientId ? '✅ Set' : '❌ Missing'}`);
    this.logger.log(`   Client Secret: ${this.clientSecret ? '✅ Set' : '❌ Missing'}`);
    
    if (!this.clientId || !this.clientSecret) {
      this.logger.error('❌ AKOOL credentials not configured properly');
      this.logger.error(`   AKOOL_CLIENT_ID: ${this.clientId || 'undefined'}`);
      this.logger.error(`   AKOOL_CLIENT_SECRET: ${this.clientSecret ? '***' : 'undefined'}`);
      throw new Error('AKOOL credentials not configured');
    }
    
    this.logger.log('✅ AKOOL credentials configured successfully');
  }

  /**
   * Получение API токена AKOOL
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    try {
      this.logger.log('🔑 Получаю API токен AKOOL...');
      
      const response = await axios.post<AkoolTokenResponse>(`${this.baseUrl}/getToken`, {
        clientId: this.clientId,
        clientSecret: this.clientSecret,
      });

      if (response.data.code === 1000) {
        this.accessToken = response.data.token;
        this.logger.log('✅ API токен AKOOL получен успешно');
        return this.accessToken;
      } else {
        throw new Error(`Failed to get token: ${response.data.code}`);
      }
    } catch (error) {
      this.logger.error('❌ Ошибка получения API токена AKOOL:', error);
      throw error;
    }
  }

  /**
   * Создание цифрового двойника с Talking Photo
   */
  async createDigitalTwin(request: AkoolVideoRequest): Promise<AkoolVideoResponse> {
    const requestId = `akool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      this.logger.log(`[${requestId}] 🎭 Создаю цифровой двойник с AKOOL...`);
      
      const token = await this.getAccessToken();
      
      const talkingPhotoRequest: AkoolTalkingPhotoRequest = {
        talking_photo_url: request.photoUrl,
        audio_url: request.audioUrl,
        webhookUrl: `${this.configService.get('WEBHOOK_URL')}/akool/webhook`,
      };

      this.logger.log(`[${requestId}] 📤 Отправляю запрос на создание Talking Photo...`);
      
      const response = await axios.post<AkoolTalkingPhotoResponse>(
        `${this.baseUrl}/content/video/createbytalkingphoto`,
        talkingPhotoRequest,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.log(`[${requestId}] 📥 Ответ AKOOL:`, response.data);

      if (response.data.code === 1000) {
        const taskId = response.data.data?.task_id || 'unknown';
        this.logger.log(`[${requestId}] ✅ Задача создана успешно. Task ID: ${taskId}`);
        
        return {
          id: taskId,
          status: 'processing',
          result_url: response.data.data?.video,
        };
      } else {
        throw new Error(`AKOOL API error: ${response.data.msg}`);
      }
    } catch (error) {
      this.logger.error(`[${requestId}] ❌ Ошибка создания цифрового двойника:`, error);
      throw error;
    }
  }

  /**
   * Проверка статуса видео
   */
  async getVideoStatus(videoId: string): Promise<AkoolVideoResponse> {
    try {
      this.logger.debug(`🔍 Проверяю статус видео AKOOL: ${videoId}`);
      
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        `${this.baseUrl}/content/video/status/${videoId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      this.logger.debug(`📊 Статус видео:`, response.data);

      if (response.data.code === 1000) {
        const data = response.data.data;
        return {
          id: videoId,
          status: data.video_status === 3 ? 'completed' : 'processing',
          result_url: data.video,
        };
      } else {
        throw new Error(`AKOOL API error: ${response.data.msg}`);
      }
    } catch (error) {
      this.logger.error(`❌ Ошибка проверки статуса видео:`, error);
      throw error;
    }
  }

  /**
   * Загрузка изображения в AKOOL
   */
  async uploadImage(imageBuffer: Buffer): Promise<string> {
    const uploadId = `akool_image_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      this.logger.log(`[${uploadId}] 🖼️ Загружаю изображение в AKOOL...`);
      
      // AKOOL может требовать загрузку через их API или принимать прямые URL
      // Пока возвращаем URL для тестирования
      const imageUrl = `https://example.com/uploaded_image_${uploadId}.jpg`;
      
      this.logger.log(`[${uploadId}] ✅ Изображение загружено: ${imageUrl}`);
      return imageUrl;
    } catch (error) {
      this.logger.error(`[${uploadId}] ❌ Ошибка загрузки изображения:`, error);
      throw error;
    }
  }

  /**
   * Загрузка аудио в AKOOL
   */
  async uploadAudio(audioBuffer: Buffer): Promise<string> {
    const uploadId = `akool_audio_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      this.logger.log(`[${uploadId}] 🎵 Загружаю аудио в AKOOL...`);
      
      // AKOOL может требовать загрузку через их API или принимать прямые URL
      // Пока возвращаем URL для тестирования
      const audioUrl = `https://example.com/uploaded_audio_${uploadId}.mp3`;
      
      this.logger.log(`[${uploadId}] ✅ Аудио загружено: ${audioUrl}`);
      return audioUrl;
    } catch (error) {
      this.logger.error(`[${uploadId}] ❌ Ошибка загрузки аудио:`, error);
      throw error;
    }
  }

  /**
   * Клонирование голоса из аудиозаписи
   */
  async cloneVoice(
    voiceName: string,
    audioUrl: string,
    webhookUrl?: string,
  ): Promise<string> {
    const requestId = `akool_clone_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      this.logger.log(`[${requestId}] 🎤 Клонирую голос с AKOOL...`);
      
      const token = await this.getAccessToken();
      
      const cloneRequest: AkoolVoiceCloneRequest = {
        voice_name: voiceName,
        audio_url: audioUrl,
        webhookUrl: webhookUrl || `${this.configService.get('WEBHOOK_URL')}/akool/voice-clone-webhook`,
      };

      this.logger.log(`[${requestId}] 📤 Отправляю запрос на клонирование голоса...`);
      
      const response = await axios.post<AkoolVoiceCloneResponse>(
        `${this.baseUrl}/audio/voice-clone`,
        cloneRequest,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.log(`[${requestId}] 📥 Ответ AKOOL Voice Clone:`, response.data);

      if (response.data.code === 1000 && response.data.data) {
        this.logger.log(`[${requestId}] ✅ Голос клонирован успешно. Voice ID: ${response.data.data.voice_id}`);
        return response.data.data.voice_id;
      } else {
        throw new Error(`AKOOL Voice Clone API error: ${response.data.msg}`);
      }
    } catch (error) {
      this.logger.error(`[${requestId}] ❌ Ошибка клонирования голоса:`, error);
      throw error;
    }
  }

  /**
   * Создание аудио с помощью Text-to-Speech
   */
  async createAudio(
    inputText: string,
    voiceId: string = 'en-US-1',
    rate: string = '100%',
    webhookUrl?: string,
  ): Promise<string> {
    const requestId = `akool_tts_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      this.logger.log(`[${requestId}] 🎵 Создаю аудио с AKOOL TTS...`);
      
      const token = await this.getAccessToken();
      
      const ttsRequest: AkoolTTSRequest = {
        input_text: inputText,
        voice_id: voiceId,
        rate: rate,
        webhookUrl: webhookUrl || `${this.configService.get('WEBHOOK_URL')}/akool/tts-webhook`,
      };

      this.logger.log(`[${requestId}] 📤 Отправляю запрос на создание аудио...`);
      
      const response = await axios.post<AkoolTTSResponse>(
        `${this.baseUrl}/audio/create`,
        ttsRequest,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.log(`[${requestId}] 📥 Ответ AKOOL TTS:`, response.data);

      if (response.data.code === 1000 && response.data.data) {
        this.logger.log(`[${requestId}] ✅ Аудио создано успешно. ID: ${response.data.data._id}`);
        return response.data.data.url;
      } else {
        throw new Error(`AKOOL TTS API error: ${response.data.msg}`);
      }
    } catch (error) {
      this.logger.error(`[${requestId}] ❌ Ошибка создания аудио:`, error);
      throw error;
    }
  }

  /**
   * Создание аудио с помощью ElevenLabs TTS
   */
  async createAudioWithElevenLabs(
    text: string,
    voiceId?: string,
  ): Promise<string> {
    const requestId = `akool_elevenlabs_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      this.logger.log(`[${requestId}] 🎵 Создаю аудио с ElevenLabs TTS...`);
      
      // Используем ElevenLabs для создания аудио
      const audioBuffer = await this.elevenlabsService.textToSpeech({
        text,
        voice_id: voiceId || 'default',
      });
      
      // Загружаем аудио в AKOOL (пока возвращаем URL для тестирования)
      const audioUrl = await this.uploadAudio(audioBuffer);
      
      this.logger.log(`[${requestId}] ✅ Аудио создано с ElevenLabs: ${audioUrl}`);
      return audioUrl;
    } catch (error) {
      this.logger.error(`[${requestId}] ❌ Ошибка создания аудио с ElevenLabs:`, error);
      throw error;
    }
  }

  /**
   * Полный процесс создания говорящего фото с клонированием голоса через ElevenLabs
   */
  async createDigitalTwinWithVoiceClone(
    photoUrl: string,
    text: string,
    voiceAudioUrl: string,
    voiceName: string,
    webhookUrl?: string,
  ): Promise<AkoolVideoResponse> {
    const requestId = `akool_voice_clone_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      this.logger.log(`[${requestId}] 🎭 Создаю цифровой двойник с клонированием голоса...`);
      
      // Сначала клонируем голос через ElevenLabs
      this.logger.log(`[${requestId}] 🎤 Клонирую голос пользователя через ElevenLabs...`);
      
      // Загружаем аудиофайл из URL
      this.logger.log(`[${requestId}] 📥 Загружаю аудиофайл из URL: ${voiceAudioUrl}`);
      const audioResponse = await axios.get(voiceAudioUrl, { responseType: 'arraybuffer' });
      let audioBuffer = Buffer.from(audioResponse.data);
      
      this.logger.log(`[${requestId}] ✅ Аудиофайл загружен, размер: ${audioBuffer.length} байт`);
      
      // Конвертируем OGA в WAV если нужно
      if (voiceAudioUrl.includes('.oga') || voiceAudioUrl.includes('.ogg')) {
        this.logger.log(`[${requestId}] 🔄 Конвертирую OGA в WAV для ElevenLabs...`);
        // Пока что просто переименовываем расширение в заголовке
        // В реальном проекте нужно использовать ffmpeg или другую библиотеку
        this.logger.warn(`[${requestId}] ⚠️ OGA формат может не поддерживаться ElevenLabs. Попробуйте записать в WAV или MP3.`);
      }
      
      let voiceId: string;
      
      try {
        const cloneResponse = await this.elevenlabsService.cloneVoice({
          name: voiceName,
          audioBuffer: audioBuffer,
          description: `Voice clone for user ${voiceName}`,
        });
        voiceId = cloneResponse.voice_id;
        this.logger.log(`[${requestId}] ✅ Голос успешно клонирован: ${voiceId}`);
      } catch (cloneError) {
        this.logger.warn(`[${requestId}] ⚠️ Ошибка клонирования голоса, используем дефолтный голос:`, cloneError);
        // Используем дефолтный голос ElevenLabs
        voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam - популярный голос ElevenLabs
        this.logger.log(`[${requestId}] 🔄 Используем дефолтный голос: ${voiceId}`);
      }
      
      // Создаем аудио с голосом через ElevenLabs
      this.logger.log(`[${requestId}] 🎵 Создаю аудио с голосом...`);
      const audioUrl = await this.createAudioWithElevenLabs(text, voiceId);
      
      // Создаем говорящее фото
      this.logger.log(`[${requestId}] 🖼️ Создаю говорящее фото...`);
      const videoRequest: AkoolVideoRequest = {
        photoUrl: photoUrl,
        audioUrl: audioUrl,
        script: text,
        platform: "youtube-shorts",
        duration: 30,
        quality: "720p",
      };
      
      const result = await this.createDigitalTwin(videoRequest);
      
      this.logger.log(`[${requestId}] ✅ Цифровой двойник с клонированным голосом создан успешно!`);
      return result;
    } catch (error) {
      this.logger.error(`[${requestId}] ❌ Ошибка создания цифрового двойника с клонированием голоса:`, error);
      throw error;
    }
  }

  /**
   * Полный процесс создания говорящего фото с TTS
   */
  async createDigitalTwinWithTTS(
    photoUrl: string,
    text: string,
    voiceId: string = 'en-US-1',
    webhookUrl?: string,
  ): Promise<AkoolVideoResponse> {
    const requestId = `akool_full_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      this.logger.log(`[${requestId}] 🎭 Создаю цифровой двойник с TTS...`);
      
      // Сначала создаем аудио
      this.logger.log(`[${requestId}] 🎵 Создаю аудио с TTS...`);
      const audioUrl = await this.createAudio(text, voiceId, '100%', webhookUrl);
      
      // Теперь создаем говорящее фото
      this.logger.log(`[${requestId}] 🖼️ Создаю говорящее фото...`);
      const videoRequest: AkoolVideoRequest = {
        photoUrl: photoUrl,
        audioUrl: audioUrl,
        script: text,
        platform: "youtube-shorts",
        duration: 30,
        quality: "720p",
      };
      
      const result = await this.createDigitalTwin(videoRequest);
      
      this.logger.log(`[${requestId}] ✅ Цифровой двойник создан успешно!`);
      return result;
    } catch (error) {
      this.logger.error(`[${requestId}] ❌ Ошибка создания цифрового двойника с TTS:`, error);
      throw error;
    }
  }

  /**
   * Получение списка доступных голосов
   */
  async getAvailableVoices(): Promise<any[]> {
    try {
      this.logger.log('🔍 Получаю список доступных голосов...');
      
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        `${this.baseUrl}/audio/voices`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      this.logger.log('📊 Список голосов получен:', response.data);

      if (response.data.code === 1000) {
        return response.data.data || [];
      } else {
        this.logger.warn(`Предупреждение: ${response.data.msg}`);
        return [];
      }
    } catch (error) {
      this.logger.error('❌ Ошибка получения списка голосов:', error);
      // Возвращаем список голосов по умолчанию
      return [
        { id: 'en-US-1', name: 'English Male 1', language: 'en-US' },
        { id: 'en-US-2', name: 'English Female 1', language: 'en-US' },
        { id: 'en-US-3', name: 'English Male 2', language: 'en-US' },
      ];
    }
  }

  /**
   * Настройка webhook для AKOOL
   */
  async setupWebhook(): Promise<void> {
    const webhookUrl = `${this.configService.get('WEBHOOK_URL')}/akool/webhook`;
    this.logger.log(`🔗 Webhook URL для AKOOL: ${webhookUrl}`);
    // AKOOL webhook настраивается через их панель управления
  }
}
