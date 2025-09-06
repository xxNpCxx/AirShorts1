import { Context } from "telegraf";
import { KeyboardsService } from "../keyboards/keyboards.service";
import { CustomLoggerService } from "../logger/logger.service";

/**
 * Централизованный обработчик главного меню
 * Используется во всех сценах и обработчиках для единообразного поведения
 */
export class MainMenuHandler {
  private static kbService = new KeyboardsService();
  private static loggerService = new CustomLoggerService();

  /**
   * Проверяет, является ли сообщение запросом главного меню
   */
  static isMainMenuMessage(text: string): boolean {
    const mainMenuMessages = ["🏠 Главное меню", "Главное меню"];
    return mainMenuMessages.includes(text);
  }

  /**
   * Обрабатывает запрос главного меню
   * Выходит из сцены (если есть) и показывает главное меню
   */
  static async handleMainMenuRequest(ctx: Context, source: string = "unknown"): Promise<void> {
    try {
      this.loggerService.debug(
        `🏠 [${source}] Обработка запроса главного меню пользователем ${ctx.from?.id}`,
        "MainMenuHandler"
      );

      // Проверяем, находится ли пользователь в сцене
      const sceneContext = ctx as unknown as {
        scene: { 
          current?: { id: string };
          leave: () => Promise<void>;
        };
      };
      
      if (sceneContext.scene?.current) {
        this.loggerService.debug(
          `🚪 Выходим из сцены "${sceneContext.scene.current.id}" для пользователя ${ctx.from?.id}`,
          "MainMenuHandler"
        );
        await sceneContext.scene.leave();
      }

      // Показываем главное меню
      await this.showMainMenu(ctx);
      
      this.loggerService.debug(
        `✅ Главное меню успешно показано пользователю ${ctx.from?.id}`,
        "MainMenuHandler"
      );
    } catch (error) {
      this.loggerService.error(
        `❌ Ошибка при обработке главного меню: ${error}`,
        undefined,
        "MainMenuHandler"
      );
      throw error;
    }
  }

  /**
   * Показывает главное меню пользователю
   */
  static async showMainMenu(ctx: Context): Promise<void> {
    try {
      // Отправляем текстовое сообщение с inline-клавиатурой
      await ctx.reply(
        "🎬 ГЕНЕРАТОР ВИДЕО\n\nДобро пожаловать в генератор видео!\n\n✨ Создавайте персонализированные видео\n🎭 3D аватары с вашим голосом\n📱 Оптимизировано для коротких роликов\n🚀 Быстрая и качественная генерация",
        {
          reply_markup: this.kbService.mainInline().reply_markup,
        }
      );

      // Отправляем reply-клавиатуру отдельно
      await ctx.reply("🎬", {
        reply_markup: this.kbService.mainReply().reply_markup,
      });

      this.loggerService.debug(
        `Главное меню отправлено пользователю ${ctx.from?.id}`,
        "MainMenuHandler"
      );
    } catch (error) {
      this.loggerService.error(
        `Ошибка при отправке главного меню: ${error}`,
        undefined,
        "MainMenuHandler"
      );
      throw error;
    }
  }
}
