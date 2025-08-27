"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const logger_service_1 = require("./logger/logger.service");
const express_1 = require("express");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ["error", "warn", "log", "debug", "verbose"],
    });
    app.use((0, express_1.json)({ limit: "10mb" }));
    let logger;
    try {
        logger = app.get(logger_service_1.CustomLoggerService);
    }
    catch {
        console.log("⚠️ CustomLoggerService недоступен, используется console.log");
        logger = {
            log: (message, context) => console.log(`[LOG] [${context || "App"}] ${message}`),
            error: (message, trace, context) => console.error(`[ERROR] [${context || "App"}] ${message}`, trace || ""),
            warn: (message, context) => console.warn(`[WARN] [${context || "App"}] ${message}`),
            debug: (message, context) => console.log(`[DEBUG] [${context || "App"}] ${message}`),
            verbose: (message, context) => console.log(`[VERBOSE] [${context || "App"}] ${message}`),
            telegramUpdate: (update, context) => {
                const message = update.message;
                const callbackQuery = update.callback_query;
                const type = message
                    ? "message"
                    : callbackQuery
                        ? "callback_query"
                        : "other";
                const userId = message?.from?.id ||
                    callbackQuery?.from?.id;
                const username = message?.from?.username ||
                    callbackQuery?.from?.username;
                const text = message?.text;
                const callback = callbackQuery?.data;
                console.log(`[DEBUG] [${context || "Webhook"}] Telegram Update: type=${type}, userId=${userId}, username=${username}, text="${text}", callback="${callback}"`);
            },
        };
    }
    logger.log("🚀 Запуск Telegram бота...", "Bootstrap");
    logger.debug(`Node.js версия: ${process.version}`, "Bootstrap");
    logger.debug(`NODE_ENV: ${process.env.NODE_ENV || "development"}`, "Bootstrap");
    logger.debug(`BOT_TOKEN: ${process.env.BOT_TOKEN ? "установлен" : "НЕ УСТАНОВЛЕН"}`, "Bootstrap");
    logger.debug(`WEBHOOK_URL: ${process.env.WEBHOOK_URL || "не установлен"}`, "Bootstrap");
    logger.debug(`PORT: ${process.env.PORT || "не установлен, используется 3000"}`, "Bootstrap");
    const port = Number(process.env.PORT) || 3000;
    logger.log(`🚀 Запуск приложения на порту ${port}`, "Bootstrap");
    logger.log(`✅ Приложение готово к работе на порту ${port}`, "Bootstrap");
    logger.log(`🔧 Webhook настраивается автоматически через TelegrafModule`, "Bootstrap");
    logger.log(`📡 Webhook URL: ${process.env.WEBHOOK_URL || "https://airshorts1.onrender.com"}/webhook`, "Bootstrap");
    logger.log(`✅ Приложение готово к работе!`, "Bootstrap");
}
void bootstrap();
//# sourceMappingURL=main.js.map