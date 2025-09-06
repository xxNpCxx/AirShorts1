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
var ElevenLabsWebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElevenLabsWebhookController = void 0;
const common_1 = require("@nestjs/common");
const elevenlabs_service_1 = require("./elevenlabs.service");
const voice_notification_service_1 = require("./voice-notification.service");
let ElevenLabsWebhookController = ElevenLabsWebhookController_1 = class ElevenLabsWebhookController {
    constructor(elevenLabsService, voiceNotificationService) {
        this.elevenLabsService = elevenLabsService;
        this.voiceNotificationService = voiceNotificationService;
        this.logger = new common_1.Logger(ElevenLabsWebhookController_1.name);
    }
    async handleWebhook(payload) {
        try {
            this.logger.log(`📨 Received ElevenLabs webhook: ${payload.event} for voice ${payload.voice_id}`);
            this.logger.debug("Webhook payload:", payload);
            switch (payload.event) {
                case "voice.created":
                    await this.handleVoiceCreated(payload);
                    break;
                case "voice.updated":
                    await this.handleVoiceUpdated(payload);
                    break;
                case "voice.deleted":
                    await this.handleVoiceDeleted(payload);
                    break;
                case "voice.failed":
                    await this.handleVoiceFailed(payload);
                    break;
                default:
                    this.logger.warn(`Unknown webhook event: ${payload.event}`);
            }
            return { success: true };
        }
        catch (error) {
            this.logger.error("Error processing ElevenLabs webhook:", error);
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }
    async handleVoiceCreated(payload) {
        this.logger.log(`✅ Voice created successfully: ${payload.voice_id}`);
        // Проверяем статус голоса и уведомляем пользователя
        const voiceStatus = await this.elevenLabsService.getVoiceStatus(payload.voice_id);
        if (voiceStatus.ready) {
            await this.voiceNotificationService.notifyVoiceReady(payload.voice_id);
        }
        else {
            this.logger.log(`Voice ${payload.voice_id} created but not ready yet: ${voiceStatus.status}`);
        }
    }
    async handleVoiceUpdated(payload) {
        this.logger.log(`🔄 Voice updated: ${payload.voice_id}`);
        // Проверяем, готов ли голос после обновления
        const voiceStatus = await this.elevenLabsService.getVoiceStatus(payload.voice_id);
        if (voiceStatus.ready) {
            await this.voiceNotificationService.notifyVoiceReady(payload.voice_id);
        }
    }
    async handleVoiceDeleted(payload) {
        this.logger.log(`🗑️ Voice deleted: ${payload.voice_id}`);
        // Обработка удаления голоса
    }
    async handleVoiceFailed(payload) {
        this.logger.error(`❌ Voice creation failed: ${payload.voice_id}`, {
            error: payload.error,
            status: payload.status
        });
        // Уведомляем пользователя об ошибке
        await this.voiceNotificationService.notifyVoiceError(payload.voice_id, payload.error || "Неизвестная ошибка");
    }
};
exports.ElevenLabsWebhookController = ElevenLabsWebhookController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ElevenLabsWebhookController.prototype, "handleWebhook", null);
exports.ElevenLabsWebhookController = ElevenLabsWebhookController = ElevenLabsWebhookController_1 = __decorate([
    (0, common_1.Controller)("elevenlabs/webhook"),
    __metadata("design:paramtypes", [elevenlabs_service_1.ElevenLabsService,
        voice_notification_service_1.VoiceNotificationService])
], ElevenLabsWebhookController);
