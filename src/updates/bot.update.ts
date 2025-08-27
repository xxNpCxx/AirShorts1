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
    const messageText = ctx.message && "text" in ctx.message ? ctx.message.text : "";

    // Проверяем, является ли сообщение командой /start
    if (messageText === "/start") {
      this._logger.log(
        `🚀 [@On text] Команда /start получена от пользователя ${ctx.from?.id}`,
        "BotUpdate",
      );
      this._logger.log(
        `📝 [@On text] Текст сообщения: "${messageText}"`,
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
    if (messageText?.startsWith("/")) {
      this._logger.debug(
        `[@On text] Пропускаем команду: "${messageText}"`,
        "BotUpdate",
      );
      return;
    }

    // Обрабатываем сообщения главного меню напрямую
    const hearsMessages = ["🏠 Главное меню", "Главное меню"];
    if (hearsMessages.includes(messageText)) {
      this._logger.debug(
        `[@On text] Обнаружено сообщение главного меню: "${messageText}" - выход из сцены и показ главного меню`,
        "BotUpdate",
      );
      await this.onMainMenu(ctx);
      return;
    }

    this._logger.debug(
      `[@On text] Текстовое сообщение получено: "${messageText}" от пользователя ${ctx.from?.id}`,
      "BotUpdate",
    );

    // Для других сообщений просто логируем
    this._logger.debug(
      `[@On text] Неизвестное сообщение: "${messageText}"`,
      "BotUpdate",
    );
  }

  @Hears(["🏠 Главное меню", "Главное меню"])
  async onMainMenu(@Ctx() ctx: Context) {
    const messageText = ctx.message && "text" in ctx.message ? ctx.message.text : "";
    this._logger.log(
      `🏠 [@Hears] Главное меню запрошено пользователем ${ctx.from?.id}, текст: "${messageText}"`,
      "BotUpdate",
    );
    
    try {
      // Проверяем, находится ли пользователь в сцене
      const sceneContext = ctx as unknown as {
        scene: { 
          current?: { id: string };
          leave: () => Promise<void>;
        };
      };
      
      if (sceneContext.scene?.current) {
        this._logger.log(
          `🚪 Выходим из сцены "${sceneContext.scene.current.id}" для пользователя ${ctx.from?.id}`,
          "BotUpdate",
        );
        await sceneContext.scene.leave();
        this._logger.debug("Сцена успешно завершена", "BotUpdate");
      }

      await this._users.upsertFromContext(ctx);
      await this._menu.sendMainMenu(ctx);
      this._logger.debug("Главное меню отправлено через @Hears", "BotUpdate");
    } catch (error) {
      this._logger.error(
        `❌ Ошибка при обработке главного меню: ${error}`,
        undefined,
        "BotUpdate",
      );
      await ctx.reply("❌ Произошла ошибка при загрузке главного меню");
    }
  }

  @Action("main_menu")
  async onMainMenuAction(@Ctx() ctx: Context) {
    this._logger.log(
      `🏠 [@Action] Главное меню запрошено через inline кнопку пользователем ${ctx.from?.id}`,
      "BotUpdate",
    );
    
    try {
      await ctx.answerCbQuery();
      
      // Проверяем, находится ли пользователь в сцене
      const sceneContext = ctx as unknown as {
        scene: { 
          current?: { id: string };
          leave: () => Promise<void>;
        };
      };
      
      if (sceneContext.scene?.current) {
        this._logger.log(
          `🚪 Выходим из сцены "${sceneContext.scene.current.id}" для пользователя ${ctx.from?.id}`,
          "BotUpdate",
        );
        await sceneContext.scene.leave();
        this._logger.debug("Сцена успешно завершена через @Action", "BotUpdate");
      }
      
      await this._menu.sendMainMenu(ctx);
      this._logger.debug("Главное меню отправлено через @Action", "BotUpdate");
    } catch (error) {
      this._logger.error(
        `❌ Ошибка при обработке главного меню через @Action: ${error}`,
        undefined,
        "BotUpdate",
      );
      await ctx.answerCbQuery("❌ Произошла ошибка");
    }
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
