import { Controller, Post, Body, Logger, Inject } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { getBotToken } from 'nestjs-telegraf';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { ConfigService } from '@nestjs/config';
import { AkoolProgressService } from './akool-progress.service';
import { ReferralPaymentHook } from '../referrals/referral-payment.hook';
import {
  AkoolWebhookBody,
  AkoolDecryptedData,
  AkoolWebhookLog,
  AkoolVideoRequestRecord,
  validateAkoolWebhookBody,
  validateAkoolDecryptedData,
} from '../types';

@Controller('akool/webhook')
export class AkoolWebhookController {
  private readonly logger = new Logger(AkoolWebhookController.name);

  constructor(
    @Inject(getBotToken('airshorts1_bot')) private readonly bot: Telegraf,
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly configService: ConfigService,
    private readonly progressService: AkoolProgressService,
    private readonly referralPaymentHook: ReferralPaymentHook
  ) {}

  @Post()
  async handleWebhook(@Body() body: unknown) {
    // Валидация входящих данных
    if (!validateAkoolWebhookBody(body)) {
      this.logger.error('❌ Invalid AKOOL webhook body received');
      return { success: false, error: 'Invalid webhook body format' };
    }
    this.logger.log('📥 AKOOL webhook received:', body);

    // Проверяем, не обрабатывали ли мы уже этот webhook
    const webhookId = this.generateWebhookId(body);
    if (await this.isWebhookProcessed(webhookId)) {
      this.logger.log(`⚠️ Webhook уже обработан: ${webhookId}`);
      return { status: 'ok', message: 'Webhook already processed' };
    }

    // Сохраняем webhook в БД
    await this.saveWebhookLog('akool', 'video_status', body);

    try {
      // AKOOL отправляет зашифрованные данные
      if (body.dataEncrypt) {
        this.logger.log('🔓 Получены зашифрованные данные от AKOOL');
        this.logger.log('📋 Webhook содержит зашифрованную информацию о статусе видео');

        // Попробуем расшифровать данные
        try {
          const decryptedData = await this.decryptWebhookData(body);
          this.logger.log('✅ Данные успешно расшифрованы:', decryptedData);

          // Обрабатываем расшифрованные данные согласно документации
          // status: 1=очередь, 2=обработка, 3=готово, 4=ошибка
          const { _id, status, type, url } = decryptedData;

          this.logger.log(`📊 Расшифрованные данные:`);
          this.logger.log(`  ID: ${_id}`);
          this.logger.log(`  Status: ${status}`);
          this.logger.log(`  Type: ${type}`);
          this.logger.log(`  URL: ${url}`);

          // Обновляем статус в БД
          const dbStatus = status === 3 ? 'completed' : status === 4 ? 'failed' : 'processing';
          await this.updateVideoStatus(
            _id,
            dbStatus,
            url,
            status === 4 ? 'Ошибка обработки' : undefined
          );

          if (status === 3) {
            // 3 = готово
            this.logger.log(`🎉 ${type} готово! ID: ${_id}, URL: ${url}`);

            // Обновляем прогресс на 100%
            await this.progressService.updateProgress(_id, 'completed', 100, '🎉 Видео готово!');

            if (url) {
              await this.sendVideoToUser(url, _id);
            }
          } else if (status === 4) {
            // 4 = ошибка
            this.logger.error(`❌ Ошибка создания ${type} для задачи: ${_id}`);

            // Обновляем прогресс на ошибку
            await this.progressService.updateProgress(_id, 'failed', 0, '❌ Ошибка обработки');

            await this.notifyUserError(_id);
          } else {
            // 1 = очередь, 2 = обработка
            const progress = status === 1 ? 10 : 50;
            const message =
              status === 1 ? '⏳ В очереди на обработку...' : '🔄 Обрабатывается на сервере...';

            this.logger.log(
              `⏳ Статус ${type}: ${status} (${status === 1 ? 'очередь' : 'обработка'})`
            );

            // Обновляем прогресс
            await this.progressService.updateProgress(_id, 'processing', progress, message);
          }
        } catch (decryptError) {
          this.logger.warn('⚠️ Не удалось расшифровать данные:', decryptError);
          this.logger.log('⏳ Ожидаем ключ расшифровки...');
        }

        // Отмечаем webhook как обработанный
        await this.markWebhookProcessed(webhookId);
        return { status: 'ok', message: 'Webhook processed' };
      }

      // Если данные не зашифрованы (старая версия API)
      if (body.data && body.data.video_status === 2) {
        // 2 = завершено
        const { video_id, video, task_id } = body.data;

        this.logger.log(`✅ Видео готово! ID: ${video_id}, URL: ${video}`);

        // Отправляем видео пользователю
        if (video) {
          await this.sendVideoToUser(video, task_id);
        }
      } else if (body.data && body.data.video_status === 3) {
        // 3 = ошибка
        const { task_id } = body.data;
        this.logger.error(`❌ Ошибка создания видео для задачи: ${task_id}`);

        // Уведомляем пользователя об ошибке
        await this.notifyUserError(task_id);
      } else {
        this.logger.log(`⏳ Статус видео: ${body.data?.video_status} (ожидание завершения)`);
      }

      return { status: 'ok' };
    } catch (error) {
      this.logger.error('❌ Ошибка обработки webhook:', error);
      return { status: 'error', message: error.message };
    }
  }

  private async sendVideoToUser(videoUrl: string, taskId: string) {
    try {
      // Получаем userId по taskId из базы данных
      const videoRequest = await this.findVideoRequestByTaskId(taskId);

      if (!videoRequest) {
        this.logger.error(`❌ Запрос на видео не найден для taskId: ${taskId}`);
        return;
      }

      const userId = videoRequest.user_id;
      this.logger.log(`📱 Отправляю видео пользователю ${userId} для задачи ${taskId}`);

      await this.bot.telegram.sendVideo(userId, videoUrl, {
        caption: `🎉 **Ваше видео готово!**\n\n📋 Task ID: ${taskId}\n🔗 Ссылка: ${videoUrl}\n\n✨ Спасибо за использование нашего сервиса!`,
        parse_mode: 'Markdown',
      });

      this.logger.log(`✅ Видео отправлено пользователю ${userId}`);
    } catch (error) {
      this.logger.error('❌ Ошибка отправки видео:', error);
    }
  }

  private async notifyUserError(taskId: string) {
    try {
      // Получаем userId по taskId из базы данных
      const videoRequest = await this.findVideoRequestByTaskId(taskId);

      if (!videoRequest) {
        this.logger.error(`❌ Запрос на видео не найден для taskId: ${taskId}`);
        return;
      }

      const userId = videoRequest.user_id;
      this.logger.log(
        `📱 Отправляю уведомление об ошибке пользователю ${userId} для задачи ${taskId}`
      );

      await this.bot.telegram.sendMessage(
        userId,
        `❌ **Ошибка при создании видео**\n\nПричина: Ошибка обработки на сервере.\n\n🔄 Попробуйте создать видео еще раз или обратитесь в поддержку.`,
        { parse_mode: 'Markdown' }
      );

      this.logger.log(`✅ Уведомление об ошибке отправлено пользователю ${userId}`);
    } catch (error) {
      this.logger.error('❌ Ошибка уведомления об ошибке:', error);
    }
  }

  /**
   * Расшифровка webhook данных от AKOOL согласно официальной документации
   * https://docs.akool.com/ai-tools-suite/webhook
   */
  private async decryptWebhookData(body: AkoolWebhookBody): Promise<AkoolDecryptedData> {
    try {
      const { dataEncrypt, signature, timestamp, nonce } = body;

      this.logger.log('🔍 Расшифровка webhook данных AKOOL...');
      this.logger.log(`📊 Signature: ${signature}`);
      this.logger.log(`⏰ Timestamp: ${timestamp}`);
      this.logger.log(`🔢 Nonce: ${nonce}`);

      // Получаем ключи из переменных окружения
      const clientId = process.env.AKOOL_CLIENT_ID;
      const clientSecret = process.env.AKOOL_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error(
          'AKOOL_CLIENT_ID и AKOOL_CLIENT_SECRET должны быть установлены в переменных окружения'
        );
      }

      this.logger.log(`🔑 Client ID: ${clientId}`);
      this.logger.log(`🔑 Client Secret: ${clientSecret.substring(0, 8)}...`);

      // 1. Проверяем подпись
      const isValidSignature = this.verifySignature(
        clientId,
        timestamp,
        nonce,
        dataEncrypt,
        signature
      );
      if (!isValidSignature) {
        throw new Error('❌ Неверная подпись webhook');
      }

      this.logger.log('✅ Подпись webhook проверена успешно');

      // 2. Расшифровываем данные
      const decryptedData = this.decryptAES(dataEncrypt, clientId, clientSecret);
      this.logger.log('✅ Данные успешно расшифрованы:', decryptedData);

      return JSON.parse(decryptedData);
    } catch (error) {
      this.logger.error('❌ Ошибка расшифровки webhook данных:', error);
      throw error;
    }
  }

  /**
   * Проверка подписи webhook согласно официальной документации AKOOL
   * https://docs.akool.com/ai-tools-suite/webhook
   *
   * signature = sha1(sort(clientId, timestamp, nonce, dataEncrypt))
   */
  private verifySignature(
    clientId: string,
    timestamp: number,
    nonce: string,
    dataEncrypt: string,
    signature: string
  ): boolean {
    try {
      const crypto = require('crypto');

      // Согласно документации: сортируем параметры и объединяем
      const sortedParams = [clientId, timestamp.toString(), nonce, dataEncrypt].sort().join('');

      // Вычисляем SHA1 хеш
      const calculatedSignature = crypto.createHash('sha1').update(sortedParams).digest('hex');

      this.logger.log(`🔍 Проверка подписи:`);
      this.logger.log(
        `  Параметры для сортировки: [${clientId}, ${timestamp}, ${nonce}, ${dataEncrypt.substring(0, 20)}...]`
      );
      this.logger.log(`  Отсортированные параметры: ${sortedParams.substring(0, 100)}...`);
      this.logger.log(`  Ожидаемая подпись: ${signature}`);
      this.logger.log(`  Вычисленная подпись: ${calculatedSignature}`);

      const isValid = calculatedSignature === signature;
      this.logger.log(`  Результат проверки: ${isValid ? '✅ Валидна' : '❌ Невалидна'}`);

      return isValid;
    } catch (error) {
      this.logger.error('❌ Ошибка проверки подписи:', error);
      return false;
    }
  }

  /**
   * Расшифровка AES-192-CBC согласно официальной документации AKOOL
   * https://docs.akool.com/ai-tools-suite/webhook
   *
   * Использует crypto-js для совместимости с официальным примером
   */
  private decryptAES(dataEncrypt: string, clientId: string, clientSecret: string): string {
    try {
      const CryptoJS = require('crypto-js');

      // Получаем ключи из переменных окружения
      const actualClientId = this.configService.get<string>('AKOOL_CLIENT_ID');
      const actualClientSecret = this.configService.get<string>('AKOOL_CLIENT_SECRET');

      this.logger.log(`🔑 Используем переменные окружения:`);
      this.logger.log(`🔑 AKOOL_CLIENT_ID: ${actualClientId}`);
      this.logger.log(`🔑 AKOOL_CLIENT_SECRET: ${actualClientSecret?.substring(0, 10)}...`);

      // Создаем ключ и IV согласно документации
      const aesKey = actualClientSecret;
      const key = CryptoJS.enc.Utf8.parse(aesKey);
      const iv = CryptoJS.enc.Utf8.parse(actualClientId);

      this.logger.log(`🔑 Ключ (UTF-8): ${key.toString(CryptoJS.enc.Hex)} (${key.sigBytes} байт)`);
      this.logger.log(`🔑 IV (UTF-8): ${iv.toString(CryptoJS.enc.Hex)} (${iv.sigBytes} байт)`);

      // Расшифровываем AES-192-CBC с PKCS#7 padding используя crypto-js
      const decrypted = CryptoJS.AES.decrypt(dataEncrypt, key, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      const result = decrypted.toString(CryptoJS.enc.Utf8);
      this.logger.log('✅ Расшифровка успешна');
      return result;
    } catch (error) {
      this.logger.error('❌ Ошибка AES расшифровки:', error);
      throw error;
    }
  }

  /**
   * Генерация уникального ID для webhook
   */
  private generateWebhookId(body: AkoolWebhookBody): string {
    const crypto = require('crypto');
    const content = JSON.stringify(body);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Проверка, был ли webhook уже обработан
   */
  private async isWebhookProcessed(webhookId: string): Promise<boolean> {
    try {
      const result = await this.pool.query(
        `SELECT id FROM webhook_logs WHERE webhook_id = $1 AND processed = true`,
        [webhookId]
      );
      return result.rows.length > 0;
    } catch (error) {
      this.logger.error('❌ Ошибка проверки webhook:', error);
      return false;
    }
  }

  /**
   * Отметка webhook как обработанного
   */
  private async markWebhookProcessed(webhookId: string): Promise<void> {
    try {
      await this.pool.query(`UPDATE webhook_logs SET processed = true WHERE webhook_id = $1`, [
        webhookId,
      ]);
      this.logger.debug(`✅ Webhook отмечен как обработанный: ${webhookId}`);
    } catch (error) {
      this.logger.error('❌ Ошибка отметки webhook:', error);
    }
  }

  /**
   * Сохранение webhook лога в БД
   */
  private async saveWebhookLog(
    service: string,
    webhookType: string,
    payload: AkoolWebhookBody
  ): Promise<void> {
    try {
      const webhookId = this.generateWebhookId(payload);
      await this.pool.query(
        `INSERT INTO webhook_logs (service, webhook_type, payload, webhook_id, processed, created_at) 
         VALUES ($1, $2, $3, $4, false, NOW())`,
        [service, webhookType, JSON.stringify(payload), webhookId]
      );
      this.logger.debug(`💾 Webhook лог сохранен: ${service}/${webhookType}`);
    } catch (error) {
      this.logger.error(`❌ Ошибка сохранения webhook лога:`, error);
    }
  }

  /**
   * Обновление статуса видео в БД
   */
  private async updateVideoStatus(
    taskId: string,
    status: string,
    resultUrl?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      const updateFields = ['status = $2', 'updated_at = NOW()'];
      const values = [taskId, status];
      let paramIndex = 3;

      if (resultUrl) {
        updateFields.push(`result_url = $${paramIndex++}`);
        values.push(resultUrl);
      }

      if (errorMessage) {
        updateFields.push(`error_message = $${paramIndex++}`);
        values.push(errorMessage);
      }

      if (status === 'completed' || status === 'failed') {
        updateFields.push(`completed_at = NOW()`);
      }

      await this.pool.query(
        `UPDATE video_requests 
         SET ${updateFields.join(', ')} 
         WHERE task_id = $1`,
        values
      );

      this.logger.debug(`💾 Статус видео обновлен: ${taskId} -> ${status}`);
    } catch (error) {
      this.logger.error(`❌ Ошибка обновления статуса видео:`, error);
    }
  }

  /**
   * Поиск запроса по task_id
   */
  private async findVideoRequestByTaskId(taskId: string): Promise<AkoolVideoRequestRecord | null> {
    try {
      const result = await this.pool.query('SELECT * FROM video_requests WHERE task_id = $1', [
        taskId,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error(`❌ Ошибка поиска запроса:`, error);
      return null;
    }
  }
}
