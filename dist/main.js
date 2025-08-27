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
    const bot = app.get((0, nestjs_telegraf_1.getBotToken)());
    const port = Number(process.env.PORT) || 3000;
    logger.log(`🚀 Запуск приложения на порту ${port}`, "Bootstrap");
    await app.listen(port);
    logger.log(`✅ Приложение запущено на порту ${port}`, "Bootstrap");
    try {
        const webhookUrl = process.env.WEBHOOK_URL || "https://airshorts1.onrender.com";
        const webhookPath = `${webhookUrl}/webhook`;
        logger.log(`🔧 Настройка webhook: ${webhookPath}`, "Bootstrap");
        const currentWebhookInfo = await bot.telegram.getWebhookInfo();
        logger.log(`📡 Текущий webhook статус: ${currentWebhookInfo.url || "не настроен"}`, "Bootstrap");
        if (currentWebhookInfo.url && currentWebhookInfo.url !== webhookPath) {
            logger.log(`🔄 Сбрасываем старый webhook: ${currentWebhookInfo.url}`, "Bootstrap");
            logger.log(`   Новый webhook будет: ${webhookPath}`, "Bootstrap");
            await bot.telegram.deleteWebhook();
            logger.log(`✅ Старый webhook сброшен`, "Bootstrap");
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        if (currentWebhookInfo.url === webhookPath &&
            currentWebhookInfo.last_error_message) {
            logger.log(`⚠️ Webhook настроен, но есть ошибки: ${currentWebhookInfo.last_error_message}`, "Bootstrap");
            logger.log(`🔄 Переустанавливаем webhook для исправления ошибок`, "Bootstrap");
            await bot.telegram.deleteWebhook();
            logger.log(`✅ Webhook сброшен для переустановки`, "Bootstrap");
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        if (currentWebhookInfo.pending_update_count > 0) {
            logger.log(`📥 Обнаружены ожидающие обновления: ${currentWebhookInfo.pending_update_count}`, "Bootstrap");
            logger.log(`ℹ️ Pending updates будут очищены при установке нового webhook`, "Bootstrap");
        }
        logger.log(`🔧 Устанавливаем новый webhook: ${webhookPath}`, "Bootstrap");
        let webhookInfo;
        let retryCount = 0;
        const maxRetries = 3;
        while (retryCount < maxRetries) {
            try {
                await bot.telegram.setWebhook(webhookPath);
                webhookInfo = await bot.telegram.getWebhookInfo();
                break;
            }
            catch (setWebhookError) {
                retryCount++;
                const errorMessage = setWebhookError instanceof Error
                    ? setWebhookError.message
                    : String(setWebhookError);
                if (errorMessage.includes("429")) {
                    const retryAfter = parseInt(errorMessage.match(/retry after (\d+)/)?.[1] || "5");
                    logger.warn(`⚠️ Rate limit (429): ждем ${retryAfter} секунд перед повторной попыткой ${retryCount}/${maxRetries}`, "Bootstrap");
                    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
                }
                else if (retryCount < maxRetries) {
                    logger.warn(`⚠️ Ошибка установки webhook: ${errorMessage}, повторная попытка ${retryCount}/${maxRetries}`, "Bootstrap");
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                }
                else {
                    throw setWebhookError;
                }
            }
        }
        if (!webhookInfo) {
            throw new Error("Не удалось установить webhook после всех попыток");
        }
        logger.log(`📡 Webhook статус: ${webhookInfo.url}`, "Bootstrap");
        logger.log(`✅ Webhook успешно настроен`, "Bootstrap");
        logger.debug(`Webhook детали: ${JSON.stringify(webhookInfo)}`, "Bootstrap");
        if (webhookInfo.url !== webhookPath) {
            logger.warn(`⚠️ Webhook URL не совпадает: ожидалось ${webhookPath}, получено ${webhookInfo.url}`, "Bootstrap");
        }
        logger.log(`📊 Webhook информация:`, "Bootstrap");
        logger.log(`   - URL: ${webhookInfo.url}`, "Bootstrap");
        logger.log(`   - Pending updates: ${webhookInfo.pending_update_count}`, "Bootstrap");
        logger.log(`   - Last error: ${webhookInfo.last_error_message || "нет"}`, "Bootstrap");
        logger.log(`   - Last error date: ${webhookInfo.last_error_date || "нет"}`, "Bootstrap");
        if (webhookInfo.pending_update_count > 0) {
            logger.log(`📥 Ожидающие обновления: ${webhookInfo.pending_update_count}`, "Bootstrap");
        }
        if (webhookInfo.url === webhookPath) {
            logger.log(`🎯 Webhook успешно настроен и готов к работе!`, "Bootstrap");
        }
        else {
            logger.error(`❌ Webhook настроен неправильно!`, "Bootstrap");
            logger.error(`   Ожидалось: ${webhookPath}`, "Bootstrap");
            logger.error(`   Получено: ${webhookInfo.url}`, "Bootstrap");
        }
    }
    catch (error) {
        logger.error(`❌ Ошибка настройки webhook: ${error}`, undefined, "Bootstrap");
        try {
            const webhookInfo = await bot.telegram.getWebhookInfo();
            logger.warn(`⚠️ Текущий webhook статус: ${JSON.stringify(webhookInfo)}`, "Bootstrap");
        }
        catch (webhookError) {
            logger.error(`❌ Не удалось получить статус webhook: ${webhookError}`, undefined, "Bootstrap");
        }
    }
}
void bootstrap();
//# sourceMappingURL=main.js.map