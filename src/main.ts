import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Telegraf } from 'telegraf';
import { getBotToken } from 'nestjs-telegraf';
import { CustomLoggerService } from './logger/logger.service';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Настраиваем middleware для парсинга JSON
  app.use(json({ limit: '10mb' }));
  
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
  
  // Логируем все обновления
  bot.use(async (ctx: any, next) => {
    logger.telegramUpdate(ctx.update, 'BotMiddleware');
    return next();
  });
  
  // Middleware для команды /start
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
  
  // Настраиваем webhook
  try {
    const webhookUrl = process.env.WEBHOOK_URL || 'https://airshorts1.onrender.com';
    const webhookPath = `${webhookUrl}/webhook`;
    
    logger.log(`🔧 Настройка webhook: ${webhookPath}`, 'Bootstrap');
    
    // Сначала получаем текущий статус webhook
    const currentWebhookInfo = await bot.telegram.getWebhookInfo();
    logger.log(`📡 Текущий webhook статус: ${currentWebhookInfo.url || 'не настроен'}`, 'Bootstrap');
    
    // Если webhook уже настроен на другой URL, сбрасываем его
    if (currentWebhookInfo.url && currentWebhookInfo.url !== webhookPath) {
      logger.log(`🔄 Сбрасываем старый webhook: ${currentWebhookInfo.url}`, 'Bootstrap');
      logger.log(`   Новый webhook будет: ${webhookPath}`, 'Bootstrap');
      await bot.telegram.deleteWebhook();
      logger.log(`✅ Старый webhook сброшен`, 'Bootstrap');
    }
    
    // Если webhook настроен на правильный URL, но есть ошибки, переустанавливаем
    if (currentWebhookInfo.url === webhookPath && currentWebhookInfo.last_error_message) {
      logger.log(`⚠️ Webhook настроен, но есть ошибки: ${currentWebhookInfo.last_error_message}`, 'Bootstrap');
      logger.log(`🔄 Переустанавливаем webhook для исправления ошибок`, 'Bootstrap');
      await bot.telegram.deleteWebhook();
      logger.log(`✅ Webhook сброшен для переустановки`, 'Bootstrap');
    }
    
    // Если есть pending updates, логируем их количество
    if (currentWebhookInfo.pending_update_count > 0) {
      logger.log(`📥 Обнаружены ожидающие обновления: ${currentWebhookInfo.pending_update_count}`, 'Bootstrap');
      logger.log(`ℹ️ Pending updates будут очищены при установке нового webhook`, 'Bootstrap');
    }
    
    // Устанавливаем новый webhook
    logger.log(`🔧 Устанавливаем новый webhook: ${webhookPath}`, 'Bootstrap');
    await bot.telegram.setWebhook(webhookPath);
    
    // Проверяем статус
    const webhookInfo = await bot.telegram.getWebhookInfo();
    logger.log(`📡 Webhook статус: ${webhookInfo.url}`, 'Bootstrap');
    logger.log(`✅ Webhook успешно настроен`, 'Bootstrap');
    
    // Логируем детали webhook
    logger.debug(`Webhook детали: ${JSON.stringify(webhookInfo)}`, 'Bootstrap');
    
    // Проверяем, что webhook действительно установлен
    if (webhookInfo.url !== webhookPath) {
      logger.warn(`⚠️ Webhook URL не совпадает: ожидалось ${webhookPath}, получено ${webhookInfo.url}`, 'Bootstrap');
    }
    
    // Логируем информацию о webhook
    logger.log(`📊 Webhook информация:`, 'Bootstrap');
    logger.log(`   - URL: ${webhookInfo.url}`, 'Bootstrap');
    logger.log(`   - Pending updates: ${webhookInfo.pending_update_count}`, 'Bootstrap');
    logger.log(`   - Last error: ${webhookInfo.last_error_message || 'нет'}`, 'Bootstrap');
    logger.log(`   - Last error date: ${webhookInfo.last_error_date || 'нет'}`, 'Bootstrap');
    
    // Если есть pending updates, логируем их количество
    if (webhookInfo.pending_update_count > 0) {
      logger.log(`📥 Ожидающие обновления: ${webhookInfo.pending_update_count}`, 'Bootstrap');
    }
    
    // Финальная проверка
    if (webhookInfo.url === webhookPath) {
      logger.log(`🎯 Webhook успешно настроен и готов к работе!`, 'Bootstrap');
    } else {
      logger.error(`❌ Webhook настроен неправильно!`, 'Bootstrap');
      logger.error(`   Ожидалось: ${webhookPath}`, 'Bootstrap');
      logger.error(`   Получено: ${webhookInfo.url}`, 'Bootstrap');
    }
    
  } catch (error) {
    logger.error(`❌ Ошибка настройки webhook: ${error}`, undefined, 'Bootstrap');
    
    // Пытаемся получить информацию об ошибке
    try {
      const webhookInfo = await bot.telegram.getWebhookInfo();
      logger.warn(`⚠️ Текущий webhook статус: ${JSON.stringify(webhookInfo)}`, 'Bootstrap');
    } catch (webhookError) {
      logger.error(`❌ Не удалось получить статус webhook: ${webhookError}`, undefined, 'Bootstrap');
    }
  }
}

bootstrap();
