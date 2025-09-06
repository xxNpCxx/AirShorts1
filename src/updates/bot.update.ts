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
import { KeyboardsService } from "../keyboards/keyboards.service";
import { CustomLoggerService } from "../logger/logger.service";
import { ProcessManagerService } from "../heygen/process-manager.service";
import { Context } from "telegraf";

@Update()
export class BotUpdate {
  constructor(
    private readonly _users: UsersService,
    private readonly _menu: MenuService,
    private readonly _kb: KeyboardsService,
    private readonly _logger: CustomLoggerService,
    private readonly _processManager: ProcessManagerService,
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
    const { MainMenuHandler } = await import("../utils/main-menu-handler");
    if (MainMenuHandler.isMainMenuMessage(messageText)) {
      this._logger.debug(
        `[@On text] Обнаружено сообщение главного меню: "${messageText}" - выход из сцены и показ главного меню`,
        "BotUpdate",
      );
      await this._users.upsertFromContext(ctx);
      await MainMenuHandler.handleMainMenuRequest(ctx, "BotUpdate-OnText");
      return;
    }

    // Проверяем, находится ли пользователь в сцене
    const sceneContext = ctx as unknown as {
      scene: { 
        current?: { id: string };
      };
    };
    
    if (sceneContext.scene?.current) {
      this._logger.debug(
        `[@On text] Пользователь ${ctx.from?.id} находится в сцене "${sceneContext.scene.current.id}", пропускаем обработку в BotUpdate`,
        "BotUpdate",
      );
      // Не обрабатываем сообщение здесь, позволяем сцене его обработать
      return;
    }

    this._logger.debug(
      `[@On text] Текстовое сообщение получено: "${messageText}" от пользователя ${ctx.from?.id} (вне сцены)`,
      "BotUpdate",
    );

    // Для других сообщений просто логируем
    this._logger.debug(
      `[@On text] Неизвестное сообщение: "${messageText}"`,
      "BotUpdate",
    );
  }

  // Обработчик для фото
  @On("photo")
  async onPhoto(@Ctx() ctx: Context) {
    this._logger.log(
      `📸 [@On photo] Фото получено от пользователя ${ctx.from?.id}`,
      "BotUpdate",
    );
    
    // Проверяем, находится ли пользователь в сцене
    const sceneContext = ctx as unknown as {
      scene: { 
        current?: { id: string };
      };
    };
    
    if (sceneContext.scene?.current) {
      this._logger.debug(
        `[@On photo] Пользователь ${ctx.from?.id} находится в сцене "${sceneContext.scene.current.id}", пропускаем обработку в BotUpdate`,
        "BotUpdate",
      );
      // Не обрабатываем сообщение здесь, позволяем сцене его обработать
      return;
    }

    // Если пользователь не в сцене, отправляем сообщение о том, что нужно начать создание видео
    await ctx.reply(
      "📸 Фото получено!\n\n" +
      "🎬 Для создания видео с этим фото нажмите кнопку 'Создать видео' в главном меню."
    );
  }

  // Обработчик для голосовых сообщений
  @On("voice")
  async onVoice(@Ctx() ctx: Context) {
    this._logger.log(
      `🎤 [@On voice] Голосовое сообщение получено от пользователя ${ctx.from?.id}`,
      "BotUpdate",
    );
    
    // Проверяем, находится ли пользователь в сцене
    const sceneContext = ctx as unknown as {
      scene: { 
        current?: { id: string };
      };
    };
    
    if (sceneContext.scene?.current) {
      this._logger.debug(
        `[@On voice] Пользователь ${ctx.from?.id} находится в сцене "${sceneContext.scene.current.id}", пропускаем обработку в BotUpdate`,
        "BotUpdate",
      );
      // Не обрабатываем сообщение здесь, позволяем сцене его обработать
      return;
    }

    // Если пользователь не в сцене, отправляем сообщение о том, что нужно начать создание видео
    await ctx.reply(
      "🎤 Голосовое сообщение получено!\n\n" +
      "📸 Для создания видео с вашим голосом сначала отправьте фото с человеком.\n\n" +
      "🎬 Нажмите кнопку 'Создать видео' в главном меню."
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
      await this._users.upsertFromContext(ctx);
      
      // Используем централизованный обработчик главного меню
      const { MainMenuHandler } = await import("../utils/main-menu-handler");
      await MainMenuHandler.handleMainMenuRequest(ctx, "BotUpdate");
      
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
      
      // Используем централизованный обработчик главного меню
      const { MainMenuHandler } = await import("../utils/main-menu-handler");
      await MainMenuHandler.handleMainMenuRequest(ctx, "BotUpdate-Action");
      
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

  @Command("status")
  async onStatus(@Ctx() ctx: Context) {
    if (!ctx.from?.id) {
      await ctx.reply("❌ Не удалось получить данные пользователя");
      return;
    }

    try {
      const userId = ctx.from.id;
      const activeProcesses = this._processManager.getActiveProcesses();
      const userProcesses = activeProcesses.filter(process => process.userId === userId);

      if (userProcesses.length === 0) {
        await ctx.reply(
          "📊 **Статус процессов**\n\n" +
          "❌ У вас нет активных процессов создания видео.\n\n" +
          "💡 Для создания видео используйте команду /start или кнопку 'Создать видео'",
          { parse_mode: "Markdown" }
        );
        return;
      }

      let message = "📊 **Активные процессы создания видео:**\n\n";
      
      for (const process of userProcesses) {
        const statusEmoji = this.getStatusEmoji(process.status);
        const statusText = this.getStatusText(process.status);
        const timeAgo = this.getTimeAgo(process.createdAt);
        
        message += `🎬 **Процесс:** \`${process.id}\`\n`;
        message += `${statusEmoji} **Статус:** ${statusText}\n`;
        message += `📝 **Сценарий:** ${process.script.substring(0, 50)}...\n`;
        message += `🎥 **Качество:** ${process.quality}\n`;
        message += `⏰ **Создан:** ${timeAgo}\n\n`;
      }

      message += "💡 **Статусы:**\n";
      message += "📸 Создание аватара из фото\n";
      message += "🎵 Клонирование голоса\n";
      message += "🎬 Генерация видео\n";
      message += "✅ Готово\n\n";
      message += "⏳ Обычно процесс занимает 2-5 минут";

      await ctx.reply(message, { parse_mode: "Markdown" });
    } catch (error) {
      this._logger.error(`Ошибка получения статуса процессов: ${error}`, undefined, "BotUpdate");
      await ctx.reply("❌ Ошибка получения статуса процессов. Попробуйте позже.");
    }
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'photo_avatar_creating': return '📸';
      case 'photo_avatar_completed': return '✅';
      case 'photo_avatar_failed': return '❌';
      case 'voice_cloning': return '🎵';
      case 'voice_clone_completed': return '✅';
      case 'voice_clone_failed': return '❌';
      case 'video_generating': return '🎬';
      case 'video_completed': return '🎉';
      case 'video_failed': return '❌';
      default: return '⏳';
    }
  }

  private getStatusText(status: string): string {
    switch (status) {
      case 'photo_avatar_creating': return 'Создание аватара из фото';
      case 'photo_avatar_completed': return 'Аватар создан';
      case 'photo_avatar_failed': return 'Ошибка создания аватара';
      case 'voice_cloning': return 'Клонирование голоса';
      case 'voice_clone_completed': return 'Голос клонирован';
      case 'voice_clone_failed': return 'Ошибка клонирования голоса';
      case 'video_generating': return 'Генерация видео';
      case 'video_completed': return 'Видео готово';
      case 'video_failed': return 'Ошибка создания видео';
      default: return 'Неизвестный статус';
    }
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ч назад`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} дн назад`;
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

  @Action("service_settings")
  async onServiceSettings(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    
    if (!ctx.from?.id) {
      await ctx.reply("❌ Ошибка получения данных пользователя");
      return;
    }

    const currentService = await this._users.getUserPreferredService(ctx.from.id);
    const serviceNames = {
      'did': '🤖 ИИ-Аватар',
      'heygen': '👤 Цифровой двойник'
    };

    const newText = `⚙️ **Настройки сервиса генерации видео**\n\n` +
      `Текущий сервис: ${serviceNames[currentService]}\n\n` +
      `🤖 **ИИ-Аватар:**\n` +
      `• Быстрая генерация\n` +
      `• Качественная синхронизация губ\n` +
      `• Поддержка клонирования голоса\n\n` +
      `👤 **Цифровой двойник:**\n` +
      `• Более реалистичные движения\n` +
      `• Профессиональное качество\n` +
      `• Расширенные возможности персонализации\n\n` +
      `Выберите предпочтительный сервис:`;

    // Проверяем, изменилось ли содержимое сообщения
    const currentText = ctx.callbackQuery?.message && 'text' in ctx.callbackQuery.message 
      ? ctx.callbackQuery.message.text 
      : '';

    if (currentText !== newText) {
      await ctx.editMessageText(newText, {
        parse_mode: "Markdown",
        reply_markup: this._kb.serviceSettings().reply_markup,
      });
    } else {
      await ctx.answerCbQuery("✅ Настройки уже актуальны!");
    }
  }

  @Action("set_service_did")
  async onSetServiceDid(@Ctx() ctx: Context) {
    await ctx.answerCbQuery("🤖 ИИ-Аватар выбран!");
    
    if (!ctx.from?.id) {
      await ctx.reply("❌ Ошибка получения данных пользователя");
      return;
    }

    const success = await this._users.setUserPreferredService(ctx.from.id, 'did');
    
    if (!success) {
      await ctx.reply("❌ Не удалось сохранить настройки. Попробуйте позже.");
      return;
    }
    
    await ctx.editMessageText(
      `✅ **Сервис успешно изменен!**\n\n` +
      `🤖 Теперь используется: **ИИ-Аватар**\n\n` +
      `Особенности:\n` +
      `• Быстрая генерация видео\n` +
      `• Качественная синхронизация губ\n` +
      `• Поддержка клонирования голоса\n` +
      `• Оптимизировано для коротких роликов\n\n` +
      `🎬 Теперь можете создавать видео!`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🎬 Создать видео", callback_data: "create_video" }],
            [{ text: "🔙 Назад в меню", callback_data: "main_menu" }],
          ]
        }
      }
    );
  }

  @Action("set_service_heygen")
  async onSetServiceHeyGen(@Ctx() ctx: Context) {
    await ctx.answerCbQuery("👤 Цифровой двойник выбран!");
    
    if (!ctx.from?.id) {
      await ctx.reply("❌ Ошибка получения данных пользователя");
      return;
    }

    const success = await this._users.setUserPreferredService(ctx.from.id, 'heygen');
    
    if (!success) {
      await ctx.reply("❌ Не удалось сохранить настройки. Попробуйте позже.");
      return;
    }
    
    await ctx.editMessageText(
      `✅ **Сервис успешно изменен!**\n\n` +
      `👤 Теперь используется: **Цифровой двойник**\n\n` +
      `Особенности:\n` +
      `• Более реалистичные движения\n` +
      `• Профессиональное качество видео\n` +
      `• Расширенные возможности персонализации\n` +
      `• Продвинутая технология создания аватаров\n\n` +
      `🎬 Теперь можете создавать видео!`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🎬 Создать видео", callback_data: "create_video" }],
            [{ text: "🔙 Назад в меню", callback_data: "main_menu" }],
          ]
        }
      }
    );
  }
}
