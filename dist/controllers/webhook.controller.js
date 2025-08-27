"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../logger/logger.service");
const telegraf_1 = require("telegraf");
let WebhookController = class WebhookController {
    constructor(_logger) {
        this._logger = _logger;
        this.bot = new telegraf_1.Telegraf(process.env.BOT_TOKEN || "");
    }
    async getWebhook(req, res) {
        this._logger.log(`📡 Webhook GET запрос от ${req.ip}`, "WebhookController");
        res.status(common_1.HttpStatus.OK).json({
            status: "ok",
            message: "Webhook endpoint is working",
            timestamp: new Date().toISOString(),
        });
    }
    async handleWebhook(req, res, headers) {
        try {
            this._logger.log(`📥 Webhook POST получен от ${req.ip}`, "WebhookController");
            this._logger.debug(`Headers: ${JSON.stringify(headers)}`, "WebhookController");
            this._logger.debug(`Body: ${JSON.stringify(req.body)}`, "WebhookController");
            if (!req.body || !req.body.update_id) {
                this._logger.warn(`⚠️ Получен неверный webhook: ${JSON.stringify(req.body)}`, "WebhookController");
                res.status(common_1.HttpStatus.BAD_REQUEST).json({
                    error: "Invalid webhook data",
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const updateType = this.getUpdateType(req.body);
            this._logger.log(`📋 Тип обновления: ${updateType}`, "WebhookController");
            this._logger.debug(`Update ID: ${req.body.update_id}`, "WebhookController");
            this._logger.log(`✅ Webhook получен, обрабатываем через бота`, "WebhookController");
            await this.bot.handleUpdate(req.body);
            res.status(common_1.HttpStatus.OK).json({
                status: "ok",
                updateType,
                updateId: req.body.update_id,
                timestamp: new Date().toISOString(),
            });
            this._logger.log(`✅ Webhook обработан успешно`, "WebhookController");
        }
        catch (error) {
            this._logger.error(`❌ Ошибка обработки webhook: ${error}`, undefined, "WebhookController");
            res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                error: "Internal server error",
                timestamp: new Date().toISOString(),
            });
        }
    }
    getUpdateType(update) {
        if (update.message)
            return "message";
        if (update.edited_message)
            return "edited_message";
        if (update.channel_post)
            return "channel_post";
        if (update.edited_channel_post)
            return "edited_channel_post";
        if (update.inline_query)
            return "inline_query";
        if (update.chosen_inline_result)
            return "chosen_inline_result";
        if (update.callback_query)
            return "callback_query";
        if (update.shipping_query)
            return "shipping_query";
        if (update.pre_checkout_query)
            return "pre_checkout_query";
        if (update.poll)
            return "poll";
        if (update.poll_answer)
            return "poll_answer";
        if (update.my_chat_member)
            return "my_chat_member";
        if (update.chat_member)
            return "chat_member";
        if (update.chat_join_request)
            return "chat_join_request";
        return "unknown";
    }
    async healthCheck(res) {
        res
            .status(common_1.HttpStatus.OK)
            .json({ status: "ok", timestamp: new Date().toISOString() });
    }
    async getStatus(res) {
        res.status(common_1.HttpStatus.OK).json({
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
};
exports.WebhookController = WebhookController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "getWebhook", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Headers)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "handleWebhook", null);
__decorate([
    (0, common_1.Post)("health"),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "healthCheck", null);
__decorate([
    (0, common_1.Get)("status"),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "getStatus", null);
exports.WebhookController = WebhookController = __decorate([
    (0, common_1.Controller)("webhook"),
    __metadata("design:paramtypes", [logger_service_1.CustomLoggerService])
], WebhookController);
//# sourceMappingURL=webhook.controller.js.map