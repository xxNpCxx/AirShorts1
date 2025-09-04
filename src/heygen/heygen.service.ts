import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

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

@Injectable()
export class HeyGenService {
  private readonly logger = new Logger(HeyGenService.name);
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.heygen.com";

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>("HEYGEN_API_KEY") || "";
    if (!this.apiKey) {
      this.logger.warn("HEYGEN_API_KEY не найден в переменных окружения");
    }
  }

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
                            request.audioUrl !== "null";

      // Получаем список доступных аватаров для дефолтного значения
      const availableAvatars = await this.getAvailableAvatars();
      const defaultAvatarId = availableAvatars[0] || "1bd001e7-c335-4a6a-9d1b-8f8b5b5b5b5b";

      // HeyGen API v2 структура согласно документации
      let payload: any = {
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

      // Если есть пользовательское фото, используем TalkingPhoto вместо обычного аватара
      if (request.imageUrl && request.imageUrl.trim() !== "" && request.imageUrl !== "undefined" && request.imageUrl !== "null" && request.imageUrl !== "heygen_placeholder_image_url" && request.imageUrl !== "heygen_use_available_avatar") {
        this.logger.log(`[${requestId}] 📸 Используем TalkingPhoto с пользовательским фото: ${request.imageUrl}`);
        payload.video_inputs[0].character = {
          type: "talking_photo",
          talking_photo_id: request.imageUrl, // ID загруженного фото
          talking_photo_style: "square",
          talking_style: "expressive",
          expression: "default",
          super_resolution: true,
          scale: 1.0
        };
      }

      // Если есть пользовательское аудио, используем AudioVoiceSettings с asset_id
      if (useCustomAudio && request.audioUrl) {
        this.logger.log(`[${requestId}] 🎵 Используем пользовательское аудио asset: ${request.audioUrl}`);
        payload.video_inputs[0].voice = {
          type: "audio",
          audio_asset_id: request.audioUrl // Теперь это asset_id, а не URL
        };
      }

      // Если нет пользовательского фото, используем доступный аватар
      if (!request.imageUrl || request.imageUrl === "heygen_use_available_avatar" || request.imageUrl === "heygen_placeholder_image_url") {
        this.logger.log(`[${requestId}] 📸 Using available avatar: ${defaultAvatarId}`);
        // defaultAvatarId уже установлен в payload выше
      }

      // Если используется пользовательское аудио, но не было обработано выше
      if (useCustomAudio && payload.video_inputs[0].voice.type === "text") {
        this.logger.warn(`[${requestId}] Пользовательское аудио не было обработано, используем TTS`);
        // Используем TTS с текстом вместо аудио
        payload.video_inputs[0].voice.input_text = request.script;
        payload.video_inputs[0].voice.voice_id = "119caed25533477ba63822d5d1552d25";
        this.logger.log(`[${requestId}] 🎵 Fallback to TTS with script: ${request.script?.substring(0, 50)}...`);
      }

      if (useCustomAudio) {
        this.logger.log(`[${requestId}] 🎵 Using custom user audio from: ${request.audioUrl}`);
      } else {
        this.logger.log(`[${requestId}] 🎵 Using TTS with script: ${request.script?.substring(0, 50)}...`);
      }

      this.logger.debug(`[${requestId}] 📤 Sending request to ${this.baseUrl}/v2/video/generate`);

      const response = await fetch(`${this.baseUrl}/v2/video/generate`, {
        method: "POST",
        headers: {
          "X-API-KEY": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      this.logger.debug(`[${requestId}] 📥 HeyGen API response: ${response.status} ${response.statusText}`);

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
      this.logger.debug(`[${requestId}] Full HeyGen response:`, result);

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

  async uploadAudio(audioBuffer: Buffer): Promise<string> {
    const uploadId = `heygen_audio_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      this.logger.log(`[${uploadId}] 🎵 Загружаем пользовательское аудио в HeyGen Assets (${audioBuffer.length} bytes)`);
      
      // Создаем FormData для загрузки аудио
      const formData = new FormData();
      formData.append('file', new Blob([audioBuffer], { type: 'audio/wav' }), 'user_audio.wav');
      formData.append('type', 'audio');
      
      const response = await fetch(`${this.baseUrl}/v1/asset`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
        },
        body: formData,
      });

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
        throw new Error('No asset_id returned from HeyGen API');
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
      this.logger.log(`[${uploadId}] 🖼️ Загружаем пользовательское фото в HeyGen Assets (${imageBuffer.length} bytes)`);
      
      // Сначала загружаем изображение как Asset
      const formData = new FormData();
      formData.append('file', new Blob([imageBuffer], { type: 'image/jpeg' }), 'user_photo.jpg');
      formData.append('type', 'image');
      
      const uploadResponse = await fetch(`${this.baseUrl}/v1/asset`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        this.logger.error(`[${uploadId}] ❌ Image upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
        this.logger.error(`[${uploadId}] Error details: ${errorText}`);
        throw new Error(`Image upload failed: ${uploadResponse.status} - ${errorText}`);
      }

      const uploadResult = await uploadResponse.json() as any;
      const imageAssetId = uploadResult.data?.asset_id || uploadResult.asset_id;
      
      if (!imageAssetId) {
        this.logger.error(`[${uploadId}] ❌ No asset_id in upload response:`, uploadResult);
        throw new Error('No asset_id returned from image upload');
      }
      
      this.logger.log(`[${uploadId}] ✅ Image uploaded as asset: ${imageAssetId}`);
      
      // Теперь создаем TalkingPhoto из загруженного изображения
      const talkingPhotoPayload = {
        image_asset_id: imageAssetId,
        name: `talking_photo_${uploadId}`,
        crop_style: "square",
        talking_style: "expressive",
        expression: "default",
        super_resolution: true
      };
      
      const talkingPhotoResponse = await fetch(`${this.baseUrl}/v1/talking_photo/generate`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(talkingPhotoPayload),
      });

      if (!talkingPhotoResponse.ok) {
        const errorText = await talkingPhotoResponse.text();
        this.logger.error(`[${uploadId}] ❌ TalkingPhoto creation failed: ${talkingPhotoResponse.status} ${talkingPhotoResponse.statusText}`);
        this.logger.error(`[${uploadId}] Error details: ${errorText}`);
        throw new Error(`TalkingPhoto creation failed: ${talkingPhotoResponse.status} - ${errorText}`);
      }

      const talkingPhotoResult = await talkingPhotoResponse.json() as any;
      const talkingPhotoId = talkingPhotoResult.data?.talking_photo_id || talkingPhotoResult.talking_photo_id;
      
      if (!talkingPhotoId) {
        this.logger.error(`[${uploadId}] ❌ No talking_photo_id in response:`, talkingPhotoResult);
        throw new Error('No talking_photo_id returned from TalkingPhoto creation');
      }
      
      this.logger.log(`[${uploadId}] ✅ TalkingPhoto created successfully: ${talkingPhotoId}`);
      return talkingPhotoId;
      
    } catch (error) {
      this.logger.error(`[${uploadId}] ❌ Error creating TalkingPhoto:`, error);
      throw error;
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
