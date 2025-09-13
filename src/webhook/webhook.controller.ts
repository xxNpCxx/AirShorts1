import { Controller, Post, Body, Res, HttpStatus, Inject } from '@nestjs/common';
import { Response } from 'express';
import { CustomLoggerService } from '../logger/logger.service';
import { Telegraf } from 'telegraf';
import { getBotToken } from 'nestjs-telegraf';
import { TelegramUpdate } from '../types';
import { isTelegramUpdate } from '../utils/type-guards';

@Controller('webhook')
export class WebhookController {
  constructor(
    private readonly logger: CustomLoggerService,
    @Inject(getBotToken('airshorts1_bot')) private readonly bot: Telegraf
  ) {}

  @Post()
  async handleWebhook(@Body() update: unknown, @Res() res: Response) {
    try {
      // Валидация входящих данных
      if (!isTelegramUpdate(update)) {
        this.logger.error('❌ Invalid Telegram update received', undefined, 'WebhookController');
        res.status(HttpStatus.BAD_REQUEST).json({
          ok: false,
          error: 'Invalid Telegram update format',
        });
        return;
      }

      this.logger.log(`📥 Webhook получен: update_id=${update.update_id}`, 'WebhookController');

      if (update.message?.text) {
        this.logger.log(
          `📝 Сообщение: "${update.message.text}" от пользователя ${update.message.from?.id}`,
          'WebhookController'
        );
      }

      // Передаем обновление в Telegraf для обработки
      // Приводим к типу Update для совместимости с Telegraf API
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await this.bot.handleUpdate(update as any);

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
