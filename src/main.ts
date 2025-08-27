import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { CustomLoggerService } from "./logger/logger.service";
import { json } from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug", "verbose"],
  });

  // Настраиваем middleware для парсинга JSON
  app.use(json({ limit: "10mb" }));

  // Получаем экземпляр логгера
  let logger: CustomLoggerService;
  try {
    logger = app.get(CustomLoggerService);
  } catch {
    console.log("⚠️ CustomLoggerService недоступен, используется console.log");
    logger = {
      log: (message: string, context?: string) =>
        console.log(`[LOG] [${context || "App"}] ${message}`),
      error: (message: string, trace?: string, context?: string) =>
        console.error(`[ERROR] [${context || "App"}] ${message}`, trace || ""),
      warn: (message: string, context?: string) =>
        console.warn(`[WARN] [${context || "App"}] ${message}`),
      debug: (message: string, context?: string) =>
        console.log(`[DEBUG] [${context || "App"}] ${message}`),
      verbose: (message: string, context?: string) =>
        console.log(`[VERBOSE] [${context || "App"}] ${message}`),
      telegramUpdate: (update: Record<string, unknown>, context?: string) => {
        const message = update.message as Record<string, unknown> | undefined;
        const callbackQuery = update.callback_query as
          | Record<string, unknown>
          | undefined;

        const type = message
          ? "message"
          : callbackQuery
            ? "callback_query"
            : "other";
        const userId =
          (message?.from as Record<string, unknown>)?.id ||
          (callbackQuery?.from as Record<string, unknown>)?.id;
        const username =
          (message?.from as Record<string, unknown>)?.username ||
          (callbackQuery?.from as Record<string, unknown>)?.username;
        const text = message?.text;
        const callback = callbackQuery?.data;
        console.log(
          `[DEBUG] [${context || "Webhook"}] Telegram Update: type=${type}, userId=${userId}, username=${username}, text="${text}", callback="${callback}"`,
        );
      },
    } as CustomLoggerService;
  }

  logger.log("🚀 Запуск Telegram бота...", "Bootstrap");
  logger.debug(`Node.js версия: ${process.version}`, "Bootstrap");
  logger.debug(
    `NODE_ENV: ${process.env.NODE_ENV || "development"}`,
    "Bootstrap",
  );
  
  // Логируем переменные окружения для диагностики
  logger.debug(`BOT_TOKEN: ${process.env.BOT_TOKEN ? "установлен" : "НЕ УСТАНОВЛЕН"}`, "Bootstrap");
  logger.debug(`WEBHOOK_URL: ${process.env.WEBHOOK_URL || "не установлен"}`, "Bootstrap");
  logger.debug(`PORT: ${process.env.PORT || "не установлен, используется 3000"}`, "Bootstrap");

  // Запускаем приложение
  const port = Number(process.env.PORT) || 3000;
  logger.log(`🚀 Запуск приложения на порту ${port}`, "Bootstrap");
  await app.listen(port);
  logger.log(`✅ Приложение запущено на порту ${port}`, "Bootstrap");

  // Webhook настраивается автоматически через TelegrafModule
  logger.log(`🔧 Webhook настраивается автоматически через TelegrafModule`, "Bootstrap");
  logger.log(`📡 Webhook URL: ${process.env.WEBHOOK_URL || "https://airshorts1.onrender.com"}/webhook`, "Bootstrap");
  logger.log(`✅ Приложение готово к работе!`, "Bootstrap");
}

void bootstrap();
