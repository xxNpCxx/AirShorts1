import { Update, Start, Ctx, Hears, Action, Command, On } from 'nestjs-telegraf';
import { UsersService } from '../users/users.service';
import { MenuService } from '../menu/menu.service';
import { KeyboardsService } from '../keyboards/keyboards.service';
import { ReferralsService } from '../referrals/referrals.service';
import { CustomLoggerService } from '../logger/logger.service';
import { Context } from 'telegraf';

@Update()
export class BotUpdate {
  constructor(
    private readonly _users: UsersService,
    private readonly _menu: MenuService,
    private readonly _kb: KeyboardsService,
    private readonly _referrals: ReferralsService,
    private readonly _logger: CustomLoggerService
  ) {
    this._logger.debug('BotUpdate инициализирован', 'BotUpdate');
    this._logger.log('🚀 BotUpdate создан и готов к работе', 'BotUpdate');
  }

  @Start()
  async onStart(@Ctx() ctx: Context) {
    const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text : '';

    this._logger.log(
      `🚀 [@Start] Команда /start получена от пользователя ${ctx.from?.id}`,
      'BotUpdate'
    );

    // Проверяем, есть ли реферальный код в команде /start
    const referralMatch = messageText?.match(/\/start ref_(.+)/);
    const isReferralMatch = referralMatch !== null && referralMatch !== undefined;
    if (isReferralMatch === true) {
      const referrerCode = referralMatch[1];
      this._logger.log(
        `🔗 Реферальная регистрация: код ${referrerCode} от пользователя ${ctx.from?.id}`,
        'BotUpdate'
      );

      try {
        // Сначала обновляем пользователя в базе данных
        await this._users.upsertFromContext(ctx);

        // Получаем ID пользователя из базы данных
        const userResult = await this.getUserFromDatabase(ctx.from.id);
        const isUserResultAbsent = userResult === null || userResult === undefined;
        if (isUserResultAbsent === true) {
          await ctx.reply('❌ Ошибка регистрации. Попробуйте еще раз.');
          return;
        }

        // Обрабатываем реферальную регистрацию
        const result = await this._referrals.processReferralRegistration(
          referrerCode,
          userResult.id
        );

        const isReferralCreated = result.referral !== null && result.referral !== undefined;
        if (isReferralCreated === true) {
          await ctx.reply(
            '🎉 Добро пожаловать!\n\n' +
              '✅ Вы успешно зарегистрированы по реферальной ссылке!\n' +
              '💰 Теперь ваш пригласивший будет получать бонусы с ваших покупок.'
          );
        } else {
          await ctx.reply(
            '🎉 Добро пожаловать!\n\n' +
              '⚠️ Реферальная ссылка недействительна, но вы можете зарегистрироваться обычным способом.'
          );
        }
      } catch (error) {
        this._logger.error('Ошибка обработки реферальной регистрации:', error);
        await ctx.reply('❌ Ошибка регистрации. Попробуйте еще раз.');
      }
    }

    // Отправляем простое сообщение для тестирования
    try {
      await ctx.reply('🎉 Бот работает! Команда /start обработана!');
      this._logger.log('✅ Тестовое сообщение отправлено', 'BotUpdate');
    } catch (error) {
      this._logger.error(
        `❌ Ошибка отправки тестового сообщения: ${error}`,
        undefined,
        'BotUpdate'
      );
    }

    try {
      await this._users.upsertFromContext(ctx);
      this._logger.debug('Пользователь обновлен в базе данных', 'BotUpdate');
      await this._menu.sendMainMenu(ctx);
      this._logger.debug('Главное меню отправлено', 'BotUpdate');
    } catch (error) {
      this._logger.error(`Ошибка при обработке команды /start: ${error}`, undefined, 'BotUpdate');
      await ctx.reply('❌ Произошла ошибка при запуске бота. Попробуйте еще раз.');
    }
  }

  // Обработчик для всех текстовых сообщений (кроме команд)
  @On('text')
  async onText(@Ctx() ctx: Context) {
    const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text : '';

    // Проверяем, является ли сообщение командой /start
    if (messageText === '/start') {
      this._logger.log(
        `🚀 [@On text] Команда /start получена от пользователя ${ctx.from?.id}`,
        'BotUpdate'
      );
      this._logger.log(`📝 [@On text] Текст сообщения: "${messageText}"`, 'BotUpdate');

      // Отправляем простое сообщение для тестирования
      try {
        await ctx.reply('🎉 Бот работает! Команда /start обработана через @On text!');
        this._logger.log('✅ Тестовое сообщение отправлено через @On text', 'BotUpdate');
      } catch (error) {
        this._logger.error(
          `❌ Ошибка отправки тестового сообщения через @On text: ${error}`,
          undefined,
          'BotUpdate'
        );
      }

      try {
        await this._users.upsertFromContext(ctx);
        this._logger.debug('Пользователь обновлен в базе данных', 'BotUpdate');
        await this._menu.sendMainMenu(ctx);
        this._logger.debug('Главное меню отправлено', 'BotUpdate');
      } catch (error) {
        this._logger.error(
          `Ошибка при обработке команды /start через @On text: ${error}`,
          undefined,
          'BotUpdate'
        );
        await ctx.reply('❌ Произошла ошибка при запуске бота. Попробуйте еще раз.');
      }
      return;
    }

    // Пропускаем команды - они обрабатываются отдельными декораторами
    const isCommand =
      messageText !== undefined && messageText !== null && messageText.startsWith('/') === true;
    if (isCommand === true) {
      this._logger.debug(`[@On text] Пропускаем команду: "${messageText}"`, 'BotUpdate');
      return;
    }

    // Обрабатываем сообщения главного меню напрямую - ПРИНУДИТЕЛЬНО выходим из всех сцен
    const { MainMenuHandler } = await import('../utils/main-menu-handler');
    const isMainMenuMessage = MainMenuHandler.isMainMenuMessage(messageText) === true;
    if (isMainMenuMessage === true) {
      this._logger.debug(
        `[@On text] Обнаружено сообщение главного меню: "${messageText}" - ПРИНУДИТЕЛЬНЫЙ выход из сцены и показ главного меню`,
        'BotUpdate'
      );

      // ПРИНУДИТЕЛЬНО выходим из сцены (если есть)
      const sceneContext = ctx as unknown as {
        scene: {
          current?: { id: string };
          leave: () => Promise<void>;
        };
      };

      const isInScene =
        sceneContext.scene !== undefined &&
        sceneContext.scene !== null &&
        sceneContext.scene.current !== undefined &&
        sceneContext.scene.current !== null;
      if (isInScene === true) {
        this._logger.debug(
          `[@On text] ПРИНУДИТЕЛЬНО выходим из сцены: "${sceneContext.scene.current.id}"`,
          'BotUpdate'
        );
        await sceneContext.scene.leave();
      }

      // Обновляем пользователя и показываем главное меню
      await this._users.upsertFromContext(ctx);
      await MainMenuHandler.handleMainMenuRequest(ctx, 'BotUpdate-OnText-ForceExit');
      return;
    }

    // Проверяем, находится ли пользователь в сцене
    const sceneContext = ctx as unknown as {
      scene: {
        current?: { id: string };
      };
    };

    const isInSceneOnText =
      sceneContext.scene !== undefined &&
      sceneContext.scene !== null &&
      sceneContext.scene.current !== undefined &&
      sceneContext.scene.current !== null;
    if (isInSceneOnText === true) {
      this._logger.debug(
        `[@On text] Пользователь ${ctx.from?.id} находится в сцене "${sceneContext.scene.current.id}", пропускаем обработку в BotUpdate`,
        'BotUpdate'
      );
      // Не обрабатываем сообщение здесь, позволяем сцене его обработать
      return;
    }

    this._logger.debug(
      `[@On text] Текстовое сообщение получено: "${messageText}" от пользователя ${ctx.from?.id} (вне сцены)`,
      'BotUpdate'
    );

    // Для других сообщений просто логируем
    this._logger.debug(`[@On text] Неизвестное сообщение: "${messageText}"`, 'BotUpdate');
  }

  // Обработчик для фото
  @On('photo')
  async onPhoto(@Ctx() ctx: Context) {
    this._logger.log(`📸 [@On photo] Фото получено от пользователя ${ctx.from?.id}`, 'BotUpdate');

    // Проверяем, находится ли пользователь в сцене
    const sceneContext = ctx as unknown as {
      scene: {
        current?: { id: string };
      };
    };

    const isInSceneOnPhoto =
      sceneContext.scene !== undefined &&
      sceneContext.scene !== null &&
      sceneContext.scene.current !== undefined &&
      sceneContext.scene.current !== null;
    if (isInSceneOnPhoto === true) {
      this._logger.debug(
        `[@On photo] Пользователь ${ctx.from?.id} находится в сцене "${sceneContext.scene.current.id}", пропускаем обработку в BotUpdate`,
        'BotUpdate'
      );
      // Не обрабатываем сообщение здесь, позволяем сцене его обработать
      return;
    }

    // Если пользователь не в сцене, отправляем сообщение о том, что нужно начать создание видео
    await ctx.reply(
      '📸 Фото получено!\n\n' +
        "🎬 Для создания видео с этим фото нажмите кнопку 'Создать видео' в главном меню."
    );
  }

  // Обработчик для голосовых сообщений
  @On('voice')
  async onVoice(@Ctx() ctx: Context) {
    this._logger.log(
      `🎤 [@On voice] Голосовое сообщение получено от пользователя ${ctx.from?.id}`,
      'BotUpdate'
    );

    // Проверяем, находится ли пользователь в сцене
    const sceneContext = ctx as unknown as {
      scene: {
        current?: { id: string };
      };
    };

    const isInSceneOnVoice =
      sceneContext.scene !== undefined &&
      sceneContext.scene !== null &&
      sceneContext.scene.current !== undefined &&
      sceneContext.scene.current !== null;
    if (isInSceneOnVoice === true) {
      this._logger.debug(
        `[@On voice] Пользователь ${ctx.from?.id} находится в сцене "${sceneContext.scene.current.id}", пропускаем обработку в BotUpdate`,
        'BotUpdate'
      );
      // Не обрабатываем сообщение здесь, позволяем сцене его обработать
      return;
    }

    // Если пользователь не в сцене, отправляем сообщение о том, что нужно начать создание видео
    await ctx.reply(
      '🎤 Голосовое сообщение получено!\n\n' +
        '📸 Для создания видео с вашим голосом сначала отправьте фото с человеком.\n\n' +
        "🎬 Нажмите кнопку 'Создать видео' в главном меню."
    );
  }

  @Hears(['🏠 Главное меню', 'Главное меню'])
  async onMainMenu(@Ctx() ctx: Context) {
    const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    this._logger.log(
      `🏠 [@Hears] Главное меню запрошено пользователем ${ctx.from?.id}, текст: "${messageText}"`,
      'BotUpdate'
    );

    try {
      await this._users.upsertFromContext(ctx);

      // Используем централизованный обработчик главного меню
      const { MainMenuHandler } = await import('../utils/main-menu-handler');
      await MainMenuHandler.handleMainMenuRequest(ctx, 'BotUpdate');

      this._logger.debug('Главное меню отправлено через @Hears', 'BotUpdate');
    } catch (error) {
      this._logger.error(`❌ Ошибка при обработке главного меню: ${error}`, undefined, 'BotUpdate');
      await ctx.reply('❌ Произошла ошибка при загрузке главного меню');
    }
  }

  @Action('main_menu')
  async onMainMenuAction(@Ctx() ctx: Context) {
    this._logger.log(
      `🏠 [@Action] Главное меню запрошено через inline кнопку пользователем ${ctx.from?.id}`,
      'BotUpdate'
    );

    try {
      await ctx.answerCbQuery();

      // Используем централизованный обработчик главного меню
      const { MainMenuHandler } = await import('../utils/main-menu-handler');
      await MainMenuHandler.handleMainMenuRequest(ctx, 'BotUpdate-Action');

      this._logger.debug('Главное меню отправлено через @Action', 'BotUpdate');
    } catch (error) {
      this._logger.error(
        `❌ Ошибка при обработке главного меню через @Action: ${error}`,
        undefined,
        'BotUpdate'
      );
      await ctx.answerCbQuery('❌ Произошла ошибка');
    }
  }

  // Удаляем дублирующую команду operator - она уже есть в OperatorModule
  // @Command('operator') - УДАЛЕНО для предотвращения конфликтов

  @Command('myid')
  async onMyId(@Ctx() ctx: Context) {
    const isCtxFromMissing = ctx.from === undefined || ctx.from === null;
    if (isCtxFromMissing === true) {
      await ctx.reply('❌ Не удалось получить данные пользователя');
      return;
    }
    const userId = ctx.from.id;
    const username = ctx.from.username || 'не задан';
    const firstName = ctx.from.first_name || '';
    const lastName = ctx.from.last_name || '';
    const message =
      `🆔 Ваши данные:\n\n` +
      `📱 Chat ID: \`${userId}\`\n` +
      `👤 Username: @${username}\n` +
      `📝 Имя: ${firstName} ${lastName}\n\n` +
      `💡 Для копирования Chat ID выделите число выше`;
    await ctx.reply(message, { parse_mode: 'Markdown' });
  }

  @Command('admin')
  async onAdmin(@Ctx() ctx: Context) {
    const isCtxFromMissingForAdmin = ctx.from === undefined || ctx.from === null;
    if (isCtxFromMissingForAdmin === true) {
      await ctx.reply('❌ Не удалось получить данные пользователя');
      return;
    }

    // Проверяем, является ли пользователь админом
    const isAdmin = await this.checkAdminStatus(ctx.from.id);
    const isNotAdmin = isAdmin === false;
    if (isNotAdmin === true) {
      await ctx.reply('❌ У вас нет прав администратора');
      return;
    }

    await ctx.reply('👑 Админ-панель', {
      reply_markup: this._kb.adminMainMenu().reply_markup,
    });
  }

  // Вариант без слеша, чтобы не дублировать с @Command('myid')
  @Hears(/^myid$/i)
  async onMyIdHears(@Ctx() ctx: Context) {
    return this.onMyId(ctx);
  }

  @Action('create_video')
  async onCreateVideo(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    await (
      ctx as unknown as {
        scene: { enter: (sceneName: string) => Promise<void> };
      }
    ).scene.enter('video-generation');
  }

  @Action('referral_system')
  async onReferralSystem(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    await (
      ctx as unknown as {
        scene: { enter: (sceneName: string) => Promise<void> };
      }
    ).scene.enter('referral');
  }

  @Action('payment_menu')
  async onPaymentMenu(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    await (
      ctx as unknown as {
        scene: { enter: (sceneName: string) => Promise<void> };
      }
    ).scene.enter('payment');
  }

  @Action('admin_referral_menu')
  async onAdminReferralMenu(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    await (
      ctx as unknown as {
        scene: { enter: (sceneName: string) => Promise<void> };
      }
    ).scene.enter('admin-referral');
  }

  /**
   * Получает пользователя из базы данных по telegram_id
   */
  private async getUserFromDatabase(telegramId: number): Promise<{ id: number } | null> {
    try {
      // Здесь должен быть запрос к базе данных
      // Пока возвращаем заглушку
      return { id: telegramId };
    } catch (error) {
      this._logger.error('Ошибка получения пользователя из базы данных:', error);
      return null;
    }
  }

  /**
   * Проверяет, является ли пользователь админом
   */
  private async checkAdminStatus(telegramId: number): Promise<boolean> {
    let isAdmin = true;
    try {
      // Здесь должна быть проверка роли пользователя в базе данных
      // Пока возвращаем true для тестирования
      isAdmin = true;
    } catch (error) {
      this._logger.error('Ошибка проверки статуса админа:', error);
      isAdmin = false;
    }
    return isAdmin;
  }
}
