import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

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
 * @endpoints
 *   - POST /v2/video/av4/generate (Avatar IV)
 *   - POST /v2/video/generate (Standard Avatar)
 *   - POST /v1/upload (Asset Upload)
 *   - GET /v1/avatar.list (List Avatars)
 *   - GET /v1/video_status.get (Video Status)
 * @lastUpdated 2025-09-06
 * @documentation https://docs.heygen.com/reference/create-avatar-iv-video
 */
const HEYGEN_API = {
  baseUrl: 'https://api.heygen.com',
  version: 'v2',
  endpoints: {
    avatarIV: '/v2/video/av4/generate',
    standardAvatar: '/v2/video/generate',
    uploadAsset: '/v1/upload',
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
                            !request.audioUrl.includes('avatar_iv_tts_required');

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
  async uploadAudio(audioBuffer: Buffer): Promise<string> {
    const uploadId = `heygen_audio_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      this.logger.log(`[${uploadId}] 🎵 Загружаем пользовательское аудио в HeyGen Assets (${audioBuffer.length} bytes)`);
      
      // Создаем FormData для загрузки аудио
      const formData = new FormData();
      formData.append('file', new Blob([audioBuffer], { type: 'audio/wav' }), 'user_audio.wav');
      
      const response = await fetch(`${this.baseUrl}${HEYGEN_API.endpoints.uploadAsset}`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
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

  async uploadImage(imageBuffer: Buffer): Promise<string> {
    const uploadId = `heygen_image_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      this.logger.log(`[${uploadId}] 🖼️ Пробуем создать TalkingPhoto из пользовательского фото (${imageBuffer.length} bytes)`);
      
      // Пробуем несколько подходов согласно документации HeyGen API 2025
      
      // Подход 1: Прямое создание TalkingPhoto (Photo Avatars API)
      try {
        const formData = new FormData();
        formData.append('image', new Blob([imageBuffer], { type: 'image/jpeg' }), 'user_photo.jpg');
        
        const response = await fetch(`${this.baseUrl}/v1/photo_avatar/generate`, {
          method: 'POST',
          headers: {
            'X-API-KEY': this.apiKey,
          },
          body: formData,
        });

        this.logger.log(`[${uploadId}] 📥 Photo Avatar API response: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const result = await response.json() as any;
          this.logger.log(`[${uploadId}] 📋 Photo Avatar response:`, result);
          const photoAvatarId = result.data?.photo_avatar_id || result.photo_avatar_id;
          
          if (photoAvatarId) {
            this.logger.log(`[${uploadId}] ✅ Photo Avatar created: ${photoAvatarId}`);
            return photoAvatarId;
          }
        } else {
          const errorText = await response.text();
          this.logger.warn(`[${uploadId}] Photo Avatar API failed: ${response.status} - ${errorText}`);
        }
      } catch (photoAvatarError) {
        this.logger.warn(`[${uploadId}] Photo Avatar approach failed:`, photoAvatarError);
      }

      // Подход 2: Upload Asset API согласно документации
      try {
        const formData = new FormData();
        formData.append('file', new Blob([imageBuffer], { type: 'image/jpeg' }), 'user_photo.jpg');
        
        // Пробуем правильный endpoint для Upload Asset
        const uploadResponse = await fetch(`${this.baseUrl}/v1/upload`, {
          method: 'POST',
          headers: {
            'X-API-KEY': this.apiKey,
          },
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json() as any;
          // Для Avatar IV нужен image_key
          const imageKey = uploadResult.data?.image_key || uploadResult.image_key;
          
          if (imageKey) {
            this.logger.log(`[${uploadId}] ✅ Image Key для Avatar IV: ${imageKey}`);
            return imageKey;
          }
          
          // Fallback: пробуем asset_id для стандартного API
          const assetId = uploadResult.data?.asset_id || uploadResult.asset_id;
          if (assetId) {
            this.logger.log(`[${uploadId}] ✅ Asset uploaded: ${assetId}`);
            return assetId;
          }
        } else {
          const errorText = await uploadResponse.text();
          this.logger.warn(`[${uploadId}] Upload Asset failed: ${uploadResponse.status} - ${errorText}`);
        }
      } catch (assetError) {
        this.logger.warn(`[${uploadId}] Asset upload approach failed:`, assetError);
      }

      // Подход 3: Fallback - используем доступный аватар
      this.logger.warn(`[${uploadId}] ⚠️ Все подходы загрузки фото не сработали, используем доступный аватар`);
      return "heygen_use_available_avatar";
      
    } catch (error) {
      this.logger.error(`[${uploadId}] ❌ Critical error in uploadImage:`, error);
      return "heygen_use_available_avatar";
    }
  }

  private async uploadImageFallback(imageBuffer: Buffer, uploadId: string): Promise<string> {
    try {
      this.logger.log(`[${uploadId}] 🔄 Fallback: trying direct image upload...`);
      
      const formData = new FormData();
      formData.append('image', new Blob([imageBuffer]), 'user_photo.jpg');
      
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
        return ["Abigail_expressive_2024112501", "Abigail_standing_office_front", "Abigail_sitting_sofa_front"];
      }

      const result = await response.json() as any;
      const avatars = result.data?.avatars || [];
      const avatarIds = avatars.map((avatar: any) => avatar.avatar_id).filter(Boolean);
      
      if (avatarIds.length === 0) {
        this.logger.warn('No avatars found, using hardcoded fallback');
        return ["Abigail_expressive_2024112501", "Abigail_standing_office_front", "Abigail_sitting_sofa_front"];
      }

      this.logger.log(`Found ${avatarIds.length} available avatars: ${avatarIds.slice(0, 3).join(', ')}...`);
      return avatarIds;
    } catch (error) {
      this.logger.error('Error getting available avatars:', error);
      return ["Abigail_expressive_2024112501", "Abigail_standing_office_front", "Abigail_sitting_sofa_front"];
    }
  }
}
