import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { Telegraf } from 'telegraf';
import { getBotToken } from 'nestjs-telegraf';
import { CustomLoggerService } from '../logger/logger.service';

@Controller('webhook')
export class WebhookController {
  private readonly bot: Telegraf;
  private readonly logger: CustomLoggerService;

  constructor(logger: CustomLoggerService) {
    this.logger = logger;
    // Получаем экземпляр бота
    this.bot = new Telegraf(process.env.BOT_TOKEN || '');
  }

  @Post()
  async handleWebhook(@Body() update: any, @Res() res: Response) {
    try {
      this.logger.debug(`📥 Получен webhook запрос: ${JSON.stringify(update)}`, 'WebhookController');
      
      // Обрабатываем обновление через бота
      await this.bot.handleUpdate(update);
      
      this.logger.debug('✅ Webhook обновление обработано успешно', 'WebhookController');
      res.status(HttpStatus.OK).json({ ok: true });
    } catch (error) {
      this.logger.error(`❌ Ошибка обработки webhook: ${error}`, undefined, 'WebhookController');
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  }
}
