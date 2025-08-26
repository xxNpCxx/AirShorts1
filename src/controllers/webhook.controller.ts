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
      
      // Проверяем, что это валидное обновление от Telegram
      if (!update || !update.update_id) {
        this.logger.warn('❌ Получен невалидный webhook запрос', 'WebhookController');
        return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid update format' });
      }
      
      // Обрабатываем обновление через бота
      await this.bot.handleUpdate(update);
      
      this.logger.debug('✅ Webhook обновление обработано успешно', 'WebhookController');
      return res.status(HttpStatus.OK).json({ ok: true });
    } catch (error) {
      this.logger.error(`❌ Ошибка обработки webhook: ${error}`, undefined, 'WebhookController');
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  }
}
