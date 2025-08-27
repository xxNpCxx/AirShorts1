import { Injectable } from "@nestjs/common";
import { KeyboardsService } from "../keyboards/keyboards.service";
import { CustomLoggerService } from "../logger/logger.service";
import * as fs from "fs";
import * as path from "path";

import { Context } from "telegraf";

type TelegramContext = Context;

@Injectable()
export class MenuService {
  constructor(
    private readonly _kb: KeyboardsService,
    private readonly _logger: CustomLoggerService,
  ) {}

  async sendMainMenu(ctx: TelegramContext): Promise<void> {
    this._logger.debug(
      `Отправка главного меню пользователю ${ctx.from?.id}`,
      "MenuService",
    );

    try {
      // Сначала отправляем баннер с inline-клавиатурой
      await this.sendMainMenuBanner(ctx);

      // Затем отдельно отправляем reply-клавиатуру (разделяем клавиатуры)
      await this.sendReplyKeyboard(ctx);

      this._logger.debug(
        `Главное меню успешно отправлено пользователю ${ctx.from?.id}`,
        "MenuService",
      );
    } catch (error) {
      this._logger.error(
        `Ошибка при отправке главного меню: ${error}`,
        undefined,
        "MenuService",
      );
      throw error;
    }
  }

  /**
   * Отправляет баннер главного меню с inline-клавиатурой
   * @param ctx Telegram контекст
   */
  async sendMainMenuBanner(ctx: TelegramContext): Promise<void> {
    try {
      this._logger.debug(
        `Попытка отправить баннер главного меню пользователю: ${ctx.from?.id}`,
        "MenuService",
      );

      // Путь к баннеру - исправляем для Render.com
      const imagePath = path.join(process.cwd(), "images", "banner.jpg");
      this._logger.debug(`Путь к баннеру: ${imagePath}`, "MenuService");

      // Проверяем существование файла
      if (!fs.existsSync(imagePath)) {
        this._logger.warn(
          `Баннер banner.jpg не найден по пути: ${imagePath}`,
          "MenuService",
        );
        // Fallback: отправляем текстовое сообщение с inline-клавиатурой
        await ctx.reply(
          "🎬 ГЕНЕРАТОР ВИДЕО\n\nДобро пожаловать в генератор видео!\n\n✨ Создавайте персонализированные видео\n🎭 3D аватары с вашим голосом\n📱 Оптимизировано для коротких роликов\n🚀 Быстрая и качественная генерация",
          {
            reply_markup: this._kb.mainInline().reply_markup,
          },
        );
        return;
      }

      // Получаем размер файла для логирования
      const stats = fs.statSync(imagePath);
      this._logger.debug(
        `Размер баннера: ${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        "MenuService",
      );

      // Отправляем баннер с inline-клавиатурой
      const caption = `🎬 ГЕНЕРАТОР ВИДЕО\n\nДобро пожаловать в генератор видео!\n\n✨ Создавайте персонализированные видео\n🎭 3D аватары с вашим голосом\n📱 Оптимизировано для коротких роликов\n🚀 Быстрая и качественная генерация`;

      if (ctx.telegram && ctx.from?.id) {
        this._logger.debug(
          `Отправляю баннер с inline-клавиатурой пользователю ${ctx.from.id}`,
          "MenuService",
        );
        await ctx.telegram.sendPhoto(ctx.from.id, imagePath, {
          caption,
          parse_mode: "HTML",
          reply_markup: this._kb.mainInline().reply_markup,
        });
        this._logger.debug(
          `Баннер главного меню с inline-клавиатурой успешно отправлен пользователю ${ctx.from.id}`,
          "MenuService",
        );
      } else {
        this._logger.warn(
          "Не удалось отправить баннер: отсутствует telegram API или chat ID",
          "MenuService",
        );
        // Fallback: отправляем текстовое сообщение с inline-клавиатурой
        await ctx.reply(caption, {
          reply_markup: this._kb.mainInline().reply_markup,
        });
      }
    } catch (error) {
      this._logger.error(
        `Ошибка при отправке баннера главного меню: ${error}`,
        undefined,
        "MenuService",
      );
      this._logger.debug(
        `Детали ошибки: ${error instanceof Error ? error.stack : error}`,
        "MenuService",
      );
      // Fallback: отправляем текстовое сообщение с inline-клавиатурой
      const caption = `🎬 ГЕНЕРАТОР ВИДЕО\n\nДобро пожаловать в генератор видео!\n\n✨ Создавайте персонализированные видео\n🎭 3D аватары с вашим голосом\n📱 Оптимизировано для коротких роликов\n🚀 Быстрая и качественная генерация`;
      await ctx.reply(caption, {
        reply_markup: this._kb.mainInline().reply_markup,
      });
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
      await ctx.reply(".", {
        reply_markup: this._kb.mainReply().reply_markup,
      });
      this._logger.debug(
        `Reply-клавиатура отправлена пользователю ${ctx.from?.id}`,
        "MenuService",
      );
    } catch (error) {
      this._logger.error(
        `Ошибка при отправке reply-клавиатуры: ${error}`,
        undefined,
        "MenuService",
      );
      this._logger.debug(
        `Детали ошибки: ${error instanceof Error ? error.stack : error}`,
        "MenuService",
      );
      // Fallback: отправляем reply-клавиатуру с минимальным текстом
      await ctx.reply(".", {
        reply_markup: this._kb.mainReply().reply_markup,
      });
    }
  }
}
