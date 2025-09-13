import { Context } from 'telegraf';
import { Logger } from '@nestjs/common';

/**
 * Базовый класс для всех сцен
 * Содержит общую логику обработки команд главного меню
 */
export abstract class BaseScene {
  protected readonly logger = new Logger(this.constructor.name);

  /**
   * Проверяет, является ли сообщение командой выхода из сцены
   * @param text Текст сообщения
   * @returns true если это команда выхода
   */
  protected isExitCommand(text: string): boolean {
    return text === '/start' || text === 'Назад в меню';
  }

  /**
   * Обрабатывает команды выхода из сцены
   * @param ctx Контекст Telegraf
   * @param text Текст сообщения
   * @returns true если команда была обработана
   */
  protected async handleExitCommand(ctx: Context, text: string): Promise<boolean> {
    if (this.isExitCommand(text)) {
      this.logger.debug(`🚪 Выходим из сцены по команде: "${text}"`, this.constructor.name);
      await (ctx as any).scene.leave();
      await ctx.reply('🏠 Возвращаемся в главное меню...');
      return true;
    }
    return false;
  }

  /**
   * Проверяет, является ли сообщение главным меню
   * Главное меню обрабатывается в BotUpdate, но можно проверить для логирования
   * @param text Текст сообщения
   * @returns true если это главное меню
   */
  protected isMainMenuMessage(text: string): boolean {
    return text === '🏠 Главное меню' || text === 'Главное меню';
  }

  /**
   * Логирует получение сообщения главного меню (для отладки)
   * @param text Текст сообщения
   */
  protected logMainMenuMessage(text: string): void {
    if (this.isMainMenuMessage(text)) {
      this.logger.debug(
        `ℹ️ Получено сообщение главного меню: "${text}" - обрабатывается в BotUpdate`,
        this.constructor.name
      );
    }
  }
}
