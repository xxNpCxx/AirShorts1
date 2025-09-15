import { Controller, Post, Body, Res, HttpStatus, Inject } from '@nestjs/common';
import { Response } from 'express';
import { CustomLoggerService } from '../logger/logger.service';
import { Telegraf } from 'telegraf';
import { getBotToken } from 'nestjs-telegraf';
import { TelegramUpdate } from '../types';
import { isTelegramUpdate } from '../utils/type-guards';
import { UsersService } from '../users/users.service';

@Controller('webhook')
export class WebhookController {
  constructor(
    private readonly logger: CustomLoggerService,
    @Inject(getBotToken('airshorts1_bot')) private readonly bot: Telegraf,
    private readonly usersService: UsersService
  ) {}

  @Post()
  async handleWebhook(@Body() update: unknown, @Res() res: Response) {
    try {
      // Проверяем, что данные не пустые
      const isUpdateIsNull = update === null;
      const isUpdateIsUndefined = update === undefined;
      const isUpdateIsObject = typeof update === 'object';
      const isUpdateIsEmptyObject =
        isUpdateIsObject === true && Object.keys(update as object).length === 0;
      const isUpdateEmpty =
        isUpdateIsNull === true || isUpdateIsUndefined === true || isUpdateIsEmptyObject === true;
      if (isUpdateEmpty === true) {
        this.logger.warn('⚠️ Empty webhook received', 'WebhookController');
        res.status(HttpStatus.BAD_REQUEST).json({
          ok: false,
          error: 'Empty webhook data',
        });
        return;
      }

      // Логируем входящие данные для отладки
      this.logger.debug(
        `📥 Webhook received: ${JSON.stringify(update, null, 2)}`,
        'WebhookController'
      );

      // Валидация входящих данных
      const isTelegramUpdateValid = isTelegramUpdate(update) === true;
      if (isTelegramUpdateValid === false) {
        // Всегда логируем детали при ошибке валидации
        console.log('=== WEBHOOK VALIDATION ERROR ===');
        console.log('Received data:', JSON.stringify(update, null, 2));
        console.log('Data type:', typeof update);
        console.log('Is object:', typeof update === 'object');
        console.log('Is null:', update === null);
        console.log(
          'Has update_id:',
          update && typeof update === 'object' && 'update_id' in update
        );
        console.log(
          'update_id type:',
          update && typeof update === 'object' ? typeof (update as any).update_id : 'N/A'
        );
        console.log(
          'update_id value:',
          update && typeof update === 'object' ? (update as any).update_id : 'N/A'
        );
        console.log('================================');

        this.logger.error(
          `❌ Invalid Telegram update received. Data: ${JSON.stringify(update, null, 2)}`,
          undefined,
          'WebhookController'
        );
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

      const isHasMessageText =
        update.message !== undefined &&
        update.message !== null &&
        update.message.text !== undefined &&
        update.message.text !== null;
      const isHasCallbackData =
        update.callback_query !== undefined &&
        update.callback_query !== null &&
        update.callback_query.data !== undefined &&
        update.callback_query.data !== null;
      const isHasInlineQuery =
        update.inline_query !== undefined &&
        update.inline_query !== null &&
        update.inline_query.query !== undefined &&
        update.inline_query.query !== null;

      if (isHasMessageText === true) {
        this.logger.log(
          `📝 Сообщение: "${update.message.text}" от пользователя ${update.message.from?.id}`,
          'WebhookController'
        );
      } else if (isHasCallbackData === true) {
        this.logger.log(
          `🔘 Callback query: "${update.callback_query.data}" от пользователя ${update.callback_query.from?.id}`,
          'WebhookController'
        );
      } else if (isHasInlineQuery === true) {
        this.logger.log(
          `🔍 Inline query: "${update.inline_query.query}" от пользователя ${update.inline_query.from?.id}`,
          'WebhookController'
        );
      }

      // Автоматически добавляем пользователя в базу данных
      await this.ensureUserInDatabase(update);

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

  /**
   * Автоматически добавляет пользователя в базу данных при получении webhook'а
   * Если пользователь уже существует, обновляет его данные
   */
  private async ensureUserInDatabase(update: TelegramUpdate): Promise<void> {
    try {
      // Извлекаем информацию о пользователе из различных типов обновлений
      let user = null;

      if (update.message?.from) {
        user = update.message.from;
      } else if (update.callback_query?.from) {
        user = update.callback_query.from;
      } else if (update.inline_query?.from) {
        user = update.inline_query.from;
      } else if (update.chosen_inline_result?.from) {
        user = update.chosen_inline_result.from;
      } else if (update.shipping_query?.from) {
        user = update.shipping_query.from;
      } else if (update.pre_checkout_query?.from) {
        user = update.pre_checkout_query.from;
      } else if (update.poll_answer?.user) {
        user = update.poll_answer.user;
      } else if (update.my_chat_member?.from) {
        user = update.my_chat_member.from;
      } else if (update.chat_member?.from) {
        user = update.chat_member.from;
      } else if (update.chat_join_request?.from) {
        user = update.chat_join_request.from;
      }

      // Если пользователь найден, добавляем/обновляем его в базе данных
      if (user) {
        const isNewUser = await this.usersService.upsertFromContext({
          from: user,
        } as any);

        if (isNewUser) {
          this.logger.log(
            `👤 Новый пользователь добавлен в базу: ${user.id} (@${user.username || 'без username'})`,
            'WebhookController'
          );
        } else {
          this.logger.debug(`👤 Пользователь обновлен в базе: ${user.id}`, 'WebhookController');
        }
      } else {
        this.logger.debug('👤 Пользователь не найден в webhook', 'WebhookController');
      }
    } catch (error) {
      this.logger.error(
        `❌ Ошибка при добавлении пользователя в базу: ${error}`,
        error instanceof Error ? error.stack : undefined,
        'WebhookController'
      );
      // Не прерываем обработку webhook'а из-за ошибки добавления пользователя
    }
  }
}
