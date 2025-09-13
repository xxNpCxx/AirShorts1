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
const nestjs_telegraf_1 = require("nestjs-telegraf");
let WebhookController = class WebhookController {
    constructor(logger, bot) {
        this.logger = logger;
        this.bot = bot;
    }
    async handleWebhook(update, res) {
        try {
            this.logger.log(`📥 Webhook получен: update_id=${update.update_id}`, 'WebhookController');
            if (update.message?.text) {
                this.logger.log(`📝 Сообщение: "${update.message.text}" от пользователя ${update.message.from?.id}`, 'WebhookController');
            }
            // Передаем обновление в Telegraf для обработки
            await this.bot.handleUpdate(update);
            this.logger.log(`✅ Webhook обработан успешно`, 'WebhookController');
            res.status(common_1.HttpStatus.OK).json({ ok: true });
        }
        catch (error) {
            this.logger.error(`❌ Ошибка обработки webhook: ${error}`, error instanceof Error ? error.stack : undefined, 'WebhookController');
            res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                ok: false,
                error: 'Internal server error',
            });
        }
    }
};
exports.WebhookController = WebhookController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "handleWebhook", null);
exports.WebhookController = WebhookController = __decorate([
    (0, common_1.Controller)('webhook'),
    __param(1, (0, common_1.Inject)((0, nestjs_telegraf_1.getBotToken)('airshorts1_bot'))),
    __metadata("design:paramtypes", [logger_service_1.CustomLoggerService,
        telegraf_1.Telegraf])
], WebhookController);
