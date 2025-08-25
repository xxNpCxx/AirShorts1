import { Update, Start, Ctx, Hears, Action, Command } from 'nestjs-telegraf';
import { UsersService } from '../users/users.service';
import { MenuService } from '../menu/menu.service';
import { SettingsService } from '../settings/settings.service';
import { CustomLoggerService } from '../logger/logger.service';

@Update()
export class BotUpdate {
  constructor(
    private readonly _users: UsersService, 
    private readonly _menu: MenuService, 
    private readonly _settings: SettingsService,
    private readonly _logger: CustomLoggerService
  ) {
    this._logger.debug('BotUpdate инициализирован', 'BotUpdate');
  }
  @Start()
  async onStart(@Ctx() ctx: any) {
    this._logger.debug(`[@Start] Команда /start получена от пользователя ${ctx.from?.id}`, 'BotUpdate');
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

  // Дублирующий обработчик для webhook (на случай если @Start не работает)
  @Hears('/start')
  async onStartHears(@Ctx() ctx: any) {
    this._logger.debug(`[@Hears] Команда /start получена через @Hears от пользователя ${ctx.from?.id}`, 'BotUpdate');
    return this.onStart(ctx);
  }

  @Hears(['🏠 Главное меню', 'Главное меню'])
  async onMainMenu(@Ctx() ctx: any) {
    await this._users.upsertFromContext(ctx);
    await this._menu.sendMainMenu(ctx);
  }

  @Action('main_menu')
  async onMainMenuAction(@Ctx() ctx: any) {
    await ctx.answerCbQuery();
    await this._menu.sendMainMenu(ctx);
  }

  // Удаляем дублирующую команду operator - она уже есть в OperatorModule
  // @Command('operator') - УДАЛЕНО для предотвращения конфликтов

  @Command('myid')
  async onMyId(@Ctx() ctx: any) {
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

  // Вариант без слеша, чтобы не дублировать с @Command('myid')
  @Hears(/^myid$/i)
  async onMyIdHears(@Ctx() ctx: any) {
    return this.onMyId(ctx);
  }

  @Action('create_video')
  async onCreateVideo(@Ctx() ctx: any) {
    await ctx.answerCbQuery();
    await ctx.scene.enter('video-generation');
  }
}
