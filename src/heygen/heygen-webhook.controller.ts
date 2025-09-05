import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { getBotToken } from 'nestjs-telegraf';
import { Inject } from '@nestjs/common';
import { ProcessManagerService } from './process-manager.service';

/**
 * HeyGen Webhook Payload Interface
 * @see https://docs.heygen.com/reference/webhook-events
 */
interface HeyGenWebhookPayload {
  event_type: string;
  event_data: {
    avatar_id?: string;
    voice_id?: string;
    video_id?: string;
    video_url?: string;
    error?: string;
    callback_id?: string;
  };
  timestamp: number;
}

/**
 * HeyGen Webhook Controller
 * Обрабатывает webhook события от HeyGen API
 * 
 * @see https://docs.heygen.com/reference/webhook-events
 * @endpoint POST /heygen/webhook
 */
@Controller('heygen/webhook')
export class HeyGenWebhookController {
  private readonly logger = new Logger(HeyGenWebhookController.name);

  constructor(
    @Inject(getBotToken("airshorts1_bot")) private readonly bot: Telegraf,
    private readonly processManager: ProcessManagerService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: HeyGenWebhookPayload) {
    const webhookId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      this.logger.log(`📨 [WEBHOOK_RECEIVED] HeyGen webhook received`, {
        webhookId,
        eventType: payload.event_type,
        callbackId: payload.event_data.callback_id,
        timestamp: payload.timestamp,
        fullPayload: payload,
        receivedAt: new Date().toISOString()
      });

      // Обрабатываем разные типы событий
      switch (payload.event_type) {
        case 'photo_avatar.success':
          await this.handlePhotoAvatarSuccess(payload, webhookId);
          break;
        case 'photo_avatar.failed':
          await this.handlePhotoAvatarFailed(payload, webhookId);
          break;
        case 'voice_clone.success':
          await this.handleVoiceCloneSuccess(payload, webhookId);
          break;
        case 'voice_clone.failed':
          await this.handleVoiceCloneFailed(payload, webhookId);
          break;
        case 'video.success':
          await this.handleVideoSuccess(payload, webhookId);
          break;
        case 'video.failed':
          await this.handleVideoFailed(payload, webhookId);
          break;
        default:
          this.logger.warn(`⚠️ [WEBHOOK_RECEIVED] Unknown HeyGen webhook event`, {
            webhookId,
            eventType: payload.event_type,
            callbackId: payload.event_data.callback_id,
            timestamp: new Date().toISOString()
          });
      }

      this.logger.log(`✅ [WEBHOOK_RECEIVED] Webhook processed successfully`, {
        webhookId,
        eventType: payload.event_type,
        callbackId: payload.event_data.callback_id,
        timestamp: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`❌ [WEBHOOK_RECEIVED] Error processing HeyGen webhook`, {
        webhookId,
        eventType: payload.event_type,
        callbackId: payload.event_data.callback_id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Обработка успешного создания Photo Avatar
   */
  private async handlePhotoAvatarSuccess(payload: HeyGenWebhookPayload, webhookId: string) {
    const { avatar_id, callback_id } = payload.event_data;
    
    this.logger.log(`✅ [PHOTO_AVATAR_SUCCESS] Photo Avatar created successfully`, {
      webhookId,
      callbackId: callback_id,
      avatarId: avatar_id,
      eventData: payload.event_data,
      timestamp: new Date().toISOString()
    });
    
    if (!callback_id) {
      this.logger.error(`❌ [PHOTO_AVATAR_SUCCESS] No callback_id in Photo Avatar success payload`, {
        webhookId,
        payload: payload.event_data,
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // Обновляем статус процесса и запускаем следующий шаг (Voice Cloning)
    this.logger.log(`📊 [PHOTO_AVATAR_SUCCESS] Updating process status`, {
      webhookId,
      callbackId: callback_id,
      avatarId: avatar_id,
      newStatus: 'photo_avatar_completed',
      timestamp: new Date().toISOString()
    });
    
    await this.processManager.updateProcessStatus(callback_id, 'photo_avatar_completed', { 
      photoAvatarId: avatar_id 
    });
    
    this.logger.log(`🚀 [PHOTO_AVATAR_SUCCESS] Executing next step`, {
      webhookId,
      callbackId: callback_id,
      avatarId: avatar_id,
      timestamp: new Date().toISOString()
    });
    
    await this.processManager.executeNextStep(callback_id);
    
    this.logger.log(`✅ [PHOTO_AVATAR_SUCCESS] Photo Avatar success processed completely`, {
      webhookId,
      callbackId: callback_id,
      avatarId: avatar_id,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Обработка ошибки создания Photo Avatar
   */
  private async handlePhotoAvatarFailed(payload: HeyGenWebhookPayload, webhookId: string) {
    const { error, callback_id } = payload.event_data;
    this.logger.error(`❌ Photo Avatar creation failed for callback ${callback_id}: ${error}`);
    
    if (!callback_id) {
      this.logger.error('No callback_id in Photo Avatar failed payload');
      return;
    }
    
    // Обновляем статус процесса и уведомляем пользователя
    await this.processManager.updateProcessStatus(callback_id, 'photo_avatar_failed', { error });
    const process = await this.processManager.getProcess(callback_id);
    if (process) {
      await this.notifyUserError(process, 'Ошибка создания аватара из фото');
    }
  }

  /**
   * Обработка успешного клонирования голоса
   */
  private async handleVoiceCloneSuccess(payload: HeyGenWebhookPayload, webhookId: string) {
    const { voice_id, callback_id } = payload.event_data;
    this.logger.log(`✅ Voice Clone created successfully: ${voice_id} for callback ${callback_id}`);
    
    if (!callback_id) {
      this.logger.error('No callback_id in Voice Clone success payload');
      return;
    }
    
    // Обновляем статус процесса и запускаем следующий шаг (Video Generation)
    await this.processManager.updateProcessStatus(callback_id, 'voice_clone_completed', { 
      voiceCloneId: voice_id 
    });
    await this.processManager.executeNextStep(callback_id);
  }

  /**
   * Обработка ошибки клонирования голоса
   */
  private async handleVoiceCloneFailed(payload: HeyGenWebhookPayload, webhookId: string) {
    const { error, callback_id } = payload.event_data;
    this.logger.error(`❌ Voice Clone creation failed for callback ${callback_id}: ${error}`);
    
    if (!callback_id) {
      this.logger.error('No callback_id in Voice Clone failed payload');
      return;
    }
    
    // Обновляем статус процесса и уведомляем пользователя
    await this.processManager.updateProcessStatus(callback_id, 'voice_clone_failed', { error });
    const process = await this.processManager.getProcess(callback_id);
    if (process) {
      await this.notifyUserError(process, 'Ошибка клонирования голоса');
    }
  }

  /**
   * Обработка успешного создания видео
   */
  private async handleVideoSuccess(payload: HeyGenWebhookPayload, webhookId: string) {
    const { video_id, video_url, callback_id } = payload.event_data;
    this.logger.log(`✅ Video created successfully: ${video_id} for callback ${callback_id}`);
    this.logger.log(`🎬 Video URL: ${video_url}`);
    
    if (!callback_id) {
      this.logger.error('No callback_id in Video success payload');
      return;
    }
    
    // Обновляем статус процесса и отправляем видео пользователю
    await this.processManager.updateProcessStatus(callback_id, 'video_completed', { 
      videoId: video_id, 
      videoUrl: video_url 
    });
    const process = await this.processManager.getProcess(callback_id);
    if (process && video_url) {
      await this.sendVideoToUser(process, video_url);
    }
  }

  /**
   * Обработка ошибки создания видео
   */
  private async handleVideoFailed(payload: HeyGenWebhookPayload, webhookId: string) {
    const { error, callback_id } = payload.event_data;
    this.logger.error(`❌ Video creation failed for callback ${callback_id}: ${error}`);
    
    if (!callback_id) {
      this.logger.error('No callback_id in Video failed payload');
      return;
    }
    
    // Обновляем статус процесса и уведомляем пользователя
    await this.processManager.updateProcessStatus(callback_id, 'video_failed', { error });
    const process = await this.processManager.getProcess(callback_id);
    if (process) {
      await this.notifyUserError(process, 'Ошибка создания видео');
    }
  }

  /**
   * Отправка видео пользователю
   */
  private async sendVideoToUser(process: any, videoUrl: string) {
    try {
      await this.bot.telegram.sendVideo(process.userId, videoUrl, {
        caption: `🎬 Ваше видео с цифровым двойником готово!\n\n` +
                `📝 Сценарий: ${process.script.substring(0, 100)}...\n` +
                `🎥 Качество: ${process.quality}\n` +
                `⏱️ Длительность: ~${this.calculateVideoDuration(process.script)} сек`
      });
      this.logger.log(`📤 Video sent to user ${process.userId} for process ${process.id}`);
    } catch (error) {
      this.logger.error(`Error sending video to user ${process.userId}:`, error);
    }
  }

  /**
   * Уведомление пользователя об ошибке
   */
  private async notifyUserError(process: any, errorMessage: string) {
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
}
