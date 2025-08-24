import { Injectable } from '@nestjs/common';
import { KeyboardsService } from '../keyboards/keyboards.service';
import { SettingsService } from '../settings/settings.service';
import * as fs from 'fs';
import * as path from 'path';

interface TelegramContext {
  from?: {
    id: number;
  };
  reply: (text: string, options?: { reply_markup?: unknown }) => Promise<void>;
  telegram?: {
    sendPhoto: (chatId: number, photo: any, options?: any) => Promise<any>;
  };
}

@Injectable()
export class MenuService {
  constructor(private readonly _kb: KeyboardsService, private readonly _settings: SettingsService) {}

  async sendMainMenu(ctx: TelegramContext): Promise<void> {
    // В шаблоне без бизнес-ролей просто отправляем баннер и клавиатуры
    const isOperator = false;
    const isAdmin = false;

    // Сначала отправляем баннер с inline-клавиатурой
    await this.sendMainMenuBanner(ctx, isOperator, isAdmin);
    
    // Затем отдельно отправляем reply-клавиатуру (разделяем клавиатуры)
    await this.sendReplyKeyboard(ctx);
  }

  /**
   * Отправляет баннер главного меню с inline-клавиатурой
   * @param ctx Telegram контекст
   * @param isOperator Является ли пользователь оператором
   * @param isAdmin Является ли пользователь администратором
   */
  async sendMainMenuBanner(ctx: TelegramContext, isOperator: boolean, isAdmin: boolean): Promise<void> {
    try {
      console.log(`[MenuService] Попытка отправить баннер главного меню пользователю: ${ctx.from?.id}`);
      
      // Путь к баннеру - исправляем для Render.com
      const imagePath = path.join(process.cwd(), 'images', 'banner.jpg');
      console.log(`[MenuService] Путь к баннеру: ${imagePath}`);
      
      // Проверяем существование файла
      if (!fs.existsSync(imagePath)) {
        console.warn(`[MenuService] Баннер banner.jpg не найден по пути: ${imagePath}`);
        // Fallback: отправляем текстовое сообщение с inline-клавиатурой
        await ctx.reply('🏦 ОБМЕН ВАЛЮТ\n\nДобро пожаловать в надежный обменник криптовалют!\n\n💎 Покупайте BTC и LTC\n💰 Выгодные курсы\n🔒 Безопасные сделки\n👥 Реферальная программа', {
          reply_markup: this._kb.mainInline().reply_markup
        });
        return;
      }

      // Получаем размер файла для логирования
      const stats = fs.statSync(imagePath);
      console.log(`[MenuService] Размер баннера: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

      // Отправляем баннер с inline-клавиатурой
      const caption = `Добро пожаловать!`;
      
      if (ctx.telegram && ctx.from?.id) {
        console.log(`[MenuService] Отправляю баннер с inline-клавиатурой пользователю ${ctx.from.id}`);
        await ctx.telegram.sendPhoto(ctx.from.id, { source: imagePath }, {
          caption,
          parse_mode: 'HTML',
          reply_markup: this._kb.mainInline().reply_markup
        });
        console.log(`[MenuService] Баннер главного меню с inline-клавиатурой успешно отправлен пользователю ${ctx.from.id}`);
      } else {
        console.warn('[MenuService] Не удалось отправить баннер: отсутствует telegram API или chat ID');
        // Fallback: отправляем текстовое сообщение с inline-клавиатурой
        await ctx.reply(caption, { reply_markup: this._kb.mainInline().reply_markup });
      }
    } catch (error) {
      console.error('[MenuService] Ошибка при отправке баннера главного меню:', error);
      console.error('[MenuService] Детали ошибки:', error instanceof Error ? error.stack : error);
      // Fallback: отправляем текстовое сообщение с inline-клавиатурой
      const caption = `Добро пожаловать!`;
      await ctx.reply(caption, { reply_markup: this._kb.mainInline().reply_markup });
    }
  }

  // Шаблон не содержит экранов обменов; функции отправки картинок удалены

  /**
   * Отправляет reply-клавиатуру для навигации (отдельно от inline-клавиатуры)
   * @param ctx Telegram контекст
   * @param isOperator Является ли пользователь оператором
   * @param isAdmin Является ли пользователь администратором
   */
  private async sendReplyKeyboard(ctx: TelegramContext): Promise<void> {
    try {
      // Отправляем reply-клавиатуру с минимальным текстом
      await ctx.reply('⌨️', { reply_markup: this._kb.mainReply().reply_markup });
      console.log(`[MenuService] Reply-клавиатура отправлена пользователю ${ctx.from?.id}`);
    } catch (error) {
      console.error('[MenuService] Ошибка при отправке reply-клавиатуры:', error);
      console.error('[MenuService] Детали ошибки:', error instanceof Error ? error.stack : error);
      // Fallback: отправляем reply-клавиатуру с минимальным текстом
      await ctx.reply('⌨️', { reply_markup: this._kb.mainReply().reply_markup });
    }
  }
}


