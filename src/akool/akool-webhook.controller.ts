import { Controller, Post, Body, Logger } from "@nestjs/common";

@Controller("akool/webhook")
export class AkoolWebhookController {
  private readonly logger = new Logger(AkoolWebhookController.name);

  @Post()
  async handleWebhook(@Body() body: any) {
    this.logger.log("📥 AKOOL webhook received:", body);
    
    // Здесь можно добавить обработку webhook от AKOOL
    // Например, обновление статуса видео в базе данных
    
    return { status: "ok" };
  }
}
