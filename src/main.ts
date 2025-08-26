import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Telegraf } from 'telegraf';
import express from 'express';
import { getBotToken } from 'nestjs-telegraf';
import { CustomLoggerService } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Получаем экземпляр логгера
  let logger: CustomLoggerService;
  try {
    logger = app.get(CustomLoggerService);
  } catch (error) {
    // Fallback логирование если логгер недоступен
    console.log('⚠️ CustomLoggerService недоступен, используется console.log');
    logger = {
      log: (message: string, context?: string) => console.log(`[LOG] [${context || 'App'}] ${message}`),
      error: (message: string, trace?: string, context?: string) => console.error(`[ERROR] [${context || 'App'}] ${message}`, trace || ''),
      warn: (message: string, context?: string) => console.warn(`[WARN] [${context || 'App'}] ${message}`),
      debug: (message: string, context?: string) => console.log(`[DEBUG] [${context || 'App'}] ${message}`),
      verbose: (message: string, context?: string) => console.log(`[VERBOSE] [${context || 'App'}] ${message}`),
      telegramUpdate: (update: any, context?: string) => {
        const type = update.message ? 'message' : (update.callback_query ? 'callback_query' : 'other');
        const userId = update.message?.from?.id || update.callback_query?.from?.id;
        const username = update.message?.from?.username || update.callback_query?.from?.username;
        const text = update.message?.text;
        const callback = update.callback_query?.data;
        console.log(`[DEBUG] [${context || 'Webhook'}] Telegram Update: type=${type}, userId=${userId}, username=${username}, text="${text}", callback="${callback}"`);
      }
    } as CustomLoggerService;
  }
  
  // Логируем информацию о запуске
  logger.log('🚀 Запуск Telegram бота...', 'Bootstrap');
  logger.debug(`Режим отладки: ${process.env.DEBUG || 'false'}`, 'Bootstrap');
  logger.debug(`Node.js версия: ${process.version}`, 'Bootstrap');
  logger.debug(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`, 'Bootstrap');

  // Получаем экземпляр бота
  const bot = app.get<Telegraf>(getBotToken());
  
  // Проверяем переменные окружения для webhook
  const webhookUrl = process.env.RENDER_EXTERNAL_URL || process.env.WEBHOOK_URL;
  if (webhookUrl) {
    logger.log(`🌐 Webhook URL: ${webhookUrl}`, 'Bootstrap');
    logger.log(`🔗 Webhook путь: ${webhookUrl}/webhook`, 'Bootstrap');
    logger.log(`🚪 Порт: ${process.env.PORT || 3000}`, 'Bootstrap');
  } else {
    logger.warn('⚠️ WEBHOOK_URL не настроен, бот будет работать в polling режиме', 'Bootstrap');
  }
  
  // Middleware для принудительного выхода из FSM при команде /start
  bot.use(async (ctx: any, next) => {
    if (ctx.message && typeof ctx.message.text === 'string' && ctx.message.text.startsWith('/start')) {
      logger.debug(`Middleware: Обработка команды /start от пользователя ${ctx.from?.id}`, 'StartCommand');
      
      // Принудительно выходим из всех сцен при команде /start
      if (ctx.scene && ctx.scene.current) {
        try {
          await ctx.scene.leave();
          logger.debug('Пользователь вышел из сцены при команде /start', 'StartCommand');
        } catch (error) {
          logger.error(`Ошибка при выходе из сцены: ${error}`, undefined, 'StartCommand');
        }
      }
      // Сбрасываем сессию
      if (ctx.session) {
        ctx.session = {};
        logger.debug('Сессия сброшена при команде /start', 'StartCommand');
      }
    }
    
    // Логируем все входящие сообщения для отладки
    if (ctx.message && ctx.message.text) {
      logger.debug(`Получено сообщение: "${ctx.message.text}" от пользователя ${ctx.from?.id}`, 'MessageHandler');
    }
    
    logger.debug(`Middleware: Передаем управление следующему обработчику`, 'MessageHandler');
    return next();
  });
  
  // Запускаем приложение на указанном порту
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  
  logger.log(`✅ Telegram бот запущен на порту ${port}`, 'Bootstrap');
  
  // Настраиваем webhook вручную после запуска приложения
  if (webhookUrl) {
    try {
      logger.log('🔧 Настраиваю webhook вручную...', 'Bootstrap');
      
      // Устанавливаем webhook
      await bot.telegram.setWebhook(`${webhookUrl}/webhook`);
      logger.log('✅ Webhook успешно настроен', 'Bootstrap');
      
      // Проверяем статус webhook
      const webhookInfo = await bot.telegram.getWebhookInfo();
      logger.log(`📡 Webhook URL: ${webhookInfo.url}`, 'Bootstrap');
      logger.log(`📊 Ожидающие обновления: ${webhookInfo.pending_update_count}`, 'Bootstrap');
      
      if (webhookInfo.last_error_message) {
        logger.warn(`⚠️ Последняя ошибка webhook: ${webhookInfo.last_error_message}`, 'Bootstrap');
      }
      
      logger.log('✅ Webhook маршрут зарегистрирован через контроллер', 'Bootstrap');
      logger.log('✅ Бот работает в webhook режиме', 'Bootstrap');
      
    } catch (error) {
      logger.error(`❌ Ошибка при настройке webhook: ${error}`, undefined, 'Bootstrap');
      logger.log('🔄 Webhook не удалось настроить, но приложение продолжает работать', 'Bootstrap');
    }
  } else {
    logger.log('✅ Бот будет работать в polling режиме', 'Bootstrap');
    try {
      bot.launch();
      logger.log('✅ Бот запущен в polling режиме', 'Bootstrap');
    } catch (launchError) {
      logger.error(`❌ Ошибка при запуске в polling режиме: ${launchError}`, undefined, 'Bootstrap');
    }
  }
  
  logger.debug(`Webhook URL: ${webhookUrl || 'не настроен'}`, 'Bootstrap');
  logger.debug(`База данных: ${process.env.DATABASE_URL ? 'подключена' : 'не настроена'}`, 'Bootstrap');
  logger.debug(`Redis: ${process.env.REDIS_URL ? 'подключен' : 'не настроен'}`, 'Bootstrap');
}

bootstrap();
