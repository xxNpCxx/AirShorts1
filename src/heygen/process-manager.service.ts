import { Injectable, Logger } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { getBotToken } from 'nestjs-telegraf';
import { Inject } from '@nestjs/common';
import { HeyGenService } from './heygen.service';
import { ElevenLabsService } from '../elevenlabs/elevenlabs.service';

/**
 * Статусы процесса создания цифрового двойника
 */
export type ProcessStatus =
  | 'photo_avatar_creating'
  | 'photo_avatar_completed'
  | 'photo_avatar_failed'
  | 'voice_cloning'
  | 'voice_clone_completed'
  | 'voice_clone_failed'
  | 'video_generating'
  | 'video_completed'
  | 'video_failed'
  | 'completed'
  | 'failed';

/**
 * Интерфейс процесса создания цифрового двойника
 */
export interface DigitalTwinProcess {
  id: string;
  userId: number;
  status: ProcessStatus;
  photoUrl: string;
  audioUrl: string;
  audioFileId?: string; // ID файла в Telegram для валидации
  script: string;
  videoTitle: string;
  platform: 'youtube-shorts';
  quality: '720p' | '1080p';
  photoAvatarId?: string;
  voiceCloneId?: string;
  videoId?: string;
  videoUrl?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  retryCount: number;
  maxRetries: number;
}

/**
 * Сервис управления процессами создания цифрового двойника
 * Обеспечивает последовательное выполнение: Photo Avatar → Voice Clone → Video Generation
 */
@Injectable()
export class ProcessManagerService {
  private readonly logger = new Logger(ProcessManagerService.name);
  private readonly processes = new Map<string, DigitalTwinProcess>();
  private readonly bot: Telegraf;

  constructor(
    private readonly heygenService: HeyGenService,
    private readonly elevenlabsService: ElevenLabsService
  ) {
    this.bot = new Telegraf(process.env.BOT_TOKEN || '');
  }

  /**
   * Создает новый процесс создания цифрового двойника
   */
  async createDigitalTwinProcess(
    userId: number,
    photoUrl: string,
    audioUrl: string,
    script: string,
    videoTitle: string,
    quality: '720p' | '1080p' = '720p',
    audioFileId?: string
  ): Promise<DigitalTwinProcess> {
    const processId = `dt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.logger.log(`🎬 [DIGITAL_TWIN_CREATE] Starting new process creation`, {
      processId,
      userId,
      photoUrl: `${photoUrl.substring(0, 100)}...`,
      audioUrl: `${audioUrl.substring(0, 100)}...`,
      scriptLength: script.length,
      videoTitle,
      quality,
      timestamp: new Date().toISOString(),
    });

    const process: DigitalTwinProcess = {
      id: processId,
      userId,
      status: 'photo_avatar_creating',
      photoUrl,
      audioUrl,
      audioFileId,
      script,
      videoTitle,
      platform: 'youtube-shorts',
      quality,
      createdAt: new Date(),
      updatedAt: new Date(),
      retryCount: 0,
      maxRetries: 3,
    };

    this.processes.set(processId, process);

    this.logger.log(`✅ [DIGITAL_TWIN_CREATE] Process created successfully`, {
      processId,
      userId,
      status: process.status,
      totalProcesses: this.processes.size,
      timestamp: new Date().toISOString(),
    });

    return process;
  }

  /**
   * Получает процесс по ID
   */
  async getProcess(processId: string): Promise<DigitalTwinProcess | undefined> {
    return this.processes.get(processId);
  }

  /**
   * Обновляет статус процесса
   */
  async updateProcessStatus(
    processId: string,
    status: ProcessStatus,
    data?: Partial<
      Pick<
        DigitalTwinProcess,
        'photoAvatarId' | 'voiceCloneId' | 'videoId' | 'videoUrl' | 'error' | 'retryCount'
      >
    >
  ): Promise<void> {
    const process = this.processes.get(processId);
    if (!process) {
      this.logger.error(`❌ [PROCESS_UPDATE] Process not found: ${processId}`);
      return;
    }

    const oldStatus = process.status;
    process.status = status;
    process.updatedAt = new Date();

    if (data) {
      if (data.photoAvatarId) process.photoAvatarId = data.photoAvatarId;
      if (data.voiceCloneId) process.voiceCloneId = data.voiceCloneId;
      if (data.videoId) process.videoId = data.videoId;
      if (data.videoUrl) process.videoUrl = data.videoUrl;
      if (data.error) process.error = data.error;
      if (data.retryCount !== undefined) process.retryCount = data.retryCount;
    }

    this.processes.set(processId, process);

    this.logger.log(`📊 [PROCESS_UPDATE] Status changed`, {
      processId,
      userId: process.userId,
      oldStatus,
      newStatus: status,
      updatedFields: data ? Object.keys(data) : [],
      photoAvatarId: process.photoAvatarId,
      voiceCloneId: process.voiceCloneId,
      videoId: process.videoId,
      error: process.error,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Получает следующий шаг для выполнения
   */
  getNextStep(
    process: DigitalTwinProcess
  ): 'photo_avatar' | 'voice_clone' | 'video' | 'completed' | null {
    switch (process.status) {
      case 'photo_avatar_creating':
        return 'photo_avatar';
      case 'photo_avatar_completed':
        return 'voice_clone';
      case 'voice_clone_completed':
        return 'video';
      case 'video_completed':
        return 'completed';
      default:
        return null;
    }
  }

  /**
   * Выполняет следующий шаг процесса
   */
  async executeNextStep(processId: string): Promise<void> {
    const process = this.processes.get(processId);
    if (!process) {
      this.logger.error(`Process not found: ${processId}`);
      return;
    }

    const nextStep = this.getNextStep(process);
    if (!nextStep) {
      this.logger.warn(`No next step for process ${processId} with status ${process.status}`);
      return;
    }

    this.logger.log(`🚀 [STEP_EXECUTION] Executing next step for process ${processId}`, {
      processId,
      userId: process.userId,
      currentStatus: process.status,
      nextStep,
      timestamp: new Date().toISOString(),
    });

    try {
      switch (nextStep) {
        case 'photo_avatar':
          await this.startPhotoAvatarCreation(process);
          break;
        case 'voice_clone':
          await this.startVoiceCloning(process);
          break;
        case 'video':
          await this.startVideoGeneration(process);
          break;
        case 'completed':
          await this.completeProcess(process);
          break;
      }
    } catch (error) {
      this.logger.error(`❌ [STEP_EXECUTION] Error executing step ${nextStep}`, {
        processId,
        userId: process.userId,
        step: nextStep,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Запускает создание Photo Avatar
   */
  private async startPhotoAvatarCreation(process: DigitalTwinProcess): Promise<void> {
    try {
      this.logger.log(`📸 [PHOTO_AVATAR_START] Starting Photo Avatar creation`, {
        processId: process.id,
        userId: process.userId,
        photoUrl: `${process.photoUrl.substring(0, 100)}...`,
        callbackId: process.id,
        timestamp: new Date().toISOString(),
      });

      // Вызываем HeyGen Service для создания Photo Avatar
      const avatarId = await this.heygenService.createPhotoAvatar(process.photoUrl, process.id);

      this.logger.log(`📸 [PHOTO_AVATAR_START] HeyGen API call successful`, {
        processId: process.id,
        userId: process.userId,
        avatarId,
        timestamp: new Date().toISOString(),
      });

      // Обновляем статус на completed, так как аватар уже готов (это asset)
      await this.updateProcessStatus(process.id, 'photo_avatar_completed', {
        photoAvatarId: avatarId,
      });

      this.logger.log(`✅ [PHOTO_AVATAR_START] Photo Avatar ready, proceeding to next step`, {
        processId: process.id,
        userId: process.userId,
        avatarId,
        status: 'photo_avatar_completed',
        timestamp: new Date().toISOString(),
      });

      // Запускаем следующий шаг (Voice Cloning)
      await this.executeNextStep(process.id);
    } catch (error) {
      this.logger.error(`❌ [PHOTO_AVATAR_START] Error creating Photo Avatar`, {
        processId: process.id,
        userId: process.userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        photoUrl: `${process.photoUrl.substring(0, 100)}...`,
        timestamp: new Date().toISOString(),
      });

      await this.updateProcessStatus(process.id, 'photo_avatar_failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      await this.notifyUserError(process, 'Ошибка создания аватара из фото');

      // Останавливаем процесс после ошибки
      return;
    }
  }

  /**
   * Запускает клонирование голоса через ElevenLabs
   */
  private async startVoiceCloning(process: DigitalTwinProcess): Promise<void> {
    const requestId = `voice_clone_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    this.logger.log(`🎵 [VOICE_CLONE_START] Starting Voice Cloning via ElevenLabs`, {
      requestId,
      processId: process.id,
      userId: process.userId,
      audioUrl: `${process.audioUrl.substring(0, 100)}...`,
      audioFileId: process.audioFileId,
      callbackId: process.id,
      retryCount: process.retryCount,
      maxRetries: process.maxRetries,
      timestamp: new Date().toISOString(),
    });

    // Проверяем лимит повторных попыток
    if (process.retryCount >= process.maxRetries) {
      this.logger.error(`[${requestId}] ❌ [VOICE_CLONE_START] Max retries exceeded`);
      this.updateProcessStatus(process.id, 'voice_clone_failed', {
        error: `Превышено максимальное количество попыток (${process.maxRetries})`,
      });

      // Уведомляем пользователя
      await this.notifyUser(
        process.userId,
        `❌ Не удалось клонировать голос после ${process.maxRetries} попыток. Попробуйте позже.`
      );
      return;
    }

    // Увеличиваем счетчик попыток
    this.updateProcessStatus(process.id, 'voice_cloning', {
      retryCount: process.retryCount + 1,
    });

    try {
      this.logger.log(`[${requestId}] 🎵 [VOICE_CLONE_START] Calling ElevenLabs Service`, {
        requestId,
        processId: process.id,
        userId: process.userId,
        audioUrl: `${process.audioUrl.substring(0, 100)}...`,
        audioFileId: process.audioFileId,
        callbackId: process.id,
        timestamp: new Date().toISOString(),
      });

      // Скачиваем аудио файл
      const audioResponse = await fetch(process.audioUrl);
      if (!audioResponse.ok) {
        throw new Error(`Failed to download audio: ${audioResponse.status}`);
      }

      const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
      const contentType = audioResponse.headers.get('content-type') || 'application/octet-stream';

      this.logger.log(
        `[${requestId}] 📥 [VOICE_CLONE_START] Audio downloaded: ${audioBuffer.length} bytes`,
        {
          requestId,
          audioSize: audioBuffer.length,
          contentType,
          timestamp: new Date().toISOString(),
        }
      );

      // Клонируем голос через ElevenLabs
      const voiceResult = await this.elevenlabsService.cloneVoiceAsync({
        name: `voice_${process.id}`,
        audioBuffer,
        description: `Клонированный голос для процесса ${process.id}`,
        contentType,
      });

      this.logger.log(`[${requestId}] ✅ [VOICE_CLONE_START] Voice cloned successfully`, {
        requestId,
        processId: process.id,
        userId: process.userId,
        voiceId: voiceResult.voice_id,
        voiceName: voiceResult.name,
        status: voiceResult.status,
        timestamp: new Date().toISOString(),
      });

      // Обновляем статус процесса
      this.updateProcessStatus(process.id, 'voice_clone_completed', {
        voiceCloneId: voiceResult.voice_id,
      });

      // Переходим к следующему шагу
      this.logger.log(`[${requestId}] 🚀 [VOICE_CLONE_START] Proceeding to next step`);
      await this.executeNextStep(process.id);
    } catch (error) {
      this.logger.error(`[${requestId}] ❌ [VOICE_CLONE_START] Error creating Voice Clone`, {
        requestId,
        processId: process.id,
        userId: process.userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        audioUrl: `${process.audioUrl.substring(0, 100)}...`,
        audioFileId: process.audioFileId,
        retryCount: process.retryCount,
        maxRetries: process.maxRetries,
        timestamp: new Date().toISOString(),
      });

      // Если еще есть попытки, планируем повтор
      if (process.retryCount < process.maxRetries) {
        this.logger.log(`[${requestId}] 🔄 [VOICE_CLONE_START] Scheduling retry`);
        this.logger.log({
          requestId,
          processId: process.id,
          userId: process.userId,
          retryCount: process.retryCount + 1,
          maxRetries: process.maxRetries,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        });

        // Планируем повтор через 5 секунд
        setTimeout(() => {
          this.executeNextStep(process.id);
        }, 5000);
      } else {
        // Превышено максимальное количество попыток
        this.updateProcessStatus(process.id, 'voice_clone_failed', {
          error: error instanceof Error ? error.message : String(error),
        });

        // Уведомляем пользователя
        await this.notifyUser(
          process.userId,
          `❌ Не удалось клонировать голос: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  /**
   * Запускает генерацию видео
   */
  private async startVideoGeneration(process: DigitalTwinProcess): Promise<void> {
    try {
      this.logger.log(`🎬 [VIDEO_GENERATION_START] Starting Video Generation`, {
        processId: process.id,
        userId: process.userId,
        photoAvatarId: process.photoAvatarId,
        voiceCloneId: process.voiceCloneId,
        scriptLength: process.script.length,
        videoTitle: process.videoTitle,
        quality: process.quality,
        callbackId: process.id,
        timestamp: new Date().toISOString(),
      });

      // Вызываем HeyGen Service для генерации видео с ElevenLabs сервисом
      const videoId = await this.heygenService.generateDigitalTwinVideo(
        process.photoAvatarId!,
        process.voiceCloneId!,
        process.script,
        process.videoTitle,
        process.id,
        this.elevenlabsService // Передаем ElevenLabs сервис
      );

      this.logger.log(`🎬 [VIDEO_GENERATION_START] HeyGen API call successful`, {
        processId: process.id,
        userId: process.userId,
        videoId,
        timestamp: new Date().toISOString(),
      });

      await this.updateProcessStatus(process.id, 'video_generating', { videoId });

      this.logger.log(`✅ [VIDEO_GENERATION_START] Video Generation initiated successfully`, {
        processId: process.id,
        userId: process.userId,
        videoId,
        status: 'video_generating',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`❌ [VIDEO_GENERATION_START] Error generating video`, {
        processId: process.id,
        userId: process.userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        photoAvatarId: process.photoAvatarId,
        voiceCloneId: process.voiceCloneId,
        scriptLength: process.script.length,
        timestamp: new Date().toISOString(),
      });

      await this.updateProcessStatus(process.id, 'video_failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      await this.notifyUserError(process, 'Ошибка создания видео');

      // Останавливаем процесс после ошибки
      return;
    }
  }

  /**
   * Завершает процесс
   */
  private async completeProcess(process: DigitalTwinProcess): Promise<void> {
    this.logger.log(`✅ Process ${process.id} completed successfully`);
    await this.updateProcessStatus(process.id, 'completed');
    await this.sendVideoToUser(process);
  }

  /**
   * Отправляет видео пользователю
   */
  private async sendVideoToUser(process: DigitalTwinProcess): Promise<void> {
    try {
      if (!process.videoUrl) {
        throw new Error('Video URL not available');
      }

      await this.bot.telegram.sendVideo(process.userId, process.videoUrl, {
        caption:
          `🎬 Ваше видео с цифровым двойником готово!\n\n` +
          `📝 Сценарий: ${process.script.substring(0, 100)}...\n` +
          `🎥 Качество: ${process.quality}\n` +
          `⏱️ Длительность: ~${this.calculateVideoDuration(process.script)} сек`,
      });

      this.logger.log(`📤 Video sent to user ${process.userId} for process ${process.id}`);
    } catch (error) {
      this.logger.error(`Error sending video to user ${process.userId}:`, error);
      await this.notifyUserError(process, 'Ошибка отправки видео');
    }
  }

  /**
   * Уведомляет пользователя об ошибке
   */
  private async notifyUserError(process: DigitalTwinProcess, errorMessage: string): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(
        process.userId,
        `❌ ${errorMessage}\n\n` +
          `🔄 Попробуйте еще раз или обратитесь в поддержку.\n` +
          `📋 ID процесса: ${process.id}`
      );

      this.logger.log(`📤 Error notification sent to user ${process.userId}: ${errorMessage}`);
    } catch (error) {
      this.logger.error(`Error notifying user ${process.userId}:`, error);
    }
  }

  /**
   * Уведомляет пользователя
   */
  private async notifyUser(userId: number, message: string): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(userId, message);
      this.logger.log(`📤 Notification sent to user ${userId}: ${message}`);
    } catch (error) {
      this.logger.error(`Error notifying user ${userId}:`, error);
    }
  }

  /**
   * Рассчитывает длительность видео на основе текста
   */
  private calculateVideoDuration(text: string): number {
    if (!text || text.trim().length === 0) {
      return 30;
    }

    const wordCount = text.trim().split(/\s+/).length;
    const wordsPerSecond = 2.5; // Средняя скорость речи для русского языка
    let duration = Math.ceil(wordCount / wordsPerSecond);
    duration = Math.ceil(duration * 1.25); // Буфер для пауз и интонации
    duration = Math.max(15, Math.min(60, duration));

    return duration;
  }

  /**
   * Получает все активные процессы
   */
  getActiveProcesses(): DigitalTwinProcess[] {
    return Array.from(this.processes.values()).filter(
      process => !['completed', 'failed'].includes(process.status)
    );
  }

  /**
   * Получает процесс по callback ID (для webhook)
   */
  getProcessByCallbackId(callbackId: string): DigitalTwinProcess | undefined {
    return this.processes.get(callbackId);
  }
}
