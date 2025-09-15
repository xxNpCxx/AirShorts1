import { MiddlewareFn, Context } from 'telegraf';
import { MainMenuHandler } from '../utils/main-menu-handler';

/**
 * Middleware для автоматической обработки сообщений главного меню в сценах
 * Проверяет, является ли сообщение запросом главного меню, и если да - выходит из сцены
 */
export const sceneMainMenuMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  // Проверяем, что это текстовое сообщение
  const isMessagePresent = ctx.message !== undefined && ctx.message !== null;
  const isTextInMessage = isMessagePresent === true && 'text' in ctx.message;
  const isNotTextMessage = isMessagePresent === false || isTextInMessage === false;
  if (isNotTextMessage === true) {
    return next();
  }

  const text = ctx.message.text;
  console.log(`🔍 [MIDDLEWARE] Проверяем сообщение: "${text}"`);

  // Проверяем, является ли сообщение запросом главного меню
  const isMainMenuMessage = MainMenuHandler.isMainMenuMessage(text) === true;
  if (isMainMenuMessage === true) {
    console.log(`✅ [MIDDLEWARE] Обнаружено главное меню: "${text}"`);

    // Проверяем, находимся ли мы в сцене
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
      console.log(`🚪 [MIDDLEWARE] Выходим из сцены: "${sceneContext.scene.current.id}"`);

      // Выходим из сцены и показываем главное меню
      await sceneContext.scene.leave();
      await ctx.reply('🏠 Возвращаемся в главное меню...');

      console.log(`✅ [MIDDLEWARE] Главное меню обработано, сцена завершена`);
      return; // Не вызываем next(), так как уже обработали сообщение
    } else {
      console.log(`ℹ️ [MIDDLEWARE] Пользователь не в сцене, пропускаем обработку`);
    }
  } else {
    console.log(`ℹ️ [MIDDLEWARE] Сообщение не является главным меню: "${text}"`);
  }

  // Если это не главное меню или мы не в сцене, продолжаем обычную обработку
  return next();
};
