import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Telegraf } from 'telegraf';
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
  
  logger.log('🚀 Запуск Telegram бота...', 'Bootstrap');
  logger.debug(`Node.js версия: ${process.version}`, 'Bootstrap');
  logger.debug(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`, 'Bootstrap');

  // Middleware для бота
  const bot = app.get<Telegraf>(getBotToken());
  bot.use(async (ctx: any, next) => {
    if (ctx.message && typeof ctx.message.text === 'string' && ctx.message.text.startsWith('/start')) {
      logger.debug(`Middleware: Обработка команды /start от пользователя ${ctx.from?.id}`, 'StartCommand');
      if (ctx.scene && ctx.scene.current) {
        try { await ctx.scene.leave(); } catch {}
      }
      if (ctx.session) { ctx.session = {}; }
    }
    if (ctx.message?.text) {
      logger.debug(`Получено сообщение: "${ctx.message.text}" от пользователя ${ctx.from?.id}`, 'MessageHandler');
    }
    return next();
  });

  // Запускаем приложение
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  logger.log(`✅ Приложение запущено на порту ${port}`, 'Bootstrap');
  logger.log(`✅ Webhook настроен автоматически через TelegrafModule`, 'Bootstrap');
}

bootstrap();
