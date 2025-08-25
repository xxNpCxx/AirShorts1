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
  
  // Middleware для принудительного выхода из FSM при команде /start
  bot.use(async (ctx: any, next) => {
    if (ctx.message && typeof ctx.message.text === 'string' && ctx.message.text.startsWith('/start')) {
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
      }
    }
    
    // Логируем все входящие сообщения для отладки
    if (ctx.message && ctx.message.text) {
      logger.debug(`Получено сообщение: "${ctx.message.text}" от пользователя ${ctx.from?.id}`, 'MessageHandler');
    }
    
    return next();
  });
  
  // Настраиваем webhook только если есть URL
  const hookPath = '/webhook';
  const webhookUrl = process.env.RENDER_EXTERNAL_URL || process.env.WEBHOOK_URL;
  
  if (webhookUrl && webhookUrl.trim() !== '') {
    try {
      await bot.telegram.setWebhook(`${webhookUrl}${hookPath}`);
      logger.log(`Webhook установлен: ${webhookUrl}${hookPath}`, 'Bootstrap');
    } catch (error) {
      logger.error(`Ошибка установки webhook: ${error}`, undefined, 'Bootstrap');
    }
  } else {
    logger.debug('Webhook URL не настроен, пропускаем установку webhook', 'Bootstrap');
  }
  
  // Обработчик webhook
  app.use(hookPath, express.json({ limit: '1mb' }), async (req: any, res: any) => {
    try {
      logger.debug('Webhook update получен', 'Webhook');
      
      // Подробное логирование апдейта через наш логгер
      const update = req.body || {};
      logger.telegramUpdate(update, 'Webhook');
      
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } catch (err) {
      logger.error(`Ошибка при обработке webhook update: ${err}`, undefined, 'Webhook');
      // Всегда отвечаем 200, иначе Telegram будет показывать 5xx и ретраить
      res.status(200).send('OK');
    }
  });
  
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  
  logger.log(`✅ Telegram бот запущен на порту ${port}`, 'Bootstrap');
  logger.debug(`Webhook путь: ${process.env.WEBHOOK_URL || 'не настроен'}`, 'Bootstrap');
  logger.debug(`База данных: ${process.env.DATABASE_URL ? 'подключена' : 'не настроена'}`, 'Bootstrap');
  logger.debug(`Redis: ${process.env.REDIS_URL ? 'подключен' : 'не настроен'}`, 'Bootstrap');
}

bootstrap();
