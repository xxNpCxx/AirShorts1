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
import { Context } from "telegraf";

@Update()
export class BotUpdate {
  constructor(
    private readonly _users: UsersService,
    private readonly _menu: MenuService,
    private readonly _logger: CustomLoggerService,
  ) {
    this._logger.debug("BotUpdate инициализирован", "BotUpdate");
    this._logger.log("🚀 BotUpdate создан и готов к работе", "BotUpdate");
  }

  // Метод для обработки webhook обновлений
  async handleUpdate(update: any) {
    this._logger.log(`📥 [handleUpdate] Получено обновление: ${JSON.stringify(update)}`, "BotUpdate");
    
    try {
      // Проверяем тип обновления
      if (update.message && update.message.text) {
        const text = update.message.text;
        const fromId = update.message.from?.id;
        
        this._logger.log(`📝 [handleUpdate] Текст: "${text}" от пользователя ${fromId}`, "BotUpdate");
        
        // Обрабатываем команду /start
        if (text === "/start") {
          this._logger.log(`🚀 [handleUpdate] Обрабатываем команду /start`, "BotUpdate");
          
          // Создаем контекст для обработки
          const mockCtx = {
            message: update.message,
            from: update.message.from,
            reply: async (text: string) => {
              this._logger.log(`💬 [handleUpdate] Ответ: ${text}`, "BotUpdate");
              // Здесь должна быть логика отправки ответа
            }
          } as unknown as Context;
          
          // Вызываем существующий обработчик
          await this.onStart(mockCtx);
        }
      }
      
      this._logger.log(`✅ [handleUpdate] Обновление обработано успешно`, "BotUpdate");
    } catch (error) {
      this._logger.error(
        `❌ [handleUpdate] Ошибка обработки обновления: ${error}`,
        undefined,
        "BotUpdate",
      );
    }
  }

  @Start()
  async onStart(@Ctx() ctx: Context) {
    this._logger.log(
      `🚀 [@Start] Команда /start получена от пользователя ${ctx.from?.id}`,
      "BotUpdate",
    );

    // Отправляем простое сообщение для тестирования
    try {
      await ctx.reply("🎉 Бот работает! Команда /start обработана!");
      this._logger.log("✅ Тестовое сообщение отправлено", "BotUpdate");
    } catch (error) {
      this._logger.error(
        `❌ Ошибка отправки тестового сообщения: ${error}`,
        undefined,
        "BotUpdate",
      );
    }

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

  // Обработчик для всех текстовых сообщений (кроме команд)
  @On("text")
  async onText(@Ctx() ctx: Context) {
    // Проверяем, является ли сообщение командой /start
    if (ctx.message && "text" in ctx.message && ctx.message.text === "/start") {
      this._logger.log(
        `🚀 [@On text] Команда /start получена от пользователя ${ctx.from?.id}`,
        "BotUpdate",
      );
      this._logger.log(
        `📝 [@On text] Текст сообщения: "${ctx.message.text}"`,
        "BotUpdate",
      );

      // Отправляем простое сообщение для тестирования
      try {
        await ctx.reply("🎉 Бот работает! Команда /start обработана через @On text!");
        this._logger.log("✅ Тестовое сообщение отправлено через @On text", "BotUpdate");
      } catch (error) {
        this._logger.error(
          `❌ Ошибка отправки тестового сообщения через @On text: ${error}`,
          undefined,
          "BotUpdate",
        );
      }

      try {
        await this._users.upsertFromContext(ctx);
        this._logger.debug("Пользователь обновлен в базе данных", "BotUpdate");
        await this._menu.sendMainMenu(ctx);
        this._logger.debug("Главное меню отправлено", "BotUpdate");
      } catch (error) {
        this._logger.error(
          `Ошибка при обработке команды /start через @On text: ${error}`,
          undefined,
          "BotUpdate",
        );
        await ctx.reply(
          "❌ Произошла ошибка при запуске бота. Попробуйте еще раз.",
        );
      }
      return;
    }

    // Пропускаем команды - они обрабатываются отдельными декораторами
    if (ctx.message && "text" in ctx.message && ctx.message.text?.startsWith("/")) {
      this._logger.debug(
        `[@On text] Пропускаем команду: "${ctx.message.text}"`,
        "BotUpdate",
      );
      return;
    }

    this._logger.debug(
      `[@On text] Текстовое сообщение получено: "${ctx.message && "text" in ctx.message ? ctx.message.text : ""}" от пользователя ${ctx.from?.id}`,
      "BotUpdate",
    );

    // Для других сообщений просто логируем
    this._logger.debug(
      `[@On text] Неизвестное сообщение: "${ctx.message && "text" in ctx.message ? ctx.message.text : ""}"`,
      "BotUpdate",
    );
  }

  @Hears(["🏠 Главное меню", "Главное меню"])
  async onMainMenu(@Ctx() ctx: Context) {
    await this._users.upsertFromContext(ctx);
    await this._menu.sendMainMenu(ctx);
  }

  @Action("main_menu")
  async onMainMenuAction(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    await this._menu.sendMainMenu(ctx);
  }

  // Удаляем дублирующую команду operator - она уже есть в OperatorModule
  // @Command('operator') - УДАЛЕНО для предотвращения конфликтов

  @Command("myid")
  async onMyId(@Ctx() ctx: Context) {
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
  async onMyIdHears(@Ctx() ctx: Context) {
    return this.onMyId(ctx);
  }

  @Action("create_video")
  async onCreateVideo(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    await (
      ctx as unknown as {
        scene: { enter: (sceneName: string) => Promise<void> };
      }
    ).scene.enter("video-generation");
  }
}
