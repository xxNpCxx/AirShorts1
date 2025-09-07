import { Controller, Post, Body, Logger, Inject } from "@nestjs/common";
import { Telegraf } from "telegraf";
import { getBotToken } from "nestjs-telegraf";
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { ConfigService } from "@nestjs/config";

@Controller("akool/webhook")
export class AkoolWebhookController {
  private readonly logger = new Logger(AkoolWebhookController.name);

  constructor(
    @Inject(getBotToken("airshorts1_bot")) private readonly bot: Telegraf,
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  async handleWebhook(@Body() body: any) {
    this.logger.log("📥 AKOOL webhook received:", body);
    
    // Сохраняем webhook в БД
    await this.saveWebhookLog('akool', 'video_status', body);
    
    try {
      // AKOOL отправляет зашифрованные данные
      if (body.dataEncrypt) {
        this.logger.log("🔓 Получены зашифрованные данные от AKOOL");
        this.logger.log("📋 Webhook содержит зашифрованную информацию о статусе видео");
        
        // Попробуем расшифровать данные
        try {
          const decryptedData = await this.decryptWebhookData(body);
          this.logger.log("✅ Данные успешно расшифрованы:", decryptedData);
          
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
          await this.updateVideoStatus(_id, dbStatus, url, status === 4 ? 'Ошибка обработки' : undefined);

          if (status === 3) { // 3 = готово
            this.logger.log(`🎉 ${type} готово! ID: ${_id}, URL: ${url}`);
            
            if (url) {
              await this.sendVideoToUser(url, _id);
            }
          } else if (status === 4) { // 4 = ошибка
            this.logger.error(`❌ Ошибка создания ${type} для задачи: ${_id}`);
            await this.notifyUserError(_id);
          } else {
            this.logger.log(`⏳ Статус ${type}: ${status} (${status === 1 ? 'очередь' : 'обработка'})`);
          }
        } catch (decryptError) {
          this.logger.warn("⚠️ Не удалось расшифровать данные:", decryptError);
          this.logger.log("⏳ Ожидаем ключ расшифровки...");
        }
        
        return { status: "ok", message: "Webhook processed" };
      }
      
      // Если данные не зашифрованы (старая версия API)
      if (body.data && body.data.video_status === 2) { // 2 = завершено
        const { video_id, video, task_id } = body.data;
        
        this.logger.log(`✅ Видео готово! ID: ${video_id}, URL: ${video}`);
        
        // Отправляем видео пользователю
        if (video) {
          await this.sendVideoToUser(video, task_id);
        }
      } else if (body.data && body.data.video_status === 3) { // 3 = ошибка
        const { task_id } = body.data;
        this.logger.error(`❌ Ошибка создания видео для задачи: ${task_id}`);
        
        // Уведомляем пользователя об ошибке
        await this.notifyUserError(task_id);
      } else {
        this.logger.log(`⏳ Статус видео: ${body.data?.video_status} (ожидание завершения)`);
      }
      
      return { status: "ok" };
    } catch (error) {
      this.logger.error("❌ Ошибка обработки webhook:", error);
      return { status: "error", message: error.message };
    }
  }

  private async sendVideoToUser(videoUrl: string, taskId: string) {
    try {
      // Здесь нужно получить userId по taskId из базы данных
      // Пока отправляем в общий чат для тестирования
      const chatId = process.env.TEST_CHAT_ID || "161693997"; // Ваш ID для тестирования
      
      await this.bot.telegram.sendVideo(chatId, videoUrl, {
        caption: `🎉 Ваше видео готово!\n\n📋 Task ID: ${taskId}\n🔗 Ссылка: ${videoUrl}`
      });
      
      this.logger.log(`✅ Видео отправлено пользователю ${chatId}`);
    } catch (error) {
      this.logger.error("❌ Ошибка отправки видео:", error);
    }
  }

  private async notifyUserError(taskId: string) {
    try {
      const chatId = process.env.TEST_CHAT_ID || "161693997";
      
      await this.bot.telegram.sendMessage(chatId, 
        `❌ Произошла ошибка при создании видео.\n\n📋 Task ID: ${taskId}\n\nПопробуйте еще раз или обратитесь в поддержку.`
      );
      
      this.logger.log(`✅ Уведомление об ошибке отправлено пользователю ${chatId}`);
    } catch (error) {
      this.logger.error("❌ Ошибка отправки уведомления об ошибке:", error);
    }
  }

  /**
   * Расшифровка webhook данных от AKOOL согласно официальной документации
   * https://docs.akool.com/ai-tools-suite/webhook
   */
  private async decryptWebhookData(body: any): Promise<any> {
    try {
      const { dataEncrypt, signature, timestamp, nonce } = body;
      
      this.logger.log("🔍 Расшифровка webhook данных AKOOL...");
      this.logger.log(`📊 Signature: ${signature}`);
      this.logger.log(`⏰ Timestamp: ${timestamp}`);
      this.logger.log(`🔢 Nonce: ${nonce}`);
      
      // Получаем ключи из переменных окружения
      const clientId = process.env.AKOOL_CLIENT_ID;
      const clientSecret = process.env.AKOOL_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        throw new Error("AKOOL_CLIENT_ID и AKOOL_CLIENT_SECRET должны быть установлены в переменных окружения");
      }
      
      this.logger.log(`🔑 Client ID: ${clientId}`);
      this.logger.log(`🔑 Client Secret: ${clientSecret.substring(0, 8)}...`);
      
      // 1. Проверяем подпись
      const isValidSignature = this.verifySignature(clientId, timestamp, nonce, dataEncrypt, signature);
      if (!isValidSignature) {
        throw new Error("❌ Неверная подпись webhook");
      }
      
      this.logger.log("✅ Подпись webhook проверена успешно");
      
      // 2. Расшифровываем данные
      const decryptedData = this.decryptAES(dataEncrypt, clientId, clientSecret);
      this.logger.log("✅ Данные успешно расшифрованы:", decryptedData);
      
      return JSON.parse(decryptedData);
      
    } catch (error) {
      this.logger.error("❌ Ошибка расшифровки webhook данных:", error);
      throw error;
    }
  }

  /**
   * Проверка подписи webhook согласно документации AKOOL
   * signature = sha1(sort(clientId, timestamp, nonce, dataEncrypt))
   */
  private verifySignature(clientId: string, timestamp: number, nonce: string, dataEncrypt: string, signature: string): boolean {
    try {
      const crypto = require('crypto');
      
      // Сортируем параметры и объединяем
      const sortedParams = [clientId, timestamp.toString(), nonce, dataEncrypt].sort().join('');
      
      // Вычисляем SHA1 хеш
      const calculatedSignature = crypto.createHash('sha1').update(sortedParams).digest('hex');
      
      this.logger.log(`🔍 Проверка подписи:`);
      this.logger.log(`  Ожидаемая: ${signature}`);
      this.logger.log(`  Вычисленная: ${calculatedSignature}`);
      
      return calculatedSignature === signature;
    } catch (error) {
      this.logger.error("❌ Ошибка проверки подписи:", error);
      return false;
    }
  }

  /**
   * Расшифровка AES-192-CBC согласно документации AKOOL
   * data = AES_Decrypt(dataEncrypt, clientSecret, clientId)
   */
  private decryptAES(dataEncrypt: string, clientId: string, clientSecret: string): string {
    try {
      const crypto = require('crypto');
      
      // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Используем переменные окружения напрямую!
      // НЕ декодируем Base64, используем ключи как есть из переменных окружения
      const actualClientId = this.configService.get<string>('AKOOL_CLIENT_ID');
      const actualClientSecret = this.configService.get<string>('AKOOL_CLIENT_SECRET');
      
      this.logger.log(`🔑 Используем переменные окружения:`);
      this.logger.log(`🔑 AKOOL_CLIENT_ID: ${actualClientId}`);
      this.logger.log(`🔑 AKOOL_CLIENT_SECRET: ${actualClientSecret?.substring(0, 10)}...`);
      
      // Преобразуем в буферы
      const keyBuffer = Buffer.from(actualClientSecret, 'utf8');
      const ivBuffer = Buffer.from(actualClientId, 'utf8');
      
      this.logger.log(`🔑 Client ID (${ivBuffer.length} байт): ${ivBuffer.toString('hex')}`);
      this.logger.log(`🔑 Client Secret (${keyBuffer.length} байт): ${keyBuffer.toString('hex')}`);
      
      // Для AES-192-CBC нужен ключ 24 байта и IV 16 байт
      // Создаем ключ и IV правильной длины
      let key: Buffer;
      let iv: Buffer;
      
      if (keyBuffer.length >= 24) {
        key = keyBuffer.slice(0, 24);
      } else {
        // Дополняем ключ нулями если он короче 24 байт
        key = Buffer.alloc(24);
        keyBuffer.copy(key);
      }
      
      if (ivBuffer.length >= 16) {
        iv = ivBuffer.slice(0, 16);
      } else {
        // Дополняем IV нулями если он короче 16 байт
        iv = Buffer.alloc(16);
        ivBuffer.copy(iv);
      }
      
      this.logger.log(`🔑 Финальный ключ (${key.length} байт): ${key.toString('hex')}`);
      this.logger.log(`🔑 Финальный IV (${iv.length} байт): ${iv.toString('hex')}`);
      
      // Расшифровываем AES-192-CBC
      const decipher = crypto.createDecipheriv('aes-192-cbc', key, iv);
      let decrypted = decipher.update(dataEncrypt, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error("❌ Ошибка AES расшифровки:", error);
      throw error;
    }
  }

  /**
   * Сохранение webhook лога в БД
   */
  private async saveWebhookLog(service: string, webhookType: string, payload: any): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO webhook_logs (service, webhook_type, payload, created_at) 
         VALUES ($1, $2, $3, NOW())`,
        [service, webhookType, JSON.stringify(payload)]
      );
      this.logger.debug(`💾 Webhook лог сохранен: ${service}/${webhookType}`);
    } catch (error) {
      this.logger.error(`❌ Ошибка сохранения webhook лога:`, error);
    }
  }

  /**
   * Обновление статуса видео в БД
   */
  private async updateVideoStatus(taskId: string, status: string, resultUrl?: string, errorMessage?: string): Promise<void> {
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
  private async findVideoRequestByTaskId(taskId: string): Promise<any> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM video_requests WHERE task_id = $1',
        [taskId]
      );
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error(`❌ Ошибка поиска запроса:`, error);
      return null;
    }
  }
}
