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
          
          // Обрабатываем расшифрованные данные
          if (decryptedData.video_status === 2) { // 2 = завершено
            const { video_id, video, task_id } = decryptedData;
            this.logger.log(`🎉 Видео готово! ID: ${video_id}, URL: ${video}`);
            
            if (video) {
              await this.sendVideoToUser(video, task_id);
            }
          } else if (decryptedData.video_status === 3) { // 3 = ошибка
            const { task_id } = decryptedData;
            this.logger.error(`❌ Ошибка создания видео для задачи: ${task_id}`);
            await this.notifyUserError(task_id);
          } else {
            this.logger.log(`⏳ Статус видео: ${decryptedData.video_status} (обработка)`);
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
   * Попытка расшифровки webhook данных от AKOOL
   */
  private async decryptWebhookData(body: any): Promise<any> {
    try {
      // Попробуем разные методы расшифровки
      const { dataEncrypt, signature, timestamp, nonce } = body;
      
      this.logger.log("🔍 Пытаемся расшифровать данные...");
      this.logger.log(`📊 Signature: ${signature}`);
      this.logger.log(`⏰ Timestamp: ${timestamp}`);
      this.logger.log(`🔢 Nonce: ${nonce}`);
      
      // Получаем ключ расшифровки из переменных окружения
      const webhookSecret = process.env.AKOOL_WEBHOOK_SECRET;
      const clientSecret = process.env.AKOOL_CLIENT_SECRET;
      
      // Пробуем разные ключи
      const keysToTry = [
        { name: "AKOOL_WEBHOOK_SECRET", key: webhookSecret },
        { name: "AKOOL_CLIENT_SECRET", key: clientSecret },
        { name: "Signature as key", key: signature }
      ];
      
      for (const keyInfo of keysToTry) {
        if (keyInfo.key) {
          this.logger.log(`🔑 Пробуем ключ: ${keyInfo.name}`);
        
          // Метод 1: AES расшифровка
          try {
            const crypto = require('crypto');
            const key = Buffer.from(keyInfo.key, 'hex');
            const iv = Buffer.from(nonce, 'hex');
            
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
            let decrypted = decipher.update(dataEncrypt, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            
            this.logger.log(`✅ AES расшифровка с ${keyInfo.name} успешна:`, decrypted);
            return JSON.parse(decrypted);
          } catch (aesError) {
            this.logger.debug(`❌ AES расшифровка с ${keyInfo.name} не удалась:`, aesError.message);
          }
          
          // Метод 2: XOR расшифровка
          try {
            const dataBuffer = Buffer.from(dataEncrypt, 'base64');
            const keyBuffer = Buffer.from(keyInfo.key, 'hex');
            const decrypted = Buffer.alloc(dataBuffer.length);
            
            for (let i = 0; i < dataBuffer.length; i++) {
              decrypted[i] = dataBuffer[i] ^ keyBuffer[i % keyBuffer.length];
            }
            
            const result = decrypted.toString('utf8');
            this.logger.log(`✅ XOR расшифровка с ${keyInfo.name} успешна:`, result);
            return JSON.parse(result);
          } catch (xorError) {
            this.logger.debug(`❌ XOR расшифровка с ${keyInfo.name} не удалась:`, xorError.message);
          }
          
          // Метод 3: Простое XOR с ключом как строкой
          try {
            const dataBuffer = Buffer.from(dataEncrypt, 'base64');
            const keyBuffer = Buffer.from(keyInfo.key, 'utf8');
            const decrypted = Buffer.alloc(dataBuffer.length);
            
            for (let i = 0; i < dataBuffer.length; i++) {
              decrypted[i] = dataBuffer[i] ^ keyBuffer[i % keyBuffer.length];
            }
            
            const result = decrypted.toString('utf8');
            this.logger.log(`✅ String XOR расшифровка с ${keyInfo.name} успешна:`, result);
            return JSON.parse(result);
          } catch (stringXorError) {
            this.logger.debug(`❌ String XOR расшифровка с ${keyInfo.name} не удалась:`, stringXorError.message);
          }
        }
      }
      
      this.logger.warn("⚠️ Ни один ключ не найден в переменных окружения");
      this.logger.log("💡 Добавьте AKOOL_CLIENT_SECRET в .env файл");
      
      // Fallback: старые методы без ключа
      this.logger.log("🔄 Пробуем fallback методы...");
      
      // Метод 3: Base64 декодирование
      try {
        const base64Decoded = Buffer.from(dataEncrypt, 'base64').toString('utf-8');
        this.logger.log("🔓 Base64 декодирование:", base64Decoded);
        
        // Попробуем парсить как JSON
        const jsonData = JSON.parse(base64Decoded);
        this.logger.log("✅ JSON парсинг успешен:", jsonData);
        return jsonData;
      } catch (base64Error) {
        this.logger.debug("❌ Base64 декодирование не удалось:", base64Error.message);
      }
      
      // Метод 4: Простое XOR с nonce
      try {
        const dataBuffer = Buffer.from(dataEncrypt, 'base64');
        const nonceBuffer = Buffer.from(nonce, 'hex');
        const decrypted = Buffer.alloc(dataBuffer.length);
        
        for (let i = 0; i < dataBuffer.length; i++) {
          decrypted[i] = dataBuffer[i] ^ nonceBuffer[i % nonceBuffer.length];
        }
        
        const result = decrypted.toString('utf8');
        this.logger.log("✅ XOR расшифровка успешна:", result);
        return JSON.parse(result);
      } catch (xorError) {
        this.logger.debug("❌ XOR расшифровка не удалась:", xorError.message);
      }
      
      throw new Error("Все методы расшифровки не удались. Нужен AKOOL_WEBHOOK_SECRET");
      
    } catch (error) {
      this.logger.error("❌ Ошибка расшифровки webhook данных:", error);
      throw error;
    }
  }
}
