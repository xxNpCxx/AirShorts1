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
var VideoGenerationScene_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoGenerationScene = void 0;
const nestjs_telegraf_1 = require("nestjs-telegraf");
const telegraf_1 = require("telegraf");
const did_service_1 = require("../d-id/did.service");
const common_1 = require("@nestjs/common");
let VideoGenerationScene = VideoGenerationScene_1 = class VideoGenerationScene {
    constructor(didService) {
        this.didService = didService;
        this.logger = new common_1.Logger(VideoGenerationScene_1.name);
    }
    async onSceneEnter(ctx) {
        await ctx.reply("🎬 Добро пожаловать в генератор видео!\n\n" +
            "Для создания видео мне понадобится:\n" +
            "1. 📸 Фото с человеком\n" +
            "2. 🎵 Голосовая запись (до 1 минуты)\n" +
            "3. 📝 Сценарий ролика\n" +
            "4. ⚙️ Настройки видео\n\n" +
            "Начнем с загрузки фото. Отправьте фото с человеком:");
    }
    async onPhoto(ctx) {
        try {
            const photo = ctx.message?.photo;
            if (!photo || photo.length === 0) {
                await ctx.reply("❌ Не удалось получить фото. Попробуйте еще раз.");
                return;
            }
            const photoFileId = photo[photo.length - 1].file_id;
            ctx.session.photoFileId = photoFileId;
            await ctx.reply("✅ Фото получено! Теперь отправьте голосовую запись (до 1 минуты):");
        }
        catch (error) {
            this.logger.error("Error processing photo:", error);
            await ctx.reply("❌ Ошибка при обработке фото. Попробуйте еще раз.");
        }
    }
    async onVoice(ctx) {
        try {
            const voice = ctx.message?.voice;
            if (!voice) {
                await ctx.reply("❌ Не удалось получить голосовую запись. Попробуйте еще раз.");
                return;
            }
            if (voice.duration > 60) {
                await ctx.reply("❌ Голосовая запись слишком длинная. Максимум 60 секунд.");
                return;
            }
            ctx.session.audioFileId = voice.file_id;
            await ctx.reply("✅ Голосовая запись получена! Теперь отправьте сценарий ролика текстом:");
        }
        catch (error) {
            this.logger.error("Error processing voice:", error);
            await ctx.reply("❌ Ошибка при обработке голосовой записи. Попробуйте еще раз.");
        }
    }
    async onText(ctx) {
        try {
            const text = ctx.message?.text;
            if (!text) {
                await ctx.reply("❌ Не удалось получить текст. Попробуйте еще раз.");
                return;
            }
            const session = ctx.session;
            if (!session.script) {
                session.script = text;
                await this.showPlatformSelection(ctx);
            }
            else if (!session.duration) {
                const duration = parseInt(text);
                if (isNaN(duration) || duration < 15 || duration > 60) {
                    await ctx.reply("❌ Длительность должна быть от 15 до 60 секунд. Попробуйте еще раз.");
                    return;
                }
                session.duration = duration;
                await this.showQualitySelection(ctx);
            }
            else if (!session.quality) {
                if (text.toLowerCase().includes("720") ||
                    text.toLowerCase().includes("720p")) {
                    session.quality = "720p";
                }
                else if (text.toLowerCase().includes("1080") ||
                    text.toLowerCase().includes("1080p")) {
                    session.quality = "720p";
                }
                else {
                    await ctx.reply("❌ Выберите качество: 720p или 1080p");
                    return;
                }
                await this.showTextPromptInput(ctx);
            }
            else if (!session.textPrompt) {
                session.textPrompt = text;
                await this.startVideoGeneration(ctx);
            }
        }
        catch (error) {
            this.logger.error("Error processing text:", error);
            await ctx.reply("❌ Ошибка при обработке текста. Попробуйте еще раз.");
        }
    }
    async showPlatformSelection(ctx) {
        await ctx.reply("✅ Сценарий получен! Теперь выберите платформу:", {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "📱 YouTube Shorts", callback_data: "platform_youtube_shorts" }
                    ],
                    [
                        { text: "📺 TikTok", callback_data: "platform_tiktok" }
                    ],
                    [
                        { text: "📸 Instagram Reels", callback_data: "platform_instagram_reels" }
                    ],
                    [
                        { text: "❌ Отмена", callback_data: "cancel_video_generation" }
                    ]
                ]
            }
        });
    }
    async showDurationSelection(ctx) {
        await ctx.reply("✅ Платформа выбрана! Теперь укажите длительность видео в секундах:\n\n" +
            "📏 От 15 до 60 секунд (рекомендуется 15-30 для Shorts)\n\n" +
            "Введите число секунд:");
    }
    async showQualitySelection(ctx) {
        await ctx.reply("✅ Длительность выбрана! Теперь выберите качество видео:\n\n" +
            "🎥 720p - быстрее, меньше места\n" +
            "🎥 1080p - лучше качество, больше места\n\n" +
            'Напишите "720p" или "1080p":');
    }
    async showTextPromptInput(ctx) {
        await ctx.reply("✅ Качество выбрано! Теперь добавьте текстовый промпт для улучшения генерации:\n\n" +
            '💡 Например: "Создай видео в стиле YouTube Shorts с динамичными движениями"\n\n' +
            'Или просто напишите "нет" если промпт не нужен:');
    }
    async startVideoGeneration(ctx) {
        try {
            const session = ctx.session;
            await ctx.reply("🚀 Начинаю генерацию видео...\n\n" +
                "Это может занять несколько минут. Пожалуйста, подождите.");
            const request = {
                photoUrl: session.photoFileId || "",
                audioUrl: session.audioFileId || "",
                script: session.script || "",
                platform: session.platform || "youtube-shorts",
                duration: session.duration || 30,
                quality: session.quality || "720p",
                textPrompt: session.textPrompt,
            };
            const result = await this.didService.generateVideo(request);
            await ctx.reply("✅ Видео успешно создано!\n\n" +
                `🆔 ID: ${result.id}\n` +
                `📊 Статус: ${result.status}\n\n` +
                "Видео будет готово через несколько минут. " +
                "Вы получите уведомление когда оно будет готово.");
            await ctx.scene?.leave();
        }
        catch (error) {
            this.logger.error("Error starting video generation:", error);
            await ctx.reply(`❌ Ошибка при создании видео:\n${error.message}\n\n` +
                `Попробуйте еще раз или обратитесь к администратору.`);
        }
    }
    async onYouTubeShortsSelected(ctx) {
        try {
            await ctx.answerCbQuery();
            const session = ctx.session;
            session.platform = "youtube-shorts";
            await ctx.editMessageText("✅ Платформа выбрана: YouTube Shorts");
            await this.showDurationSelection(ctx);
        }
        catch (error) {
            this.logger.error("Error selecting YouTube Shorts:", error);
            await ctx.answerCbQuery("❌ Ошибка выбора платформы");
        }
    }
    async onTikTokSelected(ctx) {
        try {
            await ctx.answerCbQuery("❌ TikTok пока не поддерживается");
        }
        catch (error) {
            this.logger.error("Error selecting TikTok:", error);
        }
    }
    async onInstagramReelsSelected(ctx) {
        try {
            await ctx.answerCbQuery("❌ Instagram Reels пока не поддерживается");
        }
        catch (error) {
            this.logger.error("Error selecting Instagram Reels:", error);
        }
    }
    async onCancelVideoGeneration(ctx) {
        try {
            await ctx.answerCbQuery();
            await ctx.editMessageText("❌ Создание видео отменено.");
            await ctx.scene?.leave();
        }
        catch (error) {
            this.logger.error("Error canceling video generation:", error);
            await ctx.answerCbQuery("❌ Ошибка отмены");
        }
    }
    async onCancel(ctx) {
        await ctx.reply("❌ Создание видео отменено.");
        await ctx.scene?.leave();
    }
};
exports.VideoGenerationScene = VideoGenerationScene;
__decorate([
    (0, nestjs_telegraf_1.SceneEnter)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], VideoGenerationScene.prototype, "onSceneEnter", null);
__decorate([
    (0, nestjs_telegraf_1.On)("photo"),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VideoGenerationScene.prototype, "onPhoto", null);
__decorate([
    (0, nestjs_telegraf_1.On)("voice"),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VideoGenerationScene.prototype, "onVoice", null);
__decorate([
    (0, nestjs_telegraf_1.On)("text"),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VideoGenerationScene.prototype, "onText", null);
__decorate([
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], VideoGenerationScene.prototype, "showPlatformSelection", null);
__decorate([
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], VideoGenerationScene.prototype, "showDurationSelection", null);
__decorate([
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], VideoGenerationScene.prototype, "showQualitySelection", null);
__decorate([
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], VideoGenerationScene.prototype, "showTextPromptInput", null);
__decorate([
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], VideoGenerationScene.prototype, "startVideoGeneration", null);
__decorate([
    (0, nestjs_telegraf_1.Action)("platform_youtube_shorts"),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], VideoGenerationScene.prototype, "onYouTubeShortsSelected", null);
__decorate([
    (0, nestjs_telegraf_1.Action)("platform_tiktok"),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], VideoGenerationScene.prototype, "onTikTokSelected", null);
__decorate([
    (0, nestjs_telegraf_1.Action)("platform_instagram_reels"),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], VideoGenerationScene.prototype, "onInstagramReelsSelected", null);
__decorate([
    (0, nestjs_telegraf_1.Action)("cancel_video_generation"),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], VideoGenerationScene.prototype, "onCancelVideoGeneration", null);
__decorate([
    (0, nestjs_telegraf_1.Action)("cancel"),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], VideoGenerationScene.prototype, "onCancel", null);
exports.VideoGenerationScene = VideoGenerationScene = VideoGenerationScene_1 = __decorate([
    (0, nestjs_telegraf_1.Scene)("video-generation"),
    __metadata("design:paramtypes", [did_service_1.DidService])
], VideoGenerationScene);
//# sourceMappingURL=video-generation.scene.js.map