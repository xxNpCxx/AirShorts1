import { Controller, Post, Body, Logger, Inject } from "@nestjs/common";
import { Telegraf } from "telegraf";
import { getBotToken } from "nestjs-telegraf";

@Controller("akool/webhook")
export class AkoolWebhookController {
  private readonly logger = new Logger(AkoolWebhookController.name);

  constructor(
    @Inject(getBotToken("airshorts1_bot")) private readonly bot: Telegraf,
  ) {}

  @Post()
  async handleWebhook(@Body() body: any) {
    this.logger.log("📥 AKOOL webhook received:", body);
    
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
      
      // Проверяем и обрезаем ключ до 24 символов (требование AKOOL)
      let processedClientSecret = clientSecret;
      if (clientSecret.length > 24) {
        this.logger.warn(`⚠️ ClientSecret слишком длинный (${clientSecret.length} символов), обрезаем до 24`);
        processedClientSecret = clientSecret.substring(0, 24);
      } else if (clientSecret.length < 24) {
        throw new Error(`ClientSecret должен быть минимум 24 символа, получено: ${clientSecret.length}`);
      }
      
      // Проверяем длину IV (должен быть 16 байт)
      if (clientId.length !== 16) {
        throw new Error(`ClientId должен быть 16 байт, получено: ${clientId.length}`);
      }
      
      // Создаем ключ и IV
      const key = Buffer.from(processedClientSecret, 'utf8');
      const iv = Buffer.from(clientId, 'utf8');
      
      this.logger.log(`🔑 Ключ (${key.length} байт): ${key.toString('hex')}`);
      this.logger.log(`🔑 IV (${iv.length} байт): ${iv.toString('hex')}`);
      
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
}
