"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const logger_service_1 = require("./logger/logger.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    let logger;
    try {
        logger = app.get(logger_service_1.CustomLoggerService);
    }
    catch (error) {
        console.log('⚠️ CustomLoggerService недоступен, используется console.log');
        logger = {
            log: (message, context) => console.log(`[LOG] [${context || 'App'}] ${message}`),
            error: (message, trace, context) => console.error(`[ERROR] [${context || 'App'}] ${message}`, trace || ''),
            warn: (message, context) => console.warn(`[WARN] [${context || 'App'}] ${message}`),
            debug: (message, context) => console.log(`[DEBUG] [${context || 'App'}] ${message}`),
            verbose: (message, context) => console.log(`[VERBOSE] [${context || 'App'}] ${message}`),
            telegramUpdate: (update, context) => {
                const type = update.message ? 'message' : (update.callback_query ? 'callback_query' : 'other');
                const userId = update.message?.from?.id || update.callback_query?.from?.id;
                const username = update.message?.from?.username || update.callback_query?.from?.username;
                const text = update.message?.text;
                const callback = update.callback_query?.data;
                console.log(`[DEBUG] [${context || 'Webhook'}] Telegram Update: type=${type}, userId=${userId}, username=${username}, text="${text}", callback="${callback}"`);
            }
        };
    }
    logger.log('🚀 Запуск Telegram бота...', 'Bootstrap');
    logger.debug(`Режим отладки: ${process.env.DEBUG || 'false'}`, 'Bootstrap');
    logger.debug(`Node.js версия: ${process.version}`, 'Bootstrap');
    logger.debug(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`, 'Bootstrap');
    const bot = app.get((0, nestjs_telegraf_1.getBotToken)());
    const webhookUrl = process.env.RENDER_EXTERNAL_URL || process.env.WEBHOOK_URL;
    if (webhookUrl) {
        logger.log(`🌐 Webhook URL: ${webhookUrl}`, 'Bootstrap');
        logger.log(`🔗 Webhook путь: ${webhookUrl}/webhook`, 'Bootstrap');
        logger.log(`🚪 Порт: ${process.env.PORT || 3000}`, 'Bootstrap');
    }
    else {
        logger.warn('⚠️ WEBHOOK_URL не настроен, бот будет работать в polling режиме', 'Bootstrap');
    }
    bot.use(async (ctx, next) => {
        if (ctx.message && typeof ctx.message.text === 'string' && ctx.message.text.startsWith('/start')) {
            logger.debug(`Middleware: Обработка команды /start от пользователя ${ctx.from?.id}`, 'StartCommand');
            if (ctx.scene && ctx.scene.current) {
                try {
                    await ctx.scene.leave();
                    logger.debug('Пользователь вышел из сцены при команде /start', 'StartCommand');
                }
                catch (error) {
                    logger.error(`Ошибка при выходе из сцены: ${error}`, undefined, 'StartCommand');
                }
            }
            if (ctx.session) {
                ctx.session = {};
                logger.debug('Сессия сброшена при команде /start', 'StartCommand');
            }
        }
        if (ctx.message && ctx.message.text) {
            logger.debug(`Получено сообщение: "${ctx.message.text}" от пользователя ${ctx.from?.id}`, 'MessageHandler');
        }
        logger.debug(`Middleware: Передаем управление следующему обработчику`, 'MessageHandler');
        return next();
    });
    const port = Number(process.env.PORT) || 3000;
    await app.listen(port);
    logger.log(`✅ Telegram бот запущен на порту ${port}`, 'Bootstrap');
    if (webhookUrl) {
        try {
            logger.log('🔧 Настраиваю webhook вручную...', 'Bootstrap');
            await bot.telegram.setWebhook(`${webhookUrl}/webhook`);
            logger.log('✅ Webhook успешно настроен', 'Bootstrap');
            const webhookInfo = await bot.telegram.getWebhookInfo();
            logger.log(`📡 Webhook URL: ${webhookInfo.url}`, 'Bootstrap');
            logger.log(`📊 Ожидающие обновления: ${webhookInfo.pending_update_count}`, 'Bootstrap');
            if (webhookInfo.last_error_message) {
                logger.warn(`⚠️ Последняя ошибка webhook: ${webhookInfo.last_error_message}`, 'Bootstrap');
            }
        }
        catch (error) {
            logger.error(`❌ Ошибка при настройке webhook: ${error}`, undefined, 'Bootstrap');
            logger.log('🔄 Переключаюсь на polling режим', 'Bootstrap');
            bot.launch();
            logger.log('✅ Бот запущен в polling режиме', 'Bootstrap');
        }
    }
    else {
        logger.log('✅ Бот будет работать в polling режиме', 'Bootstrap');
        bot.launch();
    }
    logger.debug(`Webhook URL: ${webhookUrl || 'не настроен'}`, 'Bootstrap');
    logger.debug(`База данных: ${process.env.DATABASE_URL ? 'подключена' : 'не настроена'}`, 'Bootstrap');
    logger.debug(`Redis: ${process.env.REDIS_URL ? 'подключен' : 'не настроен'}`, 'Bootstrap');
}
bootstrap();
//# sourceMappingURL=main.js.map