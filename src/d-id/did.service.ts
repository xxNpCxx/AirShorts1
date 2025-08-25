import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface VideoGenerationRequest {
  photoUrl: string;
  audioUrl: string;
  script: string;
  platform: 'youtube-shorts';
  duration: number;
  quality: '720p' | '1080p';
  textPrompt?: string;
}

export interface VideoGenerationResponse {
  id: string;
  status: string;
  result_url?: string;
  error?: string;
}

@Injectable()
export class DidService {
  private readonly logger = new Logger(DidService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.d-id.com';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('DID_API_KEY') || 'eHhucGN4eEBnbWFpbC5jb20:coOsJoP3VqEWDKyQ7FobG';
  }

  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    try {
      this.logger.log('Starting video generation with d-id API');
      
      const payload = {
        source_url: request.photoUrl,
        script: {
          type: 'text',
          input: request.script,
          provider: {
            type: 'microsoft',
            voice_id: 'en-US-JennyNeural'
          }
        },
        config: {
          fluent: true,
          pad_audio: 0.1,
          stitch: true,
          align_driver: true,
          align_expand_factor: 1,
          auto_match: true,
          normalization_factor: 1,
          motion_factor: 1,
          result_format: 'mp4',
          quality: request.quality === '1080p' ? 'full' : 'medium',
          output_resolution: request.quality === '1080p' ? '1080p' : '720p'
        },
        presenter_id: 'd-u-01H7YFp1q8uYbH9sgX2J9Z4',
        driver_id: 'd-u-01H7YFp1q8uYbH9sgX2J9Z4',
        background: {
          type: 'color',
          value: '#000000'
        }
      };

      const response = await fetch(`${this.baseUrl}/talks`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`d-id API error: ${response.status} - ${errorText}`);
        throw new Error(`d-id API error: ${response.status}`);
      }

      const result = await response.json() as any;
      this.logger.log(`Video generation started with ID: ${result.id}`);

      return {
        id: result.id,
        status: 'created',
      };
    } catch (error) {
      this.logger.error('Error generating video:', error);
      throw error;
    }
  }

  async getVideoStatus(videoId: string): Promise<VideoGenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/talks/${videoId}`, {
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get video status: ${response.status}`);
      }

      const result = await response.json() as any;
      
      return {
        id: result.id,
        status: result.status,
        result_url: result.result_url,
        error: result.error?.message,
      };
    } catch (error) {
      this.logger.error('Error getting video status:', error);
      throw error;
    }
  }

  async uploadAudio(audioBuffer: Buffer): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('audio', new Blob([audioBuffer]), 'audio.wav');

      const response = await fetch(`${this.baseUrl}/audios`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload audio: ${response.status}`);
      }

      const result = await response.json() as any;
      return result.audio_url;
    } catch (error) {
      this.logger.error('Error uploading audio:', error);
      throw error;
    }
  }

  async uploadImage(imageBuffer: Buffer): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', new Blob([imageBuffer]), 'image.jpg');

      const response = await fetch(`${this.baseUrl}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload image: ${response.status}`);
      }

      const result = await response.json() as any;
      return result.image_url;
    } catch (error) {
      this.logger.error('Error uploading image:', error);
      throw error;
    }
  }
}
