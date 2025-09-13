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
      // Проверяем, что данные не пустые
      if (!update || (typeof update === 'object' && Object.keys(update).length === 0)) {
        this.logger.warn('⚠️ Empty webhook received', 'WebhookController');
        res.status(HttpStatus.BAD_REQUEST).json({
          ok: false,
          error: 'Empty webhook data',
        });
        return;
      }

      // Логируем входящие данные для отладки
      this.logger.debug(`📥 Webhook received: ${JSON.stringify(update, null, 2)}`, 'WebhookController');
      
      // Валидация входящих данных
      if (!isTelegramUpdate(update)) {
        // Всегда логируем детали при ошибке валидации
        console.log('=== WEBHOOK VALIDATION ERROR ===');
        console.log('Received data:', JSON.stringify(update, null, 2));
        console.log('Data type:', typeof update);
        console.log('Is object:', typeof update === 'object');
        console.log('Is null:', update === null);
        console.log('Has update_id:', update && typeof update === 'object' && 'update_id' in update);
        console.log('update_id type:', update && typeof update === 'object' ? typeof (update as any).update_id : 'N/A');
        console.log('update_id value:', update && typeof update === 'object' ? (update as any).update_id : 'N/A');
        console.log('================================');
        
        this.logger.error(`❌ Invalid Telegram update received. Data: ${JSON.stringify(update, null, 2)}`, undefined, 'WebhookController');
        res.status(HttpStatus.BAD_REQUEST).json({
          ok: false,
          error: 'Invalid Telegram update format',
        });
        return;
      }

      this.logger.log(`📥 Webhook получен: update_id=${update.update_id}`, 'WebhookController');

      // Логируем тип обновления
      const updateType = this.getUpdateType(update);
      this.logger.log(`📋 Тип обновления: ${updateType}`, 'WebhookController');

      if (update.message?.text) {
        this.logger.log(
          `📝 Сообщение: "${update.message.text}" от пользователя ${update.message.from?.id}`,
          'WebhookController'
        );
      } else if (update.callback_query?.data) {
        this.logger.log(
          `🔘 Callback query: "${update.callback_query.data}" от пользователя ${update.callback_query.from?.id}`,
          'WebhookController'
        );
      } else if (update.inline_query?.query) {
        this.logger.log(
          `🔍 Inline query: "${update.inline_query.query}" от пользователя ${update.inline_query.from?.id}`,
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

  private getUpdateType(update: TelegramUpdate): string {
    if (update.message) return 'message';
    if (update.callback_query) return 'callback_query';
    if (update.inline_query) return 'inline_query';
    if (update.chosen_inline_result) return 'chosen_inline_result';
    if (update.channel_post) return 'channel_post';
    if (update.edited_message) return 'edited_message';
    if (update.edited_channel_post) return 'edited_channel_post';
    if (update.shipping_query) return 'shipping_query';
    if (update.pre_checkout_query) return 'pre_checkout_query';
    if (update.poll) return 'poll';
    if (update.poll_answer) return 'poll_answer';
    if (update.my_chat_member) return 'my_chat_member';
    if (update.chat_member) return 'chat_member';
    if (update.chat_join_request) return 'chat_join_request';
    return 'unknown';
  }
}
