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
      // Проверяем, что это уведомление о завершении видео
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
}
