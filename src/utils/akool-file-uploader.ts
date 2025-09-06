import { Logger } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';

/**
 * Утилита для загрузки файлов в AKOOL
 */
export class AkoolFileUploader {
  private static readonly logger = new Logger(AkoolFileUploader.name);

  /**
   * Загружает изображение в AKOOL
   */
  static async uploadImage(
    imageBuffer: Buffer, 
    fileName: string, 
    accessToken: string,
    baseUrl: string
  ): Promise<string> {
    const requestId = `akool_image_upload_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      this.logger.log(`[${requestId}] 🖼️ Загружаю изображение в AKOOL...`);
      this.logger.debug(`[${requestId}] Размер файла: ${imageBuffer.length} байт, имя: ${fileName}`);

      const formData = new FormData();
      formData.append('file', imageBuffer, {
        filename: fileName,
        contentType: 'image/jpeg'
      });

      const response = await axios.post(
        `${baseUrl}/content/upload/image`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            ...formData.getHeaders(),
          },
          timeout: 30000, // 30 секунд таймаут
        }
      );

      this.logger.log(`[${requestId}] 📥 Ответ загрузки изображения:`, response.data);

      if (response.data.code === 1000 && response.data.data?.url) {
        const imageUrl = response.data.data.url;
        this.logger.log(`[${requestId}] ✅ Изображение загружено успешно: ${imageUrl}`);
        return imageUrl;
      } else {
        throw new Error(`AKOOL image upload failed: ${response.data.msg || 'Unknown error'}`);
      }

    } catch (error) {
      this.logger.error(`[${requestId}] ❌ Ошибка загрузки изображения:`, error);
      throw error;
    }
  }

  /**
   * Загружает аудио в AKOOL
   */
  static async uploadAudio(
    audioBuffer: Buffer, 
    fileName: string, 
    accessToken: string,
    baseUrl: string
  ): Promise<string> {
    const requestId = `akool_audio_upload_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      this.logger.log(`[${requestId}] 🎵 Загружаю аудио в AKOOL...`);
      this.logger.debug(`[${requestId}] Размер файла: ${audioBuffer.length} байт, имя: ${fileName}`);

      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: fileName,
        contentType: 'audio/mpeg'
      });

      const response = await axios.post(
        `${baseUrl}/content/upload/audio`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            ...formData.getHeaders(),
          },
          timeout: 30000, // 30 секунд таймаут
        }
      );

      this.logger.log(`[${requestId}] 📥 Ответ загрузки аудио:`, response.data);

      if (response.data.code === 1000 && response.data.data?.url) {
        const audioUrl = response.data.data.url;
        this.logger.log(`[${requestId}] ✅ Аудио загружено успешно: ${audioUrl}`);
        return audioUrl;
      } else {
        throw new Error(`AKOOL audio upload failed: ${response.data.msg || 'Unknown error'}`);
      }

    } catch (error) {
      this.logger.error(`[${requestId}] ❌ Ошибка загрузки аудио:`, error);
      throw error;
    }
  }

  /**
   * Проверяет, поддерживается ли формат файла AKOOL
   */
  static isSupportedImageFormat(fileName: string, mimeType?: string): boolean {
    const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const supportedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    const hasSupportedExtension = supportedExtensions.some(ext => 
      fileName.toLowerCase().endsWith(ext)
    );
    
    const hasSupportedMimeType = mimeType && supportedMimeTypes.includes(mimeType);
    
    return hasSupportedExtension || hasSupportedMimeType;
  }

  /**
   * Проверяет, поддерживается ли формат аудио AKOOL
   */
  static isSupportedAudioFormat(fileName: string, mimeType?: string): boolean {
    const supportedExtensions = ['.mp3', '.wav', '.m4a'];
    const supportedMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4'];
    
    const hasSupportedExtension = supportedExtensions.some(ext => 
      fileName.toLowerCase().endsWith(ext)
    );
    
    const hasSupportedMimeType = mimeType && supportedMimeTypes.includes(mimeType);
    
    return hasSupportedExtension || hasSupportedMimeType;
  }

  /**
   * Валидирует размер файла
   */
  static validateFileSize(fileBuffer: Buffer, maxSizeMB: number = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return fileBuffer.length <= maxSizeBytes;
  }

  /**
   * Получает информацию о файле для логирования
   */
  static getFileInfo(fileBuffer: Buffer, fileName: string): {
    size: number;
    sizeKB: number;
    sizeMB: number;
    fileName: string;
  } {
    return {
      size: fileBuffer.length,
      sizeKB: Math.round(fileBuffer.length / 1024),
      sizeMB: Math.round(fileBuffer.length / (1024 * 1024) * 100) / 100,
      fileName
    };
  }
}
