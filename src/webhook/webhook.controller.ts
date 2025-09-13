import { Controller, Post, Body, Res, HttpStatus, Inject } from '@nestjs/common';
import { Response } from 'express';
import { CustomLoggerService } from '../logger/logger.service';
import { Telegraf } from 'telegraf';
import { getBotToken } from 'nestjs-telegraf';

@Controller('webhook')
export class WebhookController {
  constructor(
    private readonly logger: CustomLoggerService,
    @Inject(getBotToken('airshorts1_bot')) private readonly bot: Telegraf
  ) {}

  @Post()
  async handleWebhook(@Body() update: any, @Res() res: Response) {
    try {
      this.logger.log(`📥 Webhook получен: update_id=${update.update_id}`, 'WebhookController');

      if (update.message?.text) {
        this.logger.log(
          `📝 Сообщение: "${update.message.text}" от пользователя ${update.message.from?.id}`,
          'WebhookController'
        );
      }

      // Передаем обновление в Telegraf для обработки
      await this.bot.handleUpdate(update);

      this.logger.log(`✅ Webhook обработан успешно`, 'WebhookController');

      res.status(HttpStatus.OK).json({ ok: true });
    } catch (error) {
      this.logger.error(
        `❌ Ошибка обработки webhook: ${error}`,
        error instanceof Error ? error.stack : undefined,
        'WebhookController'
      );

      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        ok: false,
        error: 'Internal server error',
      });
    }
  }
}
