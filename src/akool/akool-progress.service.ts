import { Injectable, Logger, Inject } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { getBotToken } from 'nestjs-telegraf';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { ConfigService } from '@nestjs/config';

interface ProgressUpdate {
  taskId: string;
  userId: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  messageId?: number; // ID сообщения с прогресс-баром
}

@Injectable()
export class AkoolProgressService {
  private readonly logger = new Logger(AkoolProgressService.name);
  private readonly progressTimers = new Map<string, ReturnType<typeof setInterval>>();

  constructor(
    @Inject(getBotToken('airshorts1_bot')) private readonly bot: Telegraf,
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly configService: ConfigService
  ) {}

  /**
   * Запуск отслеживания прогресса для задачи
   */
  async startProgressTracking(taskId: string, userId: number): Promise<void> {
    this.logger.log(
      `🚀 Запускаю отслеживание прогресса для задачи ${taskId}, пользователь ${userId}`
    );

    // Отправляем начальное сообщение с прогресс-баром
    const initialMessage = await this.sendProgressMessage(userId, {
      taskId,
      userId,
      status: 'queued',
      progress: 0,
      message: '🎬 Видео поставлено в очередь обработки...',
    });

    // Сохраняем ID сообщения в БД
    if (initialMessage) {
      await this.saveProgressMessageId(taskId, initialMessage.message_id);
    }

    // Запускаем периодическую проверку статуса
    this.startStatusPolling(taskId, userId);
  }

  /**
   * Отправка сообщения с прогресс-баром
   */
  private async sendProgressMessage(
    userId: number,
    update: ProgressUpdate
  ): Promise<{ message_id: number } | null> {
    try {
      const progressBar = this.createProgressBar(update.progress);
      const statusEmoji = this.getStatusEmoji(update.status);

      const message = `${statusEmoji} **${update.message}**\n\n${progressBar}\n\n📊 Прогресс: ${update.progress}%`;

      const sentMessage = await this.bot.telegram.sendMessage(userId, message, {
        parse_mode: 'Markdown',
      });

      this.logger.log(`📱 Прогресс отправлен пользователю ${userId}: ${update.progress}%`);
      return sentMessage;
    } catch (error) {
      this.logger.error('❌ Ошибка отправки прогресса:', error);
      return null;
    }
  }

  /**
   * Обновление прогресса
   */
  async updateProgress(
    taskId: string,
    status: ProgressUpdate['status'],
    progress: number,
    message: string
  ): Promise<void> {
    try {
      // Получаем данные задачи из БД
      const videoRequest = await this.findVideoRequestByTaskId(taskId);
      if (!videoRequest) {
        this.logger.error(`❌ Задача не найдена: ${taskId}`);
        return;
      }

      const userId = videoRequest.user_id;
      const messageId = videoRequest.progress_message_id;

      // Если есть ID сообщения, обновляем его
      if (messageId) {
        await this.editProgressMessage(userId, messageId, {
          taskId,
          userId,
          status,
          progress,
          message,
        });
      } else {
        // Иначе отправляем новое сообщение
        await this.sendProgressMessage(userId, {
          taskId,
          userId,
          status,
          progress,
          message,
        });
      }

      // Если задача завершена, останавливаем отслеживание
      if (status === 'completed' || status === 'failed') {
        this.stopProgressTracking(taskId);
      }
    } catch (error) {
      this.logger.error('❌ Ошибка обновления прогресса:', error);
    }
  }

  /**
   * Редактирование сообщения с прогресс-баром
   */
  private async editProgressMessage(
    userId: number,
    messageId: number,
    update: ProgressUpdate
  ): Promise<void> {
    try {
      const progressBar = this.createProgressBar(update.progress);
      const statusEmoji = this.getStatusEmoji(update.status);

      const message = `${statusEmoji} **${update.message}**\n\n${progressBar}\n\n📊 Прогресс: ${update.progress}%`;

      await this.bot.telegram.editMessageText(userId, messageId, undefined, message, {
        parse_mode: 'Markdown',
      });

      this.logger.log(`📱 Прогресс обновлен для пользователя ${userId}: ${update.progress}%`);
    } catch (error) {
      this.logger.error('❌ Ошибка редактирования прогресса:', error);
    }
  }

  /**
   * Создание визуального прогресс-бара
   */
  private createProgressBar(progress: number): string {
    const totalBlocks = 10;
    const filledBlocks = Math.round((progress / 100) * totalBlocks);
    const emptyBlocks = totalBlocks - filledBlocks;

    const filled = '█'.repeat(filledBlocks);
    const empty = '░'.repeat(emptyBlocks);

    return `[${filled}${empty}]`;
  }

  /**
   * Получение эмодзи статуса
   */
  private getStatusEmoji(status: ProgressUpdate['status']): string {
    switch (status) {
      case 'queued':
        return '⏳';
      case 'processing':
        return '🔄';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '📊';
    }
  }

  /**
   * Запуск периодической проверки статуса
   */
  private startStatusPolling(taskId: string, userId: number): void {
    const pollingInterval = 30000; // 30 секунд
    let attempts = 0;
    const maxAttempts = 20; // 10 минут максимум

    const timer = setInterval(() => {
      attempts++;

      // Используем void для асинхронной функции
      void (async () => {
        try {
          // Проверяем статус через API
          const status = await this.checkVideoStatus(taskId);

          if (status) {
            await this.updateProgress(taskId, status.status, status.progress, status.message);

            // Если задача завершена, останавливаем проверку
            if (status.status === 'completed' || status.status === 'failed') {
              clearInterval(timer);
              this.progressTimers.delete(taskId);
            }
          }
        } catch (error) {
          this.logger.error(`❌ Ошибка проверки статуса для ${taskId}:`, error);
        }

        // Останавливаем после максимального количества попыток
        if (attempts >= maxAttempts) {
          this.logger.warn(`⏰ Превышено время ожидания для задачи ${taskId}`);
          clearInterval(timer);
          this.progressTimers.delete(taskId);

          // Уведомляем пользователя о таймауте
          await this.updateProgress(
            taskId,
            'failed',
            0,
            'Время обработки превышено. Попробуйте еще раз.'
          );
        }
      })();
    }, pollingInterval);

    this.progressTimers.set(taskId, timer);
  }

  /**
   * Остановка отслеживания прогресса
   */
  stopProgressTracking(taskId: string): void {
    const timer = this.progressTimers.get(taskId);
    if (timer) {
      clearInterval(timer);
      this.progressTimers.delete(taskId);
      this.logger.log(`🛑 Остановлено отслеживание прогресса для задачи ${taskId}`);
    }
  }

  /**
   * Проверка статуса видео через API
   */
  private async checkVideoStatus(
    taskId: string
  ): Promise<{ status: ProgressUpdate['status']; progress: number; message: string } | null> {
    // Здесь можно добавить вызов API для проверки статуса
    // Пока возвращаем заглушку
    return {
      status: 'processing',
      progress: 50,
      message: 'Обрабатывается на сервере...',
    };
  }

  /**
   * Поиск запроса по task_id
   */
  private async findVideoRequestByTaskId(
    taskId: string
  ): Promise<{ user_id: number; progress_message_id?: number } | null> {
    try {
      const result = await this.pool.query('SELECT * FROM video_requests WHERE task_id = $1', [
        taskId,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error('❌ Ошибка поиска запроса:', error);
      return null;
    }
  }

  /**
   * Сохранение ID сообщения с прогрессом
   */
  private async saveProgressMessageId(taskId: string, messageId: number): Promise<void> {
    try {
      await this.pool.query(
        'UPDATE video_requests SET progress_message_id = $1 WHERE task_id = $2',
        [messageId, taskId]
      );
      this.logger.debug(`💾 ID сообщения прогресса сохранен: ${taskId} -> ${messageId}`);
    } catch (error) {
      this.logger.error('❌ Ошибка сохранения ID сообщения:', error);
    }
  }
}
