import { Injectable } from '@nestjs/common';
import { KeyboardsService } from '../keyboards/keyboards.service';
import { CustomLoggerService } from '../logger/logger.service';
import { Context } from 'telegraf';

type TelegramContext = Context;

@Injectable()
export class MenuService {
  constructor(
    private readonly _kb: KeyboardsService,
    private readonly _logger: CustomLoggerService
  ) {}

  async sendMainMenu(ctx: TelegramContext): Promise<void> {
    this._logger.debug(`Отправка главного меню пользователю ${ctx.from?.id}`, 'MenuService');

    try {
      // Отправляем текстовое сообщение с inline-клавиатурой (баннеры отключены)
      await ctx.reply(
        '🎬 ГЕНЕРАТОР ВИДЕО\n\nДобро пожаловать в генератор видео!\n\n✨ Создавайте персонализированные видео\n🎭 3D аватары с вашим голосом\n📱 Оптимизировано для коротких роликов\n🚀 Быстрая и качественная генерация',
        {
          reply_markup: this._kb.mainInline().reply_markup,
        }
      );

      // Затем отдельно отправляем reply-клавиатуру (разделяем клавиатуры)
      await this.sendReplyKeyboard(ctx);

      this._logger.debug(
        `Главное меню успешно отправлено пользователю ${ctx.from?.id}`,
        'MenuService'
      );
    } catch (error) {
      this._logger.error(`Ошибка при отправке главного меню: ${error}`, undefined, 'MenuService');
      throw error;
    }
  }

  // Шаблон не содержит экранов обменов; функции отправки картинок удалены

  /**
   * Отправляет reply-клавиатуру для навигации (отдельно от inline-клавиатуры)
   * @param ctx Telegram контекст
   */
  private async sendReplyKeyboard(ctx: TelegramContext): Promise<void> {
    try {
      // Отправляем reply-клавиатуру без баннера (баннеры отключены)
      await ctx.reply('🎬', {
        reply_markup: this._kb.mainReply().reply_markup,
      });

      this._logger.debug(`Reply-клавиатура отправлена пользователю ${ctx.from?.id}`, 'MenuService');
    } catch (error) {
      this._logger.error(
        `Ошибка при отправке reply-клавиатуры: ${error}`,
        undefined,
        'MenuService'
      );
      // Fallback: отправляем только reply-клавиатуру
      try {
        await ctx.reply('🎬', {
          reply_markup: this._kb.mainReply().reply_markup,
        });
      } catch (fallbackError) {
        this._logger.error(
          `Критическая ошибка reply-клавиатуры: ${fallbackError}`,
          undefined,
          'MenuService'
        );
      }
    }
  }
}
