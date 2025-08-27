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
            "📸 **Требования к фото:**\n" +
            "• Один человек в кадре (лицо хорошо видно)\n" +
            "• Размер: до 10 МБ\n" +
            "• Формат: JPG, PNG, WebP\n" +
            "• Разрешение: минимум 512x512 пикселей\n" +
            "• Хорошее освещение, четкость\n" +
            "• Лицо смотрит прямо в камеру\n" +
            "• ⚠️ ВАЖНО: отправьте как ФОТО, а не как файл!\n\n" +
            "💡 **Рекомендации:**\n" +
            "• Портретная ориентация (9:16)\n" +
            "• Лицо занимает 30-50% кадра\n" +
            "• Нейтральное выражение лица\n" +
            "• Минимум фона и отвлекающих элементов\n\n" +
            "Отправьте фото:");
    }
    async onPhoto(ctx) {
        try {
            const photo = ctx.message?.photo;
            if (!photo || photo.length === 0) {
                await ctx.reply("❌ Не удалось получить фото. Попробуйте еще раз.");
                return;
            }
            const bestPhoto = photo[photo.length - 1];
            const photoFileId = bestPhoto.file_id;
            if (bestPhoto.file_size && bestPhoto.file_size > 10 * 1024 * 1024) {
                await ctx.reply("❌ Фото слишком большое! Максимальный размер: 10 МБ\n\n" +
                    "💡 Попробуйте:\n" +
                    "• Сжать фото в настройках камеры\n" +
                    "• Использовать другое фото\n" +
                    "• Отправить как файл и выбрать сжатие");
                return;
            }
            if (bestPhoto.width && bestPhoto.height) {
                if (bestPhoto.width < 512 || bestPhoto.height < 512) {
                    await ctx.reply("❌ Разрешение фото слишком низкое!\n" +
                        `Текущее: ${bestPhoto.width}x${bestPhoto.height}\n` +
                        "Минимум: 512x512 пикселей\n\n" +
                        "Отправьте фото лучшего качества.");
                    return;
                }
                const aspectRatio = bestPhoto.height / bestPhoto.width;
                if (aspectRatio < 1.5) {
                    await ctx.reply("⚠️ Фото принято, но рекомендуется портретная ориентация!\n\n" +
                        `Текущее соотношение: ${bestPhoto.width}x${bestPhoto.height}\n` +
                        "Рекомендуется: 9:16 (например, 1080x1920)\n\n" +
                        "Для лучшего результата используйте вертикальное фото.");
                }
            }
            try {
                const file = await ctx.telegram.getFile(photoFileId);
                if (file.file_path) {
                    const fileExtension = file.file_path.split('.').pop()?.toLowerCase();
                    const allowedFormats = ['jpg', 'jpeg', 'png', 'webp'];
                    if (!fileExtension || !allowedFormats.includes(fileExtension)) {
                        await ctx.reply("❌ Неподдерживаемый формат файла!\n\n" +
                            `Обнаружен: ${fileExtension || 'неизвестный'}\n` +
                            "Поддерживаются: JPG, PNG, WebP\n\n" +
                            "Отправьте фото в поддерживаемом формате.");
                        return;
                    }
                }
            }
            catch (fileError) {
                this.logger.warn("Could not validate file format:", fileError);
            }
            ctx.session.photoFileId = photoFileId;
            await ctx.reply("✅ Фото принято и прошло валидацию!\n\n" +
                `📊 Информация:\n` +
                `• Разрешение: ${bestPhoto.width || '?'}x${bestPhoto.height || '?'}\n` +
                `• Размер: ${bestPhoto.file_size ? Math.round(bestPhoto.file_size / 1024) + ' КБ' : 'неизвестен'}\n\n` +
                "🎵 Теперь отправьте голосовую запись (до 1 минуты):");
        }
        catch (error) {
            this.logger.error("Error processing photo:", error);
            await ctx.reply("❌ Ошибка при обработке фото. Попробуйте еще раз.");
        }
    }
    async onDocument(ctx) {
        try {
            const message = ctx.message;
            if (message && "document" in message && message.document) {
                const document = message.document;
                const isImage = document.mime_type && (document.mime_type.startsWith("image/") ||
                    ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(document.mime_type));
                if (isImage) {
                    await ctx.reply("📸 Обнаружено изображение, отправленное как файл!\n\n" +
                        "❌ Пожалуйста, отправьте фото как изображение, а не как документ.\n\n" +
                        "💡 Как правильно отправить:\n" +
                        "• Нажмите на значок 📎 (скрепка)\n" +
                        "• Выберите 'Фото или видео'\n" +
                        "• Выберите фото из галереи\n" +
                        "• НЕ нажимайте 'Отправить как файл'\n\n" +
                        "🔄 Попробуйте отправить фото заново:");
                }
                else {
                    await ctx.reply("❌ Документы не поддерживаются.\n\n" +
                        "📸 Пожалуйста, отправьте фото с человеком.");
                }
            }
        }
        catch (error) {
            this.logger.error("Error processing document:", error);
            await ctx.reply("❌ Ошибка при обработке файла. Отправьте фото как изображение.");
        }
    }
    async onVideo(ctx) {
        await ctx.reply("🎥 Видео не поддерживается.\n\n" +
            "📸 Пожалуйста, отправьте фото с человеком (как изображение).");
    }
    async onAudio(ctx) {
        await ctx.reply("🎵 Обычные аудиофайлы не поддерживаются.\n\n" +
            "🎤 Пожалуйста, отправьте голосовое сообщение (удерживайте кнопку микрофона).");
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
                        { text: "📱 Короткие вертикальные видео", callback_data: "platform_youtube_shorts" }
                    ],
                    [
                        { text: "📺 Социальные сети (скоро)", callback_data: "platform_tiktok" }
                    ],
                    [
                        { text: "📸 Истории и рилс (скоро)", callback_data: "platform_instagram_reels" }
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
        await ctx.reply("✅ Длительность выбрана! Теперь выберите качество видео:", {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🎥 720p (быстрее)", callback_data: "quality_720p" },
                        { text: "🏆 1080p (лучше)", callback_data: "quality_1080p" }
                    ],
                    [
                        { text: "❌ Отмена", callback_data: "cancel_video_generation" }
                    ]
                ]
            }
        });
    }
    async showTextPromptInput(ctx) {
        await ctx.reply("✅ Качество выбрано! Теперь добавьте текстовый промпт для улучшения генерации:\n\n" +
            '💡 Например: "Создай видео с динамичными движениями и яркими переходами"\n\n' +
            'Или просто напишите "нет" если промпт не нужен:');
    }
    async startVideoGeneration(ctx) {
        try {
            const session = ctx.session;
            await ctx.reply("🚀 Начинаю генерацию видео...\n\n" +
                "Это может занять несколько минут. Пожалуйста, подождите.");
            let photoUrl = "";
            let audioUrl = "";
            if (session.photoFileId) {
                try {
                    const photoFile = await ctx.telegram.getFile(session.photoFileId);
                    if (photoFile.file_path) {
                        photoUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${photoFile.file_path}`;
                    }
                }
                catch (error) {
                    this.logger.error("Error getting photo URL:", error);
                    await ctx.reply("❌ Ошибка получения фото. Попробуйте загрузить фото заново.");
                    return;
                }
            }
            if (session.audioFileId) {
                try {
                    const audioFile = await ctx.telegram.getFile(session.audioFileId);
                    if (audioFile.file_path) {
                        audioUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${audioFile.file_path}`;
                    }
                }
                catch (error) {
                    this.logger.error("Error getting audio URL:", error);
                    await ctx.reply("❌ Ошибка получения аудио. Попробуйте загрузить аудио заново.");
                    return;
                }
            }
            const request = {
                photoUrl: photoUrl,
                audioUrl: audioUrl,
                script: session.script || "",
                platform: session.platform || "youtube-shorts",
                duration: session.duration || 30,
                quality: session.quality || "720p",
                textPrompt: session.textPrompt,
            };
            this.logger.log(`Starting D-ID generation with photoUrl: ${photoUrl ? 'PROVIDED' : 'MISSING'}, audioUrl: ${audioUrl ? 'PROVIDED' : 'MISSING'}`);
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
            await ctx.editMessageText("✅ Платформа выбрана: Короткие вертикальные видео");
            await this.showDurationSelection(ctx);
        }
        catch (error) {
            this.logger.error("Error selecting YouTube Shorts:", error);
            await ctx.answerCbQuery("❌ Ошибка выбора платформы");
        }
    }
    async onTikTokSelected(ctx) {
        try {
            await ctx.answerCbQuery("❌ Эта платформа пока не поддерживается");
        }
        catch (error) {
            this.logger.error("Error selecting TikTok:", error);
        }
    }
    async onInstagramReelsSelected(ctx) {
        try {
            await ctx.answerCbQuery("❌ Эта платформа пока не поддерживается");
        }
        catch (error) {
            this.logger.error("Error selecting Instagram Reels:", error);
        }
    }
    async onQuality720Selected(ctx) {
        try {
            await ctx.answerCbQuery();
            const session = ctx.session;
            session.quality = "720p";
            await ctx.editMessageText("✅ Качество выбрано: 720p (быстрее генерация, меньше места)");
            await this.showTextPromptInput(ctx);
        }
        catch (error) {
            this.logger.error("Error selecting 720p quality:", error);
            await ctx.answerCbQuery("❌ Ошибка выбора качества");
        }
    }
    async onQuality1080Selected(ctx) {
        try {
            await ctx.answerCbQuery();
            const session = ctx.session;
            session.quality = "1080p";
            await ctx.editMessageText("✅ Качество выбрано: 1080p (лучшее качество, больше места)");
            await this.showTextPromptInput(ctx);
        }
        catch (error) {
            this.logger.error("Error selecting 1080p quality:", error);
            await ctx.answerCbQuery("❌ Ошибка выбора качества");
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
    (0, nestjs_telegraf_1.On)("document"),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], VideoGenerationScene.prototype, "onDocument", null);
__decorate([
    (0, nestjs_telegraf_1.On)("video"),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], VideoGenerationScene.prototype, "onVideo", null);
__decorate([
    (0, nestjs_telegraf_1.On)("audio"),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], VideoGenerationScene.prototype, "onAudio", null);
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
    (0, nestjs_telegraf_1.Action)("quality_720p"),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], VideoGenerationScene.prototype, "onQuality720Selected", null);
__decorate([
    (0, nestjs_telegraf_1.Action)("quality_1080p"),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], VideoGenerationScene.prototype, "onQuality1080Selected", null);
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