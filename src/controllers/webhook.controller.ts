import {
  Controller,
  Post,
  Get,
  Req,
  Res,
  HttpStatus,
  Headers,
} from "@nestjs/common";
import { Request, Response } from "express";
import { CustomLoggerService } from "../logger/logger.service";

@Controller("webhook")
export class WebhookController {
  constructor(private readonly _logger: CustomLoggerService) {}

  @Get()
  async getWebhook(@Req() req: Request, @Res() res: Response) {
    this._logger.log(`📡 Webhook GET запрос от ${req.ip}`, "WebhookController");
    res.status(HttpStatus.OK).json({
      status: "ok",
      message: "Webhook endpoint is working",
      timestamp: new Date().toISOString(),
    });
  }

  @Post()
  async handleWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    try {
      this._logger.log(
        `📥 Webhook POST получен от ${req.ip}`,
        "WebhookController",
      );
      this._logger.debug(
        `Headers: ${JSON.stringify(headers)}`,
        "WebhookController",
      );
      this._logger.debug(
        `Body: ${JSON.stringify(req.body)}`,
        "WebhookController",
      );

      // Проверяем, что это обновление от Telegram
      if (!req.body || !req.body.update_id) {
        this._logger.warn(
          `⚠️ Получен неверный webhook: ${JSON.stringify(req.body)}`,
          "WebhookController",
        );
        res.status(HttpStatus.BAD_REQUEST).json({
          error: "Invalid webhook data",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Логируем тип обновления
      const updateType = this.getUpdateType(req.body);
      this._logger.log(`📋 Тип обновления: ${updateType}`, "WebhookController");
      this._logger.debug(
        `Update ID: ${req.body.update_id}`,
        "WebhookController",
      );

      // Логируем, что webhook получен и будет обработан Telegraf
      this._logger.log(
        `✅ Webhook получен, передаем в Telegraf для обработки`,
        "WebhookController",
      );

      // Отправляем успешный ответ
      res.status(HttpStatus.OK).json({
        status: "ok",
        updateType,
        updateId: req.body.update_id,
        timestamp: new Date().toISOString(),
      });
      this._logger.log(`✅ Webhook обработан успешно`, "WebhookController");
    } catch (error) {
      this._logger.error(
        `❌ Ошибка обработки webhook: ${error}`,
        undefined,
        "WebhookController",
      );

      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  private getUpdateType(update: Record<string, unknown>): string {
    if (update.message) return "message";
    if (update.edited_message) return "edited_message";
    if (update.channel_post) return "channel_post";
    if (update.edited_channel_post) return "edited_channel_post";
    if (update.inline_query) return "inline_query";
    if (update.chosen_inline_result) return "chosen_inline_result";
    if (update.callback_query) return "callback_query";
    if (update.shipping_query) return "shipping_query";
    if (update.pre_checkout_query) return "pre_checkout_query";
    if (update.poll) return "poll";
    if (update.poll_answer) return "poll_answer";
    if (update.my_chat_member) return "my_chat_member";
    if (update.chat_member) return "chat_member";
    if (update.chat_join_request) return "chat_join_request";
    return "unknown";
  }

  @Post("health")
  async healthCheck(@Res() res: Response) {
    res
      .status(HttpStatus.OK)
      .json({ status: "ok", timestamp: new Date().toISOString() });
  }

  @Get("status")
  async getStatus(@Res() res: Response) {
    res.status(HttpStatus.OK).json({
      status: "ok",
      message: "Webhook controller is working",
      timestamp: new Date().toISOString(),
      endpoints: ["GET /", "POST /", "GET /status", "POST /health"],
      webhook: {
        url: process.env.WEBHOOK_URL || "https://airshorts1.onrender.com",
        path: "/webhook",
        status: "active",
      },
    });
  }
}
