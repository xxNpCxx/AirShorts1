import { MiddlewareFn, Context } from 'telegraf';
import { MainMenuHandler } from '../utils/main-menu-handler';

/**
 * Middleware для автоматической обработки сообщений главного меню в сценах
 * Проверяет, является ли сообщение запросом главного меню, и если да - выходит из сцены
 */
export const sceneMainMenuMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  // Проверяем, что это текстовое сообщение
  if (!ctx.message || !('text' in ctx.message)) {
    return next();
  }

  const text = ctx.message.text;
  console.log(`🔍 [MIDDLEWARE] Проверяем сообщение: "${text}"`);

  // Проверяем, является ли сообщение запросом главного меню
  if (MainMenuHandler.isMainMenuMessage(text)) {
    // Проверяем, находимся ли мы в сцене
    const sceneContext = ctx as unknown as {
      scene: {
        current?: { id: string };
        leave: () => Promise<void>;
      };
    };

    if (sceneContext.scene?.current) {
      // Выходим из сцены и показываем главное меню
      await sceneContext.scene.leave();
      await ctx.reply('🏠 Возвращаемся в главное меню...');
      return; // Не вызываем next(), так как уже обработали сообщение
    }
  }

  // Если это не главное меню или мы не в сцене, продолжаем обычную обработку
  return next();
};
