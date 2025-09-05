import { Injectable, Logger } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { getBotToken } from 'nestjs-telegraf';
import { Inject } from '@nestjs/common';
import { HeyGenService } from './heygen.service';

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
  script: string;
  videoTitle: string;
  platform: "youtube-shorts";
  quality: "720p" | "1080p";
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

  constructor(
    @Inject(getBotToken("airshorts1_bot")) private readonly bot: Telegraf,
    private readonly heygenService: HeyGenService,
  ) {}

  /**
   * Создает новый процесс создания цифрового двойника
   */
  async createDigitalTwinProcess(
    userId: number,
    photoUrl: string,
    audioUrl: string,
    script: string,
    videoTitle: string,
    quality: "720p" | "1080p" = "720p"
  ): Promise<DigitalTwinProcess> {
    const processId = `dt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.logger.log(`🎬 [DIGITAL_TWIN_CREATE] Starting new process creation`, {
      processId,
      userId,
      photoUrl: photoUrl.substring(0, 100) + '...',
      audioUrl: audioUrl.substring(0, 100) + '...',
      scriptLength: script.length,
      videoTitle,
      quality,
      timestamp: new Date().toISOString()
    });
    
    const process: DigitalTwinProcess = {
      id: processId,
      userId,
      status: 'photo_avatar_creating',
      photoUrl,
      audioUrl,
      script,
      videoTitle,
      platform: "youtube-shorts",
      quality,
      createdAt: new Date(),
      updatedAt: new Date(),
      retryCount: 0,
      maxRetries: 3
    };
    
    this.processes.set(processId, process);
    
    this.logger.log(`✅ [DIGITAL_TWIN_CREATE] Process created successfully`, {
      processId,
      userId,
      status: process.status,
      totalProcesses: this.processes.size,
      timestamp: new Date().toISOString()
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
    data?: Partial<Pick<DigitalTwinProcess, 'photoAvatarId' | 'voiceCloneId' | 'videoId' | 'videoUrl' | 'error'>>
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
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Получает следующий шаг для выполнения
   */
  getNextStep(process: DigitalTwinProcess): 'photo_avatar' | 'voice_clone' | 'video' | 'completed' | null {
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

    this.logger.log(`🚀 Executing next step for process ${processId}: ${nextStep}`);

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
  }

  /**
   * Запускает создание Photo Avatar
   */
  private async startPhotoAvatarCreation(process: DigitalTwinProcess): Promise<void> {
    try {
      this.logger.log(`📸 [PHOTO_AVATAR_START] Starting Photo Avatar creation`, {
        processId: process.id,
        userId: process.userId,
        photoUrl: process.photoUrl.substring(0, 100) + '...',
        callbackId: process.id,
        timestamp: new Date().toISOString()
      });
      
      // Вызываем HeyGen Service для создания Photo Avatar
      const avatarId = await this.heygenService.createPhotoAvatar(process.photoUrl, process.id);
      
      this.logger.log(`📸 [PHOTO_AVATAR_START] HeyGen API call successful`, {
        processId: process.id,
        userId: process.userId,
        avatarId,
        timestamp: new Date().toISOString()
      });
      
      await this.updateProcessStatus(process.id, 'photo_avatar_creating', { photoAvatarId: avatarId });
      
      this.logger.log(`✅ [PHOTO_AVATAR_START] Photo Avatar creation initiated successfully`, {
        processId: process.id,
        userId: process.userId,
        avatarId,
        status: 'photo_avatar_creating',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error(`❌ [PHOTO_AVATAR_START] Error creating Photo Avatar`, {
        processId: process.id,
        userId: process.userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        photoUrl: process.photoUrl.substring(0, 100) + '...',
        timestamp: new Date().toISOString()
      });
      
      await this.updateProcessStatus(process.id, 'photo_avatar_failed', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      await this.notifyUserError(process, 'Ошибка создания аватара из фото');
    }
  }

  /**
   * Запускает клонирование голоса
   */
  private async startVoiceCloning(process: DigitalTwinProcess): Promise<void> {
    try {
      this.logger.log(`🎵 [VOICE_CLONE_START] Starting Voice Cloning`, {
        processId: process.id,
        userId: process.userId,
        audioUrl: process.audioUrl.substring(0, 100) + '...',
        callbackId: process.id,
        timestamp: new Date().toISOString()
      });
      
      // Вызываем HeyGen Service для клонирования голоса
      const voiceId = await this.heygenService.createVoiceClone(process.audioUrl, process.id);
      
      this.logger.log(`🎵 [VOICE_CLONE_START] HeyGen API call successful`, {
        processId: process.id,
        userId: process.userId,
        voiceId,
        timestamp: new Date().toISOString()
      });
      
      await this.updateProcessStatus(process.id, 'voice_cloning', { voiceCloneId: voiceId });
      
      this.logger.log(`✅ [VOICE_CLONE_START] Voice Cloning initiated successfully`, {
        processId: process.id,
        userId: process.userId,
        voiceId,
        status: 'voice_cloning',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error(`❌ [VOICE_CLONE_START] Error creating Voice Clone`, {
        processId: process.id,
        userId: process.userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        audioUrl: process.audioUrl.substring(0, 100) + '...',
        timestamp: new Date().toISOString()
      });
      
      await this.updateProcessStatus(process.id, 'voice_clone_failed', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      await this.notifyUserError(process, 'Ошибка клонирования голоса');
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
        timestamp: new Date().toISOString()
      });
      
      // Вызываем HeyGen Service для генерации видео
      const videoId = await this.heygenService.generateDigitalTwinVideo(
        process.photoAvatarId!,
        process.voiceCloneId!,
        process.script,
        process.videoTitle,
        process.id
      );
      
      this.logger.log(`🎬 [VIDEO_GENERATION_START] HeyGen API call successful`, {
        processId: process.id,
        userId: process.userId,
        videoId,
        timestamp: new Date().toISOString()
      });
      
      await this.updateProcessStatus(process.id, 'video_generating', { videoId });
      
      this.logger.log(`✅ [VIDEO_GENERATION_START] Video Generation initiated successfully`, {
        processId: process.id,
        userId: process.userId,
        videoId,
        status: 'video_generating',
        timestamp: new Date().toISOString()
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
        timestamp: new Date().toISOString()
      });
      
      await this.updateProcessStatus(process.id, 'video_failed', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      await this.notifyUserError(process, 'Ошибка создания видео');
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
        caption: `🎬 Ваше видео с цифровым двойником готово!\n\n` +
                `📝 Сценарий: ${process.script.substring(0, 100)}...\n` +
                `🎥 Качество: ${process.quality}\n` +
                `⏱️ Длительность: ~${this.calculateVideoDuration(process.script)} сек`
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
