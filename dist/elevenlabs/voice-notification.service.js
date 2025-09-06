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
var VoiceNotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceNotificationService = void 0;
const common_1 = require("@nestjs/common");
const telegraf_1 = require("telegraf");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const common_2 = require("@nestjs/common");
let VoiceNotificationService = VoiceNotificationService_1 = class VoiceNotificationService {
    constructor(bot) {
        this.bot = bot;
        this.logger = new common_1.Logger(VoiceNotificationService_1.name);
        this.pendingNotifications = new Map();
    }
    /**
     * Регистрирует ожидающее уведомление о готовности голоса
     */
    registerVoiceNotification(userId, chatId, voiceId, voiceName) {
        const notificationData = {
            userId,
            chatId,
            voiceId,
            voiceName,
            status: "processing"
        };
        this.pendingNotifications.set(voiceId, notificationData);
        this.logger.log(`Registered voice notification for user ${userId}, voice ${voiceId}`);
    }
    /**
     * Отправляет уведомление пользователю о готовности голоса
     */
    async notifyVoiceReady(voiceId) {
        const notification = this.pendingNotifications.get(voiceId);
        if (!notification) {
            this.logger.warn(`No pending notification found for voice ${voiceId}`);
            return;
        }
        try {
            await this.bot.telegram.sendMessage(notification.chatId, `🎉 Ваш клонированный голос готов!\n\n` +
                `🎤 Голос: ${notification.voiceName}\n` +
                `🆔 ID: ${voiceId.substring(0, 8)}...\n\n` +
                `✅ Теперь вы можете создавать видео с вашим голосом!\n\n` +
                `💡 Перейдите в меню создания видео для продолжения.`);
            this.pendingNotifications.delete(voiceId);
            this.logger.log(`Voice ready notification sent to user ${notification.userId}`);
        }
        catch (error) {
            this.logger.error(`Failed to send voice ready notification to user ${notification.userId}:`, error);
        }
    }
    /**
     * Отправляет уведомление пользователю об ошибке клонирования голоса
     */
    async notifyVoiceError(voiceId, error) {
        const notification = this.pendingNotifications.get(voiceId);
        if (!notification) {
            this.logger.warn(`No pending notification found for voice ${voiceId}`);
            return;
        }
        try {
            await this.bot.telegram.sendMessage(notification.chatId, `❌ Ошибка при клонировании голоса\n\n` +
                `🎤 Голос: ${notification.voiceName}\n` +
                `🆔 ID: ${voiceId.substring(0, 8)}...\n\n` +
                `⚠️ Причина: ${error}\n\n` +
                `🔄 Вы можете попробовать загрузить голос заново или использовать синтетический голос.`);
            this.pendingNotifications.delete(voiceId);
            this.logger.log(`Voice error notification sent to user ${notification.userId}`);
        }
        catch (error) {
            this.logger.error(`Failed to send voice error notification to user ${notification.userId}:`, error);
        }
    }
    /**
     * Получает список ожидающих уведомлений
     */
    getPendingNotifications() {
        return Array.from(this.pendingNotifications.values());
    }
    /**
     * Очищает старые уведомления (старше 24 часов)
     */
    cleanupOldNotifications() {
        // В реальном приложении здесь можно добавить логику очистки старых уведомлений
        // Пока оставляем простую реализацию
        this.logger.debug(`Current pending notifications: ${this.pendingNotifications.size}`);
    }
};
exports.VoiceNotificationService = VoiceNotificationService;
exports.VoiceNotificationService = VoiceNotificationService = VoiceNotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_2.Inject)((0, nestjs_telegraf_1.getBotToken)("airshorts1_bot"))),
    __metadata("design:paramtypes", [telegraf_1.Telegraf])
], VoiceNotificationService);
