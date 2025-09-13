import { Logger } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Утилита для конвертации аудио файлов
 */
export class AudioConverter {
  private static readonly logger = new Logger(AudioConverter.name);

  /**
   * Конвертирует OGA/OGG файл в MP3
   */
  static async convertOgaToMp3(audioBuffer: Buffer, originalFileName?: string): Promise<Buffer> {
    const requestId = `audio_convert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    try {
      this.logger.log(`[${requestId}] 🔄 Начинаю конвертацию OGA в MP3...`);
      this.logger.debug(`[${requestId}] Размер входного файла: ${audioBuffer.length} байт`);

      // Создаем временные файлы
      const tempDir = tmpdir();
      const inputFile = join(tempDir, `input_${requestId}.oga`);
      const outputFile = join(tempDir, `output_${requestId}.mp3`);

      try {
        // Записываем входной файл
        await writeFile(inputFile, audioBuffer);
        this.logger.debug(`[${requestId}] Временный файл создан: ${inputFile}`);

        // Конвертируем с помощью ffmpeg
        await this.convertWithFfmpeg(inputFile, outputFile, requestId);

        // Читаем результат
        const resultBuffer = await import('fs').then(fs => fs.promises.readFile(outputFile));

        this.logger.log(`[${requestId}] ✅ Конвертация завершена успешно`);
        this.logger.debug(`[${requestId}] Размер выходного файла: ${resultBuffer.length} байт`);

        return resultBuffer;
      } finally {
        // Удаляем временные файлы
        try {
          await unlink(inputFile).catch(() => {
            this.logger.debug(`[${requestId}] Входной файл уже удален: ${inputFile}`);
          });
          await unlink(outputFile).catch(() => {
            this.logger.debug(`[${requestId}] Выходной файл уже удален: ${outputFile}`);
          });
          this.logger.debug(`[${requestId}] Очистка временных файлов завершена`);
        } catch (cleanupError) {
          this.logger.warn(`[${requestId}] ⚠️ Ошибка при очистке временных файлов:`, cleanupError);
        }
      }
    } catch (error) {
      this.logger.error(`[${requestId}] ❌ Ошибка конвертации аудио:`, error);
      throw new Error(
        `Failed to convert audio: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Конвертирует аудио с помощью ffmpeg
   */
  private static async convertWithFfmpeg(
    inputFile: string,
    outputFile: string,
    requestId: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputFile)
        .toFormat('mp3')
        .audioCodec('libmp3lame')
        .audioBitrate(128)
        .audioChannels(1)
        .audioFrequency(22050)
        .on('start', commandLine => {
          this.logger.debug(`[${requestId}] FFmpeg команда: ${commandLine}`);
        })
        .on('progress', progress => {
          this.logger.debug(`[${requestId}] Прогресс: ${progress.percent}%`);
        })
        .on('end', () => {
          this.logger.debug(`[${requestId}] FFmpeg завершен успешно`);
          resolve();
        })
        .on('error', error => {
          this.logger.error(`[${requestId}] FFmpeg ошибка:`, error);
          reject(error);
        })
        .save(outputFile);
    });
  }

  /**
   * Проверяет, нужно ли конвертировать файл
   */
  static needsConversion(fileName: string, mimeType?: string): boolean {
    const ogaExtensions = ['.oga', '.ogg'];
    const ogaMimeTypes = ['audio/ogg', 'audio/oga'];

    const hasOgaExtension = ogaExtensions.some(ext => fileName.toLowerCase().endsWith(ext));

    const hasOgaMimeType = mimeType && ogaMimeTypes.includes(mimeType);

    return hasOgaExtension || hasOgaMimeType;
  }

  /**
   * Получает MIME тип для MP3
   */
  static getMp3MimeType(): string {
    return 'audio/mpeg';
  }

  /**
   * Получает расширение для MP3
   */
  static getMp3Extension(): string {
    return '.mp3';
  }
}
