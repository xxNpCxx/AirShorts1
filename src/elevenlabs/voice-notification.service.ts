import { Injectable, Logger } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { getBotToken } from 'nestjs-telegraf';
import { Inject } from '@nestjs/common';

interface VoiceNotificationData {
  userId: number;
  chatId: number;
  voiceId: string;
  voiceName: string;
  status: string;
}

@Injectable()
export class VoiceNotificationService {
  private readonly logger = new Logger(VoiceNotificationService.name);
  private readonly pendingNotifications = new Map<string, VoiceNotificationData>();

  constructor(@Inject(getBotToken('airshorts1_bot')) private readonly bot: Telegraf) {}

  /**
   * Регистрирует ожидающее уведомление о готовности голоса
   */
  registerVoiceNotification(
    userId: number,
    chatId: number,
    voiceId: string,
    voiceName: string
  ): void {
    const notificationData: VoiceNotificationData = {
      userId,
      chatId,
      voiceId,
      voiceName,
      status: 'processing',
    };

    this.pendingNotifications.set(voiceId, notificationData);
    this.logger.log(`Registered voice notification for user ${userId}, voice ${voiceId}`);
  }

  /**
   * Отправляет уведомление пользователю о готовности голоса
   */
  async notifyVoiceReady(voiceId: string): Promise<void> {
    const notification = this.pendingNotifications.get(voiceId);
    if (!notification) {
      this.logger.warn(`No pending notification found for voice ${voiceId}`);
      return;
    }

    try {
      await this.bot.telegram.sendMessage(
        notification.chatId,
        `🎉 Ваш клонированный голос готов!\n\n` +
          `🎤 Голос: ${notification.voiceName}\n` +
          `🆔 ID: ${voiceId.substring(0, 8)}...\n\n` +
          `✅ Теперь вы можете создавать видео с вашим голосом!\n\n` +
          `💡 Перейдите в меню создания видео для продолжения.`
      );

      this.pendingNotifications.delete(voiceId);
      this.logger.log(`Voice ready notification sent to user ${notification.userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send voice ready notification to user ${notification.userId}:`,
        error
      );
    }
  }

  /**
   * Отправляет уведомление пользователю об ошибке клонирования голоса
   */
  async notifyVoiceError(voiceId: string, error: string): Promise<void> {
    const notification = this.pendingNotifications.get(voiceId);
    if (!notification) {
      this.logger.warn(`No pending notification found for voice ${voiceId}`);
      return;
    }

    try {
      await this.bot.telegram.sendMessage(
        notification.chatId,
        `❌ Ошибка при клонировании голоса\n\n` +
          `🎤 Голос: ${notification.voiceName}\n` +
          `🆔 ID: ${voiceId.substring(0, 8)}...\n\n` +
          `⚠️ Причина: ${error}\n\n` +
          `🔄 Вы можете попробовать загрузить голос заново или использовать синтетический голос.`
      );

      this.pendingNotifications.delete(voiceId);
      this.logger.log(`Voice error notification sent to user ${notification.userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send voice error notification to user ${notification.userId}:`,
        error
      );
    }
  }

  /**
   * Получает список ожидающих уведомлений
   */
  getPendingNotifications(): VoiceNotificationData[] {
    return Array.from(this.pendingNotifications.values());
  }

  /**
   * Очищает старые уведомления (старше 24 часов)
   */
  cleanupOldNotifications(): void {
    // В реальном приложении здесь можно добавить логику очистки старых уведомлений
    // Пока оставляем простую реализацию
    this.logger.debug(`Current pending notifications: ${this.pendingNotifications.size}`);
  }
}
