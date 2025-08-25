"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const express_1 = __importDefault(require("express"));
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
    const setupWebhook = async (retryCount = 0) => {
        const hookPath = '/webhook';
        const webhookUrl = process.env.RENDER_EXTERNAL_URL || process.env.WEBHOOK_URL;
        if (!webhookUrl || webhookUrl.trim() === '') {
            logger.debug('Webhook URL не настроен, пропускаем установку webhook', 'Bootstrap');
            return;
        }
        try {
            const webhookInfo = await bot.telegram.getWebhookInfo();
            logger.debug(`Текущий webhook: ${webhookInfo.url || 'не настроен'}`, 'Bootstrap');
            const targetUrl = `${webhookUrl}${hookPath}`;
            if (webhookInfo.url !== targetUrl) {
                await bot.telegram.setWebhook(targetUrl);
                logger.log(`Webhook установлен: ${targetUrl}`, 'Bootstrap');
            }
            else {
                logger.debug('Webhook уже настроен правильно', 'Bootstrap');
            }
        }
        catch (error) {
            if (error.response?.error_code === 429 && retryCount < 3) {
                const retryAfter = error.response.parameters?.retry_after || 5;
                logger.warn(`Telegram API Rate Limit, повторная попытка через ${retryAfter} секунд (${retryCount + 1}/3)`, 'Bootstrap');
                setTimeout(() => {
                    setupWebhook(retryCount + 1);
                }, retryAfter * 1000);
            }
            else {
                logger.error(`Ошибка установки webhook: ${error}`, undefined, 'Bootstrap');
            }
        }
    };
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
    setupWebhook();
    const hookPath = '/webhook';
    app.use(hookPath, express_1.default.json({ limit: '1mb' }), async (req, res) => {
        try {
            logger.debug('Webhook update получен', 'Webhook');
            const update = req.body || {};
            logger.telegramUpdate(update, 'Webhook');
            try {
                await bot.handleUpdate(req.body);
                logger.debug('Webhook update обработан через bot.handleUpdate', 'Webhook');
            }
            catch (nestError) {
                logger.warn(`NestJS обработка не удалась: ${nestError}`, 'Webhook');
                logger.debug('Пробуем fallback обработку', 'Webhook');
                await bot.handleUpdate(req.body);
                logger.debug('Webhook update обработан через fallback', 'Webhook');
            }
            res.status(200).send('OK');
        }
        catch (err) {
            logger.error(`Ошибка при обработке webhook update: ${err}`, undefined, 'Webhook');
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
//# sourceMappingURL=main.js.map