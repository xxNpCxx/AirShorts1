import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from 'axios';

/**
 * HeyGen Video Request Interface
 * @see https://docs.heygen.com/reference/create-an-avatar-video-v2
 */
export interface HeyGenVideoRequest {
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
 * Digital Twin Request Interface
 * Для создания цифрового двойника с Photo Avatar и Voice Clone
 */
export interface DigitalTwinRequest {
  photoUrl: string;
  audioUrl: string;
  script: string;
  videoTitle: string;
  platform: "youtube-shorts";
  quality: "720p" | "1080p";
  callbackId: string;
}

/**
 * Photo Avatar Request Interface
 * @see https://docs.heygen.com/reference/create-photo-avatar
 */
export interface PhotoAvatarRequest {
  name: string;
  photo_url: string;
  callback_url?: string;
  callback_id?: string;
}

/**
 * Voice Cloning Request Interface
 * @see https://docs.heygen.com/reference/create-voice-cloning
 */
export interface VoiceCloningRequest {
  name: string;
  audio_url: string;
  callback_url?: string;
  callback_id?: string;
}

/**
 * Upload Asset Response Interface
 * @see https://docs.heygen.com/reference/upload-asset
 */
export interface UploadAssetResponse {
  data?: {
    asset_key?: string;
    asset_id?: string;
  };
  asset_key?: string;
  asset_id?: string;
  error?: {
    code: number;
    message: string;
  };
}
export interface VoiceCloningRequest {
  name: string;
  audio_url: string;
  callback_url?: string;
  callback_id?: string;
}

export interface HeyGenVideoResponse {
  id: string;
  status: string;
  result_url?: string;
  error?: string;
}

/**
 * Standard Avatar API параметры согласно официальной документации
 * @see https://docs.heygen.com/reference/create-an-avatar-video-v2
 * @endpoint POST /v2/video/generate
 */
export interface StandardVideoPayload {
  video_inputs: VideoInput[];
  dimension: {
    width: number;
    height: number;
  };
  caption?: boolean;
  title?: string;
  callback_id?: string;
  folder_id?: string;
  callback_url?: string;
}

export interface VideoInput {
  character: {
    type: "avatar" | "talking_photo";
    avatar_id?: string;
    talking_photo_id?: string;
    avatar_style?: string;
    talking_photo_style?: string;
    talking_style?: string;        // For talking_photo
    expression?: string;           // For talking_photo
    super_resolution?: boolean;    // For talking_photo
    scale?: number;
  };
  voice: {
    type: "text" | "audio";
    input_text?: string;
    voice_id?: string;
    speed?: number;
    audio_asset_id?: string;
  };
  background?: {
    type: "color" | "image" | "video";
    value?: string;
    image_asset_id?: string;
    fit?: string;
  };
}

/**
 * Avatar IV API параметры согласно официальной документации
 * @see https://docs.heygen.com/reference/create-avatar-iv-video
 * @endpoint POST /v2/video/av4/generate
 * @requires image_key from Upload Asset API
 * @requires video_title (string, required)
 * @requires script (string, required) - NOT input_text!
 * @requires voice_id (string, required)
 * @optional video_orientation ("portrait" | "landscape")
 * @optional fit ("cover" | "contain")
 */
export interface AvatarIVPayload {
  image_key: string;                    // Required
  video_title: string;                  // Required  
  script: string;                       // Required (NOT input_text!)
  voice_id: string;                     // Required
  video_orientation?: 'portrait' | 'landscape'; // Optional enum
  fit?: 'cover' | 'contain';           // Optional enum
}

/**
 * Validates Standard Video API payload against API specification
 * @param payload - Object to validate
 * @returns true if valid, false otherwise
 */
export function validateStandardVideoPayload(payload: any): payload is StandardVideoPayload {
  return (
    Array.isArray(payload.video_inputs) &&
    payload.video_inputs.length > 0 &&
    payload.dimension &&
    typeof payload.dimension.width === 'number' &&
    typeof payload.dimension.height === 'number' &&
    payload.video_inputs.every((input: any) => 
      input.character && 
      ['avatar', 'talking_photo'].includes(input.character.type) &&
      input.voice &&
      ['text', 'audio'].includes(input.voice.type)
    )
  );
}

/**
 * Validates Avatar IV payload against API specification
 * @param payload - Object to validate
 * @returns true if valid, false otherwise
 */
export function validateAvatarIVPayload(payload: any): payload is AvatarIVPayload {
  return (
    typeof payload.image_key === 'string' &&
    typeof payload.video_title === 'string' &&
    typeof payload.script === 'string' &&
    typeof payload.voice_id === 'string' &&
    (!payload.video_orientation || ['portrait', 'landscape'].includes(payload.video_orientation)) &&
    (!payload.fit || ['cover', 'contain'].includes(payload.fit))
  );
}

interface HeyGenApiResponse {
  error: null | string;
  data?: {
    video_id: string;
  };
}

interface HeyGenStatusResponse {
  code: number;
  data?: {
    id: string;
    status: string;
    video_url?: string;
    error?: any;
    duration?: number;
    thumbnail_url?: string;
    gif_url?: string;
    caption_url?: string;
  };
  message: string;
}

/**
 * HeyGen API Configuration
 * 
 * @version Avatar IV API v2 (current)
 * @baseUrl https://api.heygen.com
 * @uploadUrl https://upload.heygen.com
 * @endpoints
 *   - POST /v2/video/av4/generate (Avatar IV)
 *   - POST /v2/video/generate (Standard Avatar)
 *   - POST /v1/asset (Asset Upload)
 *   - GET /v1/avatar.list (List Avatars)
 *   - GET /v1/video_status.get (Video Status)
 * @lastUpdated 2025-09-06
 * @documentation https://docs.heygen.com/reference/create-avatar-iv-video
 */
const HEYGEN_API = {
  baseUrl: 'https://api.heygen.com',
  uploadUrl: 'https://upload.heygen.com',
  version: 'v2',
  endpoints: {
    avatarIV: '/v2/video/av4/generate',
    standardAvatar: '/v2/video/generate',
    uploadAsset: '/v1/asset',
    listAvatars: '/v1/avatar.list',
    videoStatus: '/v1/video_status.get'
  }
} as const;

@Injectable()
export class HeyGenService {
  private readonly logger = new Logger(HeyGenService.name);
  private readonly apiKey: string;
  private readonly baseUrl = HEYGEN_API.baseUrl;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>("HEYGEN_API_KEY") || "";
    if (!this.apiKey) {
      this.logger.warn("HEYGEN_API_KEY не найден в переменных окружения");
    }
  }

  /**
   * Generate video using HeyGen API
   * 
   * @see https://docs.heygen.com/reference/create-an-avatar-video-v2
   * @see https://docs.heygen.com/reference/create-avatar-iv-video
   * @endpoint POST /v2/video/generate (Standard Avatar API)
   * @endpoint POST /v2/video/av4/generate (Avatar IV API)
   * @param request - Video generation parameters
   * @returns Promise with video generation response
   * @throws Error if API validation fails or request is invalid
   */
  async generateVideo(request: HeyGenVideoRequest): Promise<HeyGenVideoResponse> {
    const requestId = `heygen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      this.logger.log(`[${requestId}] 🚀 Starting video generation with HeyGen API`);
      this.logger.debug(`[${requestId}] Request params: platform=${request.platform}, quality=${request.quality}, duration=${request.duration}`);
      this.logger.debug(`[${requestId}] Audio provided: ${!!request.audioUrl}, Script length: ${request.script?.length || 0} chars`);

      // Определяем, использовать ли пользовательское аудио или TTS
      const useCustomAudio = request.audioUrl && 
                            request.audioUrl.trim() !== "" && 
                            request.audioUrl !== "undefined" && 
                            request.audioUrl !== "null" &&
                            !request.audioUrl.includes('heygen_tts_required');

      // Получаем список доступных аватаров для дефолтного значения
      const availableAvatars = await this.getAvailableAvatars();
      const defaultAvatarId = availableAvatars[0] || "1bd001e7-c335-4a6a-9d1b-8f8b5b5b5b5b";

      // HeyGen API v2 структура согласно документации
      let payload: StandardVideoPayload = {
        video_inputs: [
          {
            character: {
              type: "avatar",
              avatar_id: defaultAvatarId, // Рабочий аватар для бесплатного плана
              avatar_style: "normal"
            },
            voice: {
              type: "text",
              input_text: request.script,
              voice_id: "119caed25533477ba63822d5d1552d25", // Голос из документации
              speed: 1.0
            }
          }
        ],
        dimension: {
          width: 1280,
          height: 720
        }
      };

      // Если есть пользовательское фото, создаем TalkingPhoto в Standard API
      if (request.imageUrl && request.imageUrl.trim() !== "" && request.imageUrl !== "undefined" && request.imageUrl !== "null" && request.imageUrl !== "heygen_placeholder_image_url" && request.imageUrl !== "heygen_use_available_avatar") {
        this.logger.log(`[${requestId}] 📸 Используем пользовательское фото в Standard API: ${request.imageUrl}`);
        
        // Определяем тип загруженного изображения
        if (request.imageUrl.includes('photo_avatar_')) {
          // Photo Avatar - используем TalkingPhoto
          this.logger.log(`[${requestId}] 🎭 Используем Photo Avatar как TalkingPhoto`);
          payload.video_inputs[0].character = {
            type: "talking_photo",
            talking_photo_id: request.imageUrl,
            talking_photo_style: "square",
            talking_style: "expressive",
            expression: "default",
            super_resolution: true,
            scale: 1.0
          };
        } else {
          // Asset или image_key - используем как Image Background
          this.logger.log(`[${requestId}] 🖼️ Используем изображение как Background`);
          payload.video_inputs[0].background = {
            type: "image",
            image_asset_id: request.imageUrl,
            fit: "cover"
          };
        }
      }

      // Если есть валидное пользовательское аудио, используем его
      if (useCustomAudio) {
        this.logger.log(`[${requestId}] 🎵 Используем пользовательское аудио asset: ${request.audioUrl}`);
        payload.video_inputs[0].voice = {
          type: "audio",
          audio_asset_id: request.audioUrl
        };
      }

      // Если нет пользовательского фото, используем доступный аватар
      if (!request.imageUrl || request.imageUrl === "heygen_use_available_avatar" || request.imageUrl === "heygen_placeholder_image_url") {
        this.logger.log(`[${requestId}] 📸 Using available avatar: ${defaultAvatarId}`);
        // defaultAvatarId уже установлен в payload выше
      }

      // Логируем финальный тип голоса
      if (useCustomAudio) {
        this.logger.log(`[${requestId}] 🎵 Using custom user audio from: ${request.audioUrl}`);
      } else {
        this.logger.log(`[${requestId}] 🎵 Using TTS with script: ${request.script?.substring(0, 50)}...`);
      }

      // Валидация payload согласно API стандартам
      if (!validateStandardVideoPayload(payload)) {
        this.logger.error(`[${requestId}] ❌ Invalid Standard Video API parameters:`, payload);
        throw new Error('Invalid Standard Video API parameters');
      }

      this.logger.log(`[${requestId}] 📤 Standard Video payload (validated):`, payload);
      this.logger.log(`[${requestId}] 📤 Sending request to ${this.baseUrl}${HEYGEN_API.endpoints.standardAvatar}`);

      const response = await fetch(`${this.baseUrl}${HEYGEN_API.endpoints.standardAvatar}`, {
        method: "POST",
        headers: {
          "X-API-KEY": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      this.logger.log(`[${requestId}] 📥 HeyGen API response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`[${requestId}] ❌ HeyGen API Error:`, {
          status: response.status,
          statusText: response.statusText,
          url: `${this.baseUrl}/v2/video/generate`,
          method: "POST",
          errorBody: errorText,
        });
        throw new Error(`HeyGen API error: ${response.status} - ${errorText}`);
      }

      const result = (await response.json()) as HeyGenApiResponse;
      this.logger.log(`[${requestId}] ✅ Video generation started successfully with ID: ${result.data?.video_id}`);
      this.logger.log(`[${requestId}] Full HeyGen response:`, result);

      return {
        id: result.data?.video_id || "",
        status: "created",
      };
    } catch (error) {
      this.logger.error(`[${requestId}] 💥 Critical error in generateVideo:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        requestParams: {
          platform: request.platform,
          quality: request.quality,
          duration: request.duration,
          hasPhoto: !!request.photoUrl,
          hasAudio: !!request.audioUrl,
          scriptLength: request.script?.length || 0
        }
      });
      throw error;
    }
  }

  async getVideoStatus(videoId: string): Promise<HeyGenVideoResponse> {
    try {
      this.logger.debug(`🔍 Checking status for HeyGen video: ${videoId}`);
      
      const response = await fetch(`${this.baseUrl}/v1/video_status.get?video_id=${videoId}`, {
        headers: {
          "X-API-KEY": this.apiKey,
        },
      });

      this.logger.debug(`📥 Status check response: ${response.status} ${response.statusText} for video ${videoId}`);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`❌ Failed to get video status for ${videoId}:`, {
          status: response.status,
          statusText: response.statusText,
          url: `${this.baseUrl}/v1/video_status.get?video_id=${videoId}`,
          errorBody: errorText
        });
        throw new Error(`Failed to get video status: ${response.status} - ${errorText}`);
      }

      const result = (await response.json()) as HeyGenStatusResponse;
      
      this.logger.debug(`📊 Video ${videoId} status: ${result.data?.status}`, {
        hasResultUrl: !!result.data?.video_url,
        hasError: !!result.data?.error,
        errorMessage: result.data?.error
      });

      // Логируем особые статусы
      if (result.data?.status === 'completed' && result.data?.video_url) {
        this.logger.log(`✅ Video ${videoId} completed successfully with URL: ${result.data.video_url}`);
      } else if (result.data?.status === 'failed' || result.data?.error) {
        this.logger.error(`❌ Video ${videoId} failed:`, {
          status: result.data?.status,
          error: result.data?.error,
          fullResponse: result
        });
      }

      return {
        id: result.data?.id || videoId,
        status: result.data?.status || "unknown",
        result_url: result.data?.video_url,
        error: result.data?.error,
      };
    } catch (error) {
      this.logger.error(`💥 Critical error getting video status for ${videoId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Upload audio to HeyGen Assets API for Standard Avatar API
   * 
   * @see https://docs.heygen.com/reference/upload-asset
   * @endpoint POST /v1/upload
   * @param audioBuffer - Audio file buffer
   * @returns Promise with audio asset ID
   * @throws Error if upload fails
   */
  /**
   * Upload audio asset to HeyGen API
   * 
   * @see https://docs.heygen.com/reference/upload-asset
   * @endpoint POST https://upload.heygen.com/v1/asset
   * @param audioBuffer - Audio file buffer
   * @returns Promise with audio asset ID
   * @throws Error if upload fails
   */
  async uploadAudio(audioBuffer: Buffer): Promise<string> {
    const uploadId = `heygen_audio_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      this.logger.log(`[${uploadId}] 🎵 Загружаем пользовательское аудио в HeyGen Assets (${audioBuffer.length} bytes)`);
      
      // Используем правильный FormData для Node.js
      const FormData = require('form-data');
      const formData = new FormData();
      
      // Добавляем файл с правильными параметрами
      formData.append('file', audioBuffer, {
        filename: 'user_audio.wav',
        contentType: 'audio/wav',
        knownLength: audioBuffer.length
      });
      
      this.logger.debug(`[${uploadId}] 📤 FormData prepared with ${audioBuffer.length} bytes`);
      
      const response = await fetch('https://upload.heygen.com/v1/asset', {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apiKey,
          ...formData.getHeaders(),
        },
        body: formData,
      });

      this.logger.log(`[${uploadId}] 📥 Upload Asset response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`[${uploadId}] ❌ Audio upload failed: ${response.status} ${response.statusText}`);
        this.logger.error(`[${uploadId}] Error details: ${errorText}`);
        throw new Error(`Audio upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json() as any;
      this.logger.log(`[${uploadId}] 📋 Upload Asset response data:`, result);
      
      const audioAssetId = result.data?.asset_id || result.asset_id;
      
      if (!audioAssetId) {
        this.logger.error(`[${uploadId}] ❌ No asset_id in response:`, result);
        throw new Error('No asset_id returned from HeyGen Upload Asset API');
      }
      
      this.logger.log(`[${uploadId}] ✅ Audio uploaded successfully: ${audioAssetId}`);
      return audioAssetId;
      
    } catch (error) {
      this.logger.error(`[${uploadId}] ❌ Error uploading audio:`, error);
      throw error;
    }
  }

  /**
   * Upload image asset to HeyGen API for Avatar IV
   * 
   * @see https://docs.heygen.com/reference/upload-asset
   * @endpoint POST https://upload.heygen.com/v1/asset
   * @param imageBuffer - Image file buffer  
   * @returns Promise with image_key for Avatar IV or asset_id for Standard API
   */
  async uploadImage(imageBuffer: Buffer): Promise<string> {
    const uploadId = `heygen_image_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      this.logger.log(`[${uploadId}] 🖼️ Загружаем пользовательское фото в HeyGen Assets (${imageBuffer.length} bytes)`);
      
      // Используем правильный FormData для Node.js
      const FormData = require('form-data');
      const formData = new FormData();
      
      // Добавляем файл с правильными параметрами
      formData.append('file', imageBuffer, {
        filename: 'user_photo.jpg',
        contentType: 'image/jpeg',
        knownLength: imageBuffer.length
      });
      
      this.logger.debug(`[${uploadId}] 📤 FormData prepared with ${imageBuffer.length} bytes`);
      
      const response = await fetch('https://upload.heygen.com/v1/asset', {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apiKey,
          ...formData.getHeaders(),
        },
        body: formData,
      });

      this.logger.log(`[${uploadId}] 📥 Upload Asset response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`[${uploadId}] ❌ Image upload failed: ${response.status} ${response.statusText}`);
        this.logger.error(`[${uploadId}] Error details: ${errorText}`);
        throw new Error(`Image upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json() as any;
      this.logger.log(`[${uploadId}] 📋 Upload Asset response data:`, result);
      
      // Ищем image_key для Avatar IV или asset_id для Standard API
      const imageKey = result.data?.image_key || result.image_key;
      const assetId = result.data?.asset_id || result.asset_id;
      
      if (imageKey) {
        this.logger.log(`[${uploadId}] ✅ Image Key для Avatar IV: ${imageKey}`);
        return imageKey;
      } else if (assetId) {
        this.logger.log(`[${uploadId}] ✅ Asset ID для Standard API: ${assetId}`);
        return assetId;
      } else {
        this.logger.error(`[${uploadId}] ❌ No image_key or asset_id in response:`, result);
        throw new Error('No image_key or asset_id returned from HeyGen Upload Asset API');
      }
      
    } catch (error) {
      this.logger.error(`[${uploadId}] ❌ Error uploading image:`, error);
      throw error;
    }
  }

  private async uploadImageFallback(imageBuffer: Buffer, uploadId: string): Promise<string> {
    try {
      this.logger.log(`[${uploadId}] 🔄 Fallback: trying direct image upload...`);
      
      const formData = new FormData();
      formData.append('image', new Blob([new Uint8Array(imageBuffer)]), 'user_photo.jpg');
      
      const response = await fetch(`${this.baseUrl}/v2/image/upload`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`[${uploadId}] ❌ Fallback image upload failed: ${response.status} ${response.statusText}`);
        this.logger.error(`[${uploadId}] Error details: ${errorText}`);
        this.logger.warn(`[${uploadId}] ⚠️ Will use default avatar instead of custom photo`);
        return "heygen_placeholder_image_url";
      }

      const result = await response.json() as any;
      const imageUrl = result.data?.image_url || result.image_url || result.url;
      this.logger.log(`[${uploadId}] ✅ Fallback image upload successful: ${imageUrl}`);
      
      return imageUrl;
    } catch (error) {
      this.logger.error(`[${uploadId}] ❌ Fallback image upload error:`, error);
      this.logger.warn(`[${uploadId}] ⚠️ Will use default avatar instead of custom photo`);
      return "heygen_placeholder_image_url";
    }
  }

  // Получаем список доступных аватаров для fallback
  private async getAvailableAvatars(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/avatar.list`, {
        headers: {
          'X-API-KEY': this.apiKey,
        },
      });

      if (!response.ok) {
        this.logger.warn('Failed to get available avatars, using hardcoded fallback');
        return this.getHardcodedAvatars();
      }

      const result = await response.json() as any;
      const avatars = result.data?.avatars || [];
      const avatarIds = avatars.map((avatar: any) => avatar.avatar_id).filter(Boolean);
      
      if (avatarIds.length === 0) {
        this.logger.warn('No avatars found, using hardcoded fallback');
        return this.getHardcodedAvatars();
      }

      this.logger.log(`Found ${avatarIds.length} available avatars: ${avatarIds.slice(0, 3).join(', ')}...`);
      return avatarIds;
    } catch (error) {
      this.logger.error('Error getting available avatars:', error);
      return this.getHardcodedAvatars();
    }
  }

  // Список проверенных аватаров, которые работают с HeyGen API
  private getHardcodedAvatars(): string[] {
    return [
      "Abigail_expressive_2024112501",
      "Abigail_standing_office_front", 
      "Abigail_sitting_sofa_front",
      "1bd001e7-c335-4a6a-9d1b-8f8b5b5b5b5b", // Fallback ID
      "Abigail_standing_office_front_2024112501"
    ];
  }

  /**
   * Создает Photo Avatar из пользовательского фото
   * Использует Avatar IV API с загруженным изображением
   * 
   * @see https://docs.heygen.com/reference/create-avatar-iv-video
   * @endpoint POST /v2/video/av4/generate
   * @param photoUrl - URL фото пользователя
   * @param callbackId - ID для webhook callback
   * @returns Promise с avatar_id (временный ID для отслеживания)
   * @throws Error если создание не удалось
   */
  async createPhotoAvatar(photoUrl: string, callbackId: string): Promise<string> {
    const requestId = `photo_avatar_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      this.logger.log(`📸 [HEYGEN_PHOTO_AVATAR] Starting Photo Avatar creation via Avatar IV API`, {
        requestId,
        callbackId,
        photoUrl: photoUrl.substring(0, 100) + '...',
        webhookUrl: `${process.env.WEBHOOK_URL}/heygen/webhook`,
        timestamp: new Date().toISOString()
      });
      
      // Сначала загружаем изображение как asset
      const uploadResponse = await this.uploadAsset(photoUrl, 'image');
      
      this.logger.log(`📤 [HEYGEN_PHOTO_AVATAR] Image uploaded successfully`, {
        requestId,
        callbackId,
        assetKey: uploadResponse.asset_key,
        timestamp: new Date().toISOString()
      });

      // Возвращаем asset_key как временный avatar_id
      // В реальной реализации это будет использоваться для создания Avatar IV видео
      return uploadResponse.asset_key;
      
    } catch (error) {
      this.logger.error(`❌ [HEYGEN_PHOTO_AVATAR] Error creating Photo Avatar`, {
        requestId,
        callbackId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        photoUrl: photoUrl.substring(0, 100) + '...',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Загружает файл как asset в HeyGen
   * 
   * @see https://docs.heygen.com/reference/upload-asset
   * @endpoint POST /v1/upload
   * @param fileUrl - URL файла для загрузки
   * @param fileType - Тип файла ('image' или 'audio')
   * @returns Promise с asset_key
   * @throws Error если загрузка не удалась
   */
  private async uploadAsset(fileUrl: string, fileType: 'image' | 'audio'): Promise<{ asset_key: string }> {
    const requestId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      this.logger.log(`📤 [HEYGEN_UPLOAD] Starting asset upload`, {
        requestId,
        fileUrl: fileUrl.substring(0, 100) + '...',
        fileType,
        endpoint: `${HEYGEN_API.uploadUrl}/v1/asset`,
        timestamp: new Date().toISOString()
      });

      // Сначала скачиваем файл по URL
      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        throw new Error(`Failed to download file: ${fileResponse.status} ${fileResponse.statusText}`);
      }

      const fileBuffer = await fileResponse.arrayBuffer();
      const buffer = Buffer.from(fileBuffer);

      this.logger.log(`📥 [HEYGEN_UPLOAD] File downloaded successfully`, {
        requestId,
        fileSize: buffer.length,
        fileType,
        timestamp: new Date().toISOString()
      });

      // Используем FormData для загрузки файла
      const FormData = require('form-data');
      const formData = new FormData();
      
      // Добавляем файл с правильными параметрами согласно документации HeyGen
      formData.append('file', buffer, {
        filename: fileType === 'image' ? 'user_photo.jpg' : 'user_audio.wav',
        contentType: fileType === 'image' ? 'image/jpeg' : 'audio/wav',
        knownLength: buffer.length
      });

      // Добавляем дополнительные параметры если нужно
      formData.append('type', fileType);

      this.logger.log(`📤 [HEYGEN_UPLOAD] FormData prepared for HeyGen API`, {
        requestId,
        fileSize: buffer.length,
        formDataFields: formData.getHeaders(),
        timestamp: new Date().toISOString()
      });

      // Логируем детали FormData для отладки
      this.logger.debug(`[${requestId}] FormData details:`, {
        hasFile: formData.has('file'),
        hasType: formData.has('type'),
        contentType: formData.getHeaders()['content-type'],
        contentLength: formData.getHeaders()['content-length']
      });

      let response;
      try {
        response = await axios.post(`${HEYGEN_API.uploadUrl}/v1/asset`, formData, {
          headers: {
            'X-Api-Key': this.apiKey, // Правильный заголовок для HeyGen
            ...formData.getHeaders()
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          timeout: 30000 // 30 секунд таймаут
        });

        this.logger.log(`📥 [HEYGEN_UPLOAD] Received response from HeyGen API`, {
          requestId,
          status: response.status,
          statusText: response.statusText,
          timestamp: new Date().toISOString()
        });

        const data = response.data as any;
        
        this.logger.log(`✅ [HEYGEN_UPLOAD] Asset uploaded successfully`, {
          requestId,
          responseData: data,
          timestamp: new Date().toISOString()
        });

        // Ищем asset_key в разных возможных местах ответа
        const assetKey = data.data?.asset_key || data.asset_key || data.data?.asset_id || data.asset_id;
        
        if (!assetKey) {
          this.logger.error(`❌ [HEYGEN_UPLOAD] No asset_key found in response`, {
            requestId,
            responseData: data,
            timestamp: new Date().toISOString()
          });
          throw new Error('No asset_key in response');
        }

        this.logger.log(`✅ [HEYGEN_UPLOAD] Asset key extracted: ${assetKey}`, {
          requestId,
          assetKey,
          timestamp: new Date().toISOString()
        });

        return { asset_key: assetKey };
      } catch (axiosError) {
        if (axiosError.response) {
          // Сервер ответил с кодом ошибки
          const errorBody = axiosError.response.data;
          this.logger.error(`❌ [HEYGEN_UPLOAD] Upload failed`, {
            requestId,
            status: axiosError.response.status,
            statusText: axiosError.response.statusText,
            errorBody,
            timestamp: new Date().toISOString()
          });
          throw new Error(`Asset upload failed: ${axiosError.response.status} - ${JSON.stringify(errorBody)}`);
        } else {
          // Ошибка сети или другая ошибка
          this.logger.error(`❌ [HEYGEN_UPLOAD] Network error`, {
            requestId,
            error: axiosError.message,
            timestamp: new Date().toISOString()
          });
          throw new Error(`Asset upload network error: ${axiosError.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`❌ [HEYGEN_UPLOAD] Error uploading asset`, {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        fileUrl: fileUrl.substring(0, 100) + '...',
        fileType,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Создает клон голоса из пользовательского аудио
   * 
   * @see https://docs.heygen.com/reference/create-voice-cloning
   * @endpoint POST /v1/voice_cloning.create
   * @param audioUrl - URL аудио пользователя
   * @param callbackId - ID для webhook callback
   * @returns Promise с voice_id
   * @throws Error если клонирование не удалось
   */
  async createVoiceClone(audioUrl: string, callbackId: string): Promise<string> {
    const requestId = `voice_clone_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      this.logger.log(`[${requestId}] 🎵 Creating Voice Clone from: ${audioUrl}`);
      
      const payload: VoiceCloningRequest = {
        name: `voice_${callbackId}`,
        audio_url: audioUrl,
        callback_url: `${process.env.WEBHOOK_URL}/heygen/webhook`,
        callback_id: callbackId
      };

      this.logger.debug(`[${requestId}] 📤 Voice Cloning payload:`, payload);

      const response = await fetch(`${this.baseUrl}/v1/voice_cloning.create`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      this.logger.log(`[${requestId}] 📥 Voice Cloning response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`[${requestId}] ❌ Voice Cloning failed: ${response.status} - ${errorText}`);
        throw new Error(`Voice Cloning failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json() as any;
      const voiceId = result.data?.voice_id || result.voice_id;
      
      if (!voiceId) {
        this.logger.error(`[${requestId}] ❌ No voice_id in response:`, result);
        throw new Error('No voice_id returned from Voice Cloning API');
      }
      
      this.logger.log(`[${requestId}] ✅ Voice Clone created successfully: ${voiceId}`);
      return voiceId;
      
    } catch (error) {
      this.logger.error(`[${requestId}] ❌ Error creating Voice Clone:`, error);
      throw error;
    }
  }

  /**
   * Генерирует видео с цифровым двойником используя Avatar IV API
   * 
   * @see https://docs.heygen.com/reference/create-avatar-iv-video
   * @endpoint POST /v2/video/av4/generate
   * @param avatarId - ID созданного Photo Avatar
   * @param voiceId - ID созданного Voice Clone
   * @param script - Текст для озвучивания
   * @param videoTitle - Название видео
   * @param callbackId - ID для webhook callback
   * @returns Promise с video_id
   * @throws Error если генерация не удалась
   */
  async generateDigitalTwinVideo(
    avatarId: string,
    voiceId: string,
    script: string,
    videoTitle: string,
    callbackId: string
  ): Promise<string> {
    const requestId = `digital_twin_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      this.logger.log(`[${requestId}] 🎬 Generating Digital Twin Video`);
      this.logger.log(`[${requestId}] Avatar ID: ${avatarId}, Voice ID: ${voiceId}`);
      this.logger.log(`[${requestId}] Script length: ${script.length} chars`);
      
      const payload: AvatarIVPayload = {
        image_key: avatarId,
        video_title: videoTitle,
        script: script,
        voice_id: voiceId,
        video_orientation: "portrait",
        fit: "cover"
      };

      // Валидация payload
      if (!validateAvatarIVPayload(payload)) {
        this.logger.error(`[${requestId}] ❌ Invalid Avatar IV payload:`, payload);
        throw new Error('Invalid Avatar IV payload');
      }

      this.logger.debug(`[${requestId}] 📤 Avatar IV payload (validated):`, payload);

      const response = await fetch(`${this.baseUrl}${HEYGEN_API.endpoints.avatarIV}`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      this.logger.log(`[${requestId}] 📥 Avatar IV response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`[${requestId}] ❌ Avatar IV generation failed: ${response.status} - ${errorText}`);
        throw new Error(`Avatar IV generation failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json() as any;
      const videoId = result.data?.video_id || result.video_id;
      
      if (!videoId) {
        this.logger.error(`[${requestId}] ❌ No video_id in response:`, result);
        throw new Error('No video_id returned from Avatar IV API');
      }
      
      this.logger.log(`[${requestId}] ✅ Digital Twin Video generation started: ${videoId}`);
      return videoId;
      
    } catch (error) {
      this.logger.error(`[${requestId}] ❌ Error generating Digital Twin Video:`, error);
      throw error;
    }
  }

  /**
   * Настраивает webhook для HeyGen API
   * 
   * @see https://docs.heygen.com/reference/webhook-events
   * @endpoint POST /v1/webhook/endpoint.add
   */
  async setupWebhook(): Promise<void> {
    const webhookUrl = `${process.env.WEBHOOK_URL}/heygen/webhook`;
    
    try {
      this.logger.log(`🔗 Setting up HeyGen webhook: ${webhookUrl}`);
      
      const response = await fetch(`${this.baseUrl}/v1/webhook/endpoint.add`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: webhookUrl,
          events: [
            'photo_avatar.success',
            'photo_avatar.failed',
            'voice_clone.success',
            'voice_clone.failed',
            'video.success',
            'video.failed'
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`❌ Failed to setup webhook: ${response.status} - ${errorText}`);
        throw new Error(`Webhook setup failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      this.logger.log(`✅ HeyGen webhook setup successfully:`, result);
      
    } catch (error) {
      this.logger.error(`❌ Error setting up HeyGen webhook:`, error);
      throw error;
    }
  }
}
