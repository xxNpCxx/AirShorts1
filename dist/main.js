"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const logger_service_1 = require("./logger/logger.service");
const express_1 = require("express");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    app.use((0, express_1.json)({ limit: '10mb' }));
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
    logger.debug(`Node.js версия: ${process.version}`, 'Bootstrap');
    logger.debug(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`, 'Bootstrap');
    const bot = app.get((0, nestjs_telegraf_1.getBotToken)());
    bot.use(async (ctx, next) => {
        logger.telegramUpdate(ctx.update, 'BotMiddleware');
        return next();
    });
    bot.use(async (ctx, next) => {
        if (ctx.message && typeof ctx.message.text === 'string' && ctx.message.text.startsWith('/start')) {
            logger.debug(`Middleware: Обработка команды /start от пользователя ${ctx.from?.id}`, 'StartCommand');
            if (ctx.scene && ctx.scene.current) {
                try {
                    await ctx.scene.leave();
                }
                catch { }
            }
            if (ctx.session) {
                ctx.session = {};
            }
        }
        if (ctx.message?.text) {
            logger.debug(`Получено сообщение: "${ctx.message.text}" от пользователя ${ctx.from?.id}`, 'MessageHandler');
        }
        return next();
    });
    const port = Number(process.env.PORT) || 3000;
    await app.listen(port);
    logger.log(`✅ Приложение запущено на порту ${port}`, 'Bootstrap');
    try {
        const webhookUrl = process.env.WEBHOOK_URL || 'https://airshorts1.onrender.com';
        const webhookPath = `${webhookUrl}/webhook`;
        logger.log(`🔧 Настройка webhook: ${webhookPath}`, 'Bootstrap');
        await bot.telegram.setWebhook(webhookPath);
        const webhookInfo = await bot.telegram.getWebhookInfo();
        logger.log(`📡 Webhook статус: ${webhookInfo.url}`, 'Bootstrap');
        logger.log(`✅ Webhook успешно настроен`, 'Bootstrap');
        logger.debug(`Webhook детали: ${JSON.stringify(webhookInfo)}`, 'Bootstrap');
        if (webhookInfo.url !== webhookPath) {
            logger.warn(`⚠️ Webhook URL не совпадает: ожидалось ${webhookPath}, получено ${webhookInfo.url}`, 'Bootstrap');
        }
        logger.log(`📊 Webhook информация:`, 'Bootstrap');
        logger.log(`   - URL: ${webhookInfo.url}`, 'Bootstrap');
        logger.log(`   - Pending updates: ${webhookInfo.pending_update_count}`, 'Bootstrap');
        logger.log(`   - Last error: ${webhookInfo.last_error_message || 'нет'}`, 'Bootstrap');
        logger.log(`   - Last error date: ${webhookInfo.last_error_date || 'нет'}`, 'Bootstrap');
    }
    catch (error) {
        logger.error(`❌ Ошибка настройки webhook: ${error}`, undefined, 'Bootstrap');
        try {
            const webhookInfo = await bot.telegram.getWebhookInfo();
            logger.warn(`⚠️ Текущий webhook статус: ${JSON.stringify(webhookInfo)}`, 'Bootstrap');
        }
        catch (webhookError) {
            logger.error(`❌ Не удалось получить статус webhook: ${webhookError}`, undefined, 'Bootstrap');
        }
    }
}
bootstrap();
//# sourceMappingURL=main.js.map