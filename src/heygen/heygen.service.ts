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
}

export interface HeyGenVideoResponse {
  id: string;
  status: string;
  result_url?: string;
  error?: string;
}

interface HeyGenApiResponse {
  code: number;
  data?: {
    video_id: string;
    status?: string;
    video_url?: string;
  };
  message?: string;
}

interface HeyGenStatusResponse {
  code: number;
  data?: {
    video_id: string;
    status: string;
    video_url?: string;
    error?: string;
  };
  message?: string;
}

@Injectable()
export class HeyGenService {
  private readonly logger = new Logger(HeyGenService.name);
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.heygen.com/v2";

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

      let payload: any = {
        video_inputs: [
          {
            character: {
              type: "avatar",
              avatar_id: "default", // Можно настроить позже
              avatar_style: "normal"
            },
            voice: useCustomAudio ? {
              type: "audio",
              audio_url: request.audioUrl
            } : {
              type: "text",
              input_text: request.script,
              voice_id: "ru-RU-SvetlanaNeural" // Русский голос
            },
            background: {
              type: "color",
              value: "#000000"
            }
          }
        ],
        dimension: {
          width: request.quality === "1080p" ? 1080 : 720,
          height: request.quality === "1080p" ? 1920 : 1280 // Вертикальное видео
        },
        aspect_ratio: "9:16"
      };

      if (useCustomAudio) {
        this.logger.log(`[${requestId}] 🎵 Using custom user audio from: ${request.audioUrl}`);
      } else {
        this.logger.log(`[${requestId}] 🎵 Using TTS with script: ${request.script?.substring(0, 50)}...`);
      }

      this.logger.debug(`[${requestId}] 📤 Sending request to ${this.baseUrl}/video/generate`);

      const response = await fetch(`${this.baseUrl}/video/generate`, {
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
          url: `${this.baseUrl}/video/generate`,
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
      
      const response = await fetch(`${this.baseUrl}/video/${videoId}`, {
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
          url: `${this.baseUrl}/video/${videoId}`,
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
        id: result.data?.video_id || videoId,
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
      this.logger.log(`[${uploadId}] 🎵 Starting audio upload to HeyGen (${audioBuffer.length} bytes)`);
      
      const formData = new FormData();
      formData.append("file", new Blob([audioBuffer]), "audio.wav");

      const response = await fetch(`${this.baseUrl}/assets/upload`, {
        method: "POST",
        headers: {
          "X-API-KEY": this.apiKey,
        },
        body: formData,
      });

      this.logger.debug(`[${uploadId}] 📥 Audio upload response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`[${uploadId}] ❌ Failed to upload audio to HeyGen:`, {
          status: response.status,
          statusText: response.statusText,
          url: `${this.baseUrl}/assets/upload`,
          audioSize: audioBuffer.length,
          errorBody: errorText
        });
        throw new Error(`Failed to upload audio: ${response.status} - ${errorText}`);
      }

      const result = await response.json() as any;
      this.logger.debug(`[${uploadId}] 📋 Full audio upload response:`, result);
      
      // HeyGen может возвращать разные поля для URL аудио
      const audioUrl = result.data?.url || result.url || result.audio_url;
      
      if (!audioUrl) {
        this.logger.error(`[${uploadId}] ❌ No audio URL in HeyGen response:`, result);
        throw new Error('No audio URL received from HeyGen API');
      }
      
      this.logger.log(`[${uploadId}] ✅ Audio uploaded to HeyGen successfully: ${audioUrl}`);
      
      return audioUrl;
    } catch (error) {
      this.logger.error(`[${uploadId}] 💥 Critical error uploading audio to HeyGen:`, {
        error: error instanceof Error ? error.message : String(error),
        audioSize: audioBuffer.length,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async uploadImage(imageBuffer: Buffer): Promise<string> {
    const uploadId = `heygen_image_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      this.logger.log(`[${uploadId}] 📸 Starting image upload to HeyGen (${imageBuffer.length} bytes)`);
      
      const formData = new FormData();
      formData.append("file", new Blob([imageBuffer]), "image.jpg");

      const response = await fetch(`${this.baseUrl}/assets/upload`, {
        method: "POST",
        headers: {
          "X-API-KEY": this.apiKey,
        },
        body: formData,
      });

      this.logger.debug(`[${uploadId}] 📥 Image upload response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`[${uploadId}] ❌ Failed to upload image to HeyGen:`, {
          status: response.status,
          statusText: response.statusText,
          url: `${this.baseUrl}/assets/upload`,
          imageSize: imageBuffer.length,
          errorBody: errorText
        });
        throw new Error(`Failed to upload image: ${response.status} - ${errorText}`);
      }

      const result = await response.json() as any;
      this.logger.debug(`[${uploadId}] 📋 Full image upload response:`, result);
      
      // HeyGen может возвращать разные поля для URL изображения
      const imageUrl = result.data?.url || result.url || result.image_url;
      
      if (!imageUrl) {
        this.logger.error(`[${uploadId}] ❌ No image URL in HeyGen response:`, result);
        throw new Error('No image URL received from HeyGen API');
      }
      
      this.logger.log(`[${uploadId}] ✅ Image uploaded to HeyGen successfully: ${imageUrl}`);
      
      return imageUrl;
    } catch (error) {
      this.logger.error(`[${uploadId}] 💥 Critical error uploading image to HeyGen:`, {
        error: error instanceof Error ? error.message : String(error),
        imageSize: imageBuffer.length,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}
