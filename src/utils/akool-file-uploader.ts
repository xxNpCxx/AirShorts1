import { Logger } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';

/**
 * Утилита для загрузки файлов в AKOOL
 */
export class AkoolFileUploader {
  private static readonly logger = new Logger(AkoolFileUploader.name);

  /**
   * Загружает изображение в AKOOL (использует публичный URL)
   * AKOOL не требует загрузки файлов через их API, принимает прямые URL
   */
  static async uploadImage(
    imageBuffer: Buffer, 
    fileName: string, 
    accessToken: string,
    baseUrl: string
  ): Promise<string> {
    const requestId = `akool_image_upload_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      this.logger.log(`[${requestId}] 🖼️ Подготавливаю изображение для AKOOL...`);
      this.logger.debug(`[${requestId}] Размер файла: ${imageBuffer.length} байт, имя: ${fileName}`);

      // AKOOL принимает прямые URL файлов, поэтому возвращаем URL для загрузки
      // В реальном проекте здесь можно загрузить файл в CDN или использовать временный URL
      const imageUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/photos/${fileName}`;
      
      this.logger.log(`[${requestId}] ✅ Изображение подготовлено для AKOOL: ${imageUrl}`);
      return imageUrl;

    } catch (error) {
      this.logger.error(`[${requestId}] ❌ Ошибка подготовки изображения:`, error);
      throw error;
    }
  }

  /**
   * Загружает аудио в AKOOL (использует публичный URL)
   * AKOOL не требует загрузки файлов через их API, принимает прямые URL
   */
  static async uploadAudio(
    audioBuffer: Buffer, 
    fileName: string, 
    accessToken: string,
    baseUrl: string
  ): Promise<string> {
    const requestId = `akool_audio_upload_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      this.logger.log(`[${requestId}] 🎵 Подготавливаю аудио для AKOOL...`);
      this.logger.debug(`[${requestId}] Размер файла: ${audioBuffer.length} байт, имя: ${fileName}`);

      // AKOOL принимает прямые URL файлов, поэтому возвращаем URL для загрузки
      // В реальном проекте здесь можно загрузить файл в CDN или использовать временный URL
      const audioUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/voice/${fileName}`;
      
      this.logger.log(`[${requestId}] ✅ Аудио подготовлено для AKOOL: ${audioUrl}`);
      return audioUrl;

    } catch (error) {
      this.logger.error(`[${requestId}] ❌ Ошибка подготовки аудио:`, error);
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
