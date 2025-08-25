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
        logger: ['error', 'warn', 'log'],
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
    const hookPath = '/webhook';
    const bot = app.get((0, nestjs_telegraf_1.getBotToken)());
    bot.use(async (ctx, next) => {
        if (ctx.message && typeof ctx.message.text === 'string' && ctx.message.text.startsWith('/start')) {
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
            }
        }
        if (ctx.message && ctx.message.text) {
            logger.debug(`Получено сообщение: "${ctx.message.text}" от пользователя ${ctx.from?.id}`, 'MessageHandler');
        }
        return next();
    });
    app.use(hookPath, express_1.default.json({ limit: '1mb' }), async (req, res) => {
        try {
            logger.debug('Webhook update получен', 'Webhook');
            const update = req.body || {};
            logger.telegramUpdate(update, 'Webhook');
            await bot.handleUpdate(req.body);
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