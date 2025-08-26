import {
  Update,
  Start,
  Ctx,
  Hears,
  Action,
  Command,
  On,
} from "nestjs-telegraf";
import { UsersService } from "../users/users.service";
import { MenuService } from "../menu/menu.service";
import { CustomLoggerService } from "../logger/logger.service";

interface TelegramContext {
  from?: {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  message?: {
    text?: string;
  };
  reply: (
    _text: string,
    _options?: { parse_mode?: string; reply_markup?: unknown },
  ) => Promise<void>;
  answerCbQuery: () => Promise<void>;
}

@Update()
export class BotUpdate {
  constructor(
    private readonly _users: UsersService,
    private readonly _menu: MenuService,
    private readonly _logger: CustomLoggerService,
  ) {
    this._logger.debug("BotUpdate инициализирован", "BotUpdate");
  }



  @Start()
  async onStart(@Ctx() ctx: TelegramContext) {
    this._logger.debug(
      `[@Start] Команда /start получена от пользователя ${ctx.from?.id}`,
      "BotUpdate",
    );
    try {
      await this._users.upsertFromContext(ctx);
      this._logger.debug("Пользователь обновлен в базе данных", "BotUpdate");
      await this._menu.sendMainMenu(ctx);
      this._logger.debug("Главное меню отправлено", "BotUpdate");
    } catch (error) {
      this._logger.error(
        `Ошибка при обработке команды /start: ${error}`,
        undefined,
        "BotUpdate",
      );
      await ctx.reply(
        "❌ Произошла ошибка при запуске бота. Попробуйте еще раз.",
      );
    }
  }

  // Обработчик для всех текстовых сообщений (для отладки)
  @On("text")
  async onText(@Ctx() ctx: TelegramContext) {
    this._logger.debug(
      `[@On text] Текстовое сообщение получено: "${ctx.message?.text}" от пользователя ${ctx.from?.id}`,
      "BotUpdate",
    );

    // Для других сообщений просто логируем
    this._logger.debug(
      `[@On text] Неизвестное сообщение: "${ctx.message?.text}"`,
      "BotUpdate",
    );
  }

  @Hears(["🏠 Главное меню", "Главное меню"])
  async onMainMenu(@Ctx() ctx: TelegramContext) {
    await this._users.upsertFromContext(ctx);
    await this._menu.sendMainMenu(ctx);
  }

  @Action("main_menu")
  async onMainMenuAction(@Ctx() ctx: TelegramContext) {
    await ctx.answerCbQuery();
    await this._menu.sendMainMenu(ctx);
  }

  // Удаляем дублирующую команду operator - она уже есть в OperatorModule
  // @Command('operator') - УДАЛЕНО для предотвращения конфликтов

  @Command("myid")
  async onMyId(@Ctx() ctx: TelegramContext) {
    if (!ctx.from) {
      await ctx.reply("❌ Не удалось получить данные пользователя");
      return;
    }
    const userId = ctx.from.id;
    const username = ctx.from.username || "не задан";
    const firstName = ctx.from.first_name || "";
    const lastName = ctx.from.last_name || "";
    const message =
      `🆔 Ваши данные:\n\n` +
      `📱 Chat ID: \`${userId}\`\n` +
      `👤 Username: @${username}\n` +
      `📝 Имя: ${firstName} ${lastName}\n\n` +
      `💡 Для копирования Chat ID выделите число выше`;
    await ctx.reply(message, { parse_mode: "Markdown" });
  }

  // Вариант без слеша, чтобы не дублировать с @Command('myid')
  @Hears(/^myid$/i)
  async onMyIdHears(@Ctx() ctx: TelegramContext) {
    return this.onMyId(ctx);
  }

  @Action("create_video")
  async onCreateVideo(@Ctx() ctx: TelegramContext) {
    await ctx.answerCbQuery();
    await (
      ctx as unknown as {
        scene: { enter: (sceneName: string) => Promise<void> };
      }
    ).scene.enter("video-generation");
  }
}
