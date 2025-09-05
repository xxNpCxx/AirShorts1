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
const heygen_service_1 = require("../heygen/heygen.service");
const process_manager_service_1 = require("../heygen/process-manager.service");
const common_1 = require("@nestjs/common");
const telegraf_2 = require("telegraf");
const nestjs_telegraf_2 = require("nestjs-telegraf");
let VideoGenerationScene = VideoGenerationScene_1 = class VideoGenerationScene {
    constructor(heygenService, processManager, bot) {
        this.heygenService = heygenService;
        this.processManager = processManager;
        this.bot = bot;
        this.logger = new common_1.Logger(VideoGenerationScene_1.name);
    }
    calculateVideoDuration(text) {
        if (!text || text.trim().length === 0) {
            return 30;
        }
        const wordCount = text.trim().split(/\s+/).length;
        const wordsPerSecond = 2.5;
        let duration = Math.ceil(wordCount / wordsPerSecond);
        duration = Math.ceil(duration * 1.25);
        duration = Math.max(15, Math.min(60, duration));
        return duration;
    }
    async createDigitalTwin(ctx) {
        const requestId = `digital_twin_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        try {
            const session = ctx.session;
            const userId = ctx.from?.id;
            this.logger.log(`🎬 [DIGITAL_TWIN_CREATE] Starting Digital Twin creation`, {
                requestId,
                userId,
                hasPhoto: !!session.photoFileId,
                hasVoice: !!session.voiceFileId,
                hasScript: !!session.script,
                scriptLength: session.script?.length || 0,
                quality: session.quality,
                timestamp: new Date().toISOString()
            });
            if (!session.photoFileId || !session.voiceFileId || !session.script) {
                this.logger.warn(`⚠️ [DIGITAL_TWIN_CREATE] Missing required data`, {
                    requestId,
                    userId,
                    hasPhoto: !!session.photoFileId,
                    hasVoice: !!session.voiceFileId,
                    hasScript: !!session.script,
                    timestamp: new Date().toISOString()
                });
                await ctx.reply("❌ Не все данные получены. Пожалуйста, загрузите фото, голосовое сообщение и введите текст.");
                return;
            }
            this.logger.log(`📁 [DIGITAL_TWIN_CREATE] Getting file URLs from Telegram`, {
                requestId,
                userId,
                photoFileId: session.photoFileId,
                voiceFileId: session.voiceFileId,
                timestamp: new Date().toISOString()
            });
            const photoFile = await ctx.telegram.getFile(session.photoFileId);
            const voiceFile = await ctx.telegram.getFile(session.voiceFileId);
            this.logger.log(`📁 [DIGITAL_TWIN_CREATE] Telegram file info received`, {
                requestId,
                userId,
                photoFile: {
                    fileId: photoFile.file_id,
                    filePath: photoFile.file_path,
                    fileSize: photoFile.file_size
                },
                voiceFile: {
                    fileId: voiceFile.file_id,
                    filePath: voiceFile.file_path,
                    fileSize: voiceFile.file_size
                },
                timestamp: new Date().toISOString()
            });
            if (!photoFile.file_path || !voiceFile.file_path) {
                this.logger.error(`❌ [DIGITAL_TWIN_CREATE] Missing file paths`, {
                    requestId,
                    userId,
                    photoFilePath: photoFile.file_path,
                    voiceFilePath: voiceFile.file_path,
                    timestamp: new Date().toISOString()
                });
                await ctx.reply("❌ Ошибка получения файлов. Попробуйте загрузить файлы заново.");
                return;
            }
            const photoUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${photoFile.file_path}`;
            const audioUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${voiceFile.file_path}`;
            this.logger.log(`🔗 [DIGITAL_TWIN_CREATE] File URLs generated`, {
                requestId,
                userId,
                photoUrl: photoUrl.substring(0, 100) + '...',
                audioUrl: audioUrl.substring(0, 100) + '...',
                timestamp: new Date().toISOString()
            });
            const digitalTwinProcess = await this.processManager.createDigitalTwinProcess(ctx.from.id, photoUrl, audioUrl, session.script, `Digital Twin Video ${new Date().toISOString()}`, session.quality || "720p");
            this.logger.log(`✅ [DIGITAL_TWIN_CREATE] Process created successfully`, {
                requestId,
                userId,
                processId: digitalTwinProcess.id,
                status: digitalTwinProcess.status,
                timestamp: new Date().toISOString()
            });
            await ctx.reply(`🎬 Создание цифрового двойника запущено!\n\n` +
                `📋 ID процесса: ${digitalTwinProcess.id}\n` +
                `📸 Фото: ✅ Загружено\n` +
                `🎵 Голос: ✅ Загружен\n` +
                `📝 Текст: ${session.script.length} символов\n` +
                `🎥 Качество: ${digitalTwinProcess.quality}\n\n` +
                `⏳ Обработка займет 2-5 минут. Вы получите уведомление когда видео будет готово!`);
            this.logger.log(`📤 [DIGITAL_TWIN_CREATE] User notification sent`, {
                requestId,
                userId,
                processId: digitalTwinProcess.id,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            this.logger.error(`❌ [DIGITAL_TWIN_CREATE] Error creating Digital Twin`, {
                requestId,
                userId: ctx.from?.id,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                timestamp: new Date().toISOString()
            });
            await ctx.reply("❌ Ошибка при создании цифрового двойника. Попробуйте еще раз.");
        }
    }
    async onSceneEnter(ctx) {
        this.logger.log(`🎬 [@SceneEnter] Пользователь ${ctx.from?.id} вошел в сцену video-generation`);
        await ctx.reply("🎬 Добро пожаловать в генератор видео!\n\n" +
            "Для создания цифрового двойника мне понадобится:\n" +
            "1. 📸 Фото с человеком\n" +
            "2. 🎵 Голосовое сообщение (ваш голос)\n" +
            "3. 📝 Сценарий ролика (текст для озвучки)\n\n" +
            "🎵 **Голос:** Будет использован ваш голос из голосового сообщения!\n\n" +
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
            this.logger.log("📸 Обработчик фото вызван");
            const photo = ctx.message?.photo;
            if (!photo || photo.length === 0) {
                this.logger.warn("❌ Фото не найдено в ctx.message");
                await ctx.reply("❌ Не удалось получить фото. Попробуйте еще раз.");
                return;
            }
            this.logger.log(`📸 Получено фото: количество=${photo.length}, file_id=${photo[photo.length - 1].file_id}`);
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
                "🎵 Теперь отправьте голосовое сообщение:\n\n" +
                "📋 **Требования к голосовому сообщению:**\n" +
                "• Длительность: 10-60 секунд\n" +
                "• Четкая речь на русском языке\n" +
                "• Минимум фонового шума\n" +
                "• Естественная интонация\n\n" +
                "💡 **Ваш голос будет использован для озвучки видео**\n" +
                "💡 **Советы для лучшего результата:**\n" +
                "• Говорите медленно и четко\n" +
                "• Используйте выразительную интонацию\n" +
                "• Запишите в тихом помещении\n" +
                "• Держите телефон близко к лицу\n\n" +
                "🎤 Нажмите и удерживайте кнопку записи голосового сообщения:");
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
        await ctx.reply("🎵 Аудиофайлы не поддерживаются.\n\n" +
            "🎤 Пожалуйста, отправьте голосовое сообщение вместо аудиофайла.\n\n" +
            "💡 Как записать голосовое сообщение:\n" +
            "• Нажмите и удерживайте кнопку микрофона\n" +
            "• Говорите четко на русском языке\n" +
            "• Длительность: 10-60 секунд");
    }
    async onVoice(ctx) {
        try {
            this.logger.log("🎤 Обработчик голосового сообщения вызван");
            const voice = ctx.message?.voice;
            if (!voice) {
                this.logger.warn("❌ Голосовое сообщение не найдено в ctx.message");
                await ctx.reply("❌ Не удалось получить голосовое сообщение. Попробуйте еще раз.");
                return;
            }
            this.logger.log(`🎤 Получено голосовое сообщение: file_id=${voice.file_id}, duration=${voice.duration}`);
            const session = ctx.session;
            if (!session.photoFileId) {
                await ctx.reply("❌ Сначала отправьте фото с человеком!");
                return;
            }
            if (voice.duration && (voice.duration < 10 || voice.duration > 60)) {
                await ctx.reply(`❌ Длительность голосового сообщения должна быть от 10 до 60 секунд!\n\n` +
                    `Текущая длительность: ${voice.duration} сек.\n\n` +
                    `💡 Запишите голосовое сообщение подходящей длительности.`);
                return;
            }
            session.voiceFileId = voice.file_id;
            await ctx.reply("✅ Голосовое сообщение принято!\n\n" +
                `📊 Информация:\n` +
                `• Длительность: ${voice.duration || '?'} сек.\n` +
                `• Размер: ${voice.file_size ? Math.round(voice.file_size / 1024) + ' КБ' : 'неизвестен'}\n\n` +
                "🎤 Ваш голос будет использован для создания цифрового двойника!\n\n" +
                "📝 Теперь введите текст сценария для озвучки:\n\n" +
                "💡 **Советы:**\n" +
                "• Используйте понятный и интересный текст\n" +
                "• Длина текста должна соответствовать длительности видео\n" +
                "• Избегайте сложных слов и терминов\n" +
                "• Пишите так, как говорите\n\n" +
                "✍️ Введите текст сценария:");
        }
        catch (error) {
            this.logger.error("Error processing voice:", error);
            await ctx.reply("❌ Ошибка при обработке голосового сообщения. Попробуйте еще раз.");
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
            if (!session.photoFileId) {
                await ctx.reply("❌ Сначала отправьте фото с человеком!");
                return;
            }
            if (!session.voiceFileId) {
                await ctx.reply("❌ Сначала отправьте голосовое сообщение!");
                return;
            }
            if (!session.script) {
                session.script = text;
                const calculatedDuration = this.calculateVideoDuration(text);
                session.duration = calculatedDuration;
                this.logger.log(`📝 [TEXT_INPUT] Script received`, {
                    userId: ctx.from?.id,
                    scriptLength: text.length,
                    wordCount: text.trim().split(/\s+/).length,
                    calculatedDuration,
                    timestamp: new Date().toISOString()
                });
                await ctx.reply(`✅ Сценарий принят!\n\n` +
                    `📊 Анализ текста:\n` +
                    `• Количество слов: ${text.trim().split(/\s+/).length}\n` +
                    `• Рассчитанная длительность: ${calculatedDuration} сек.\n\n` +
                    `💡 Длительность рассчитана автоматически на основе количества слов и средней скорости речи для русского языка.\n\n`);
                await this.showQualitySelection(ctx);
            }
            else {
                await ctx.reply("❌ Все необходимые данные уже получены!\n\n" +
                    "📋 Текущий статус:\n" +
                    `• Фото: ✅ Загружено\n` +
                    `• Голос: ✅ Загружен\n` +
                    `• Сценарий: ✅ "${session.script}"\n\n` +
                    "🎬 Используйте кнопки ниже для выбора качества.");
            }
        }
        catch (error) {
            this.logger.error("Error processing text:", error);
            await ctx.reply("❌ Ошибка при обработке текста. Попробуйте еще раз.");
        }
    }
    async showQualitySelection(ctx) {
        await ctx.reply("🎥 Выберите качество видео:", {
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
    async onQuality720Selected(ctx) {
        try {
            await ctx.answerCbQuery();
            const session = ctx.session;
            session.quality = "720p";
            await ctx.editMessageText("✅ Качество выбрано: 720p (быстрее генерация, меньше места)\n\n" +
                "🎬 Запускаю создание цифрового двойника...");
            await this.createDigitalTwin(ctx);
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
            await ctx.editMessageText("✅ Качество выбрано: 1080p (лучшее качество, больше места)\n\n" +
                "🎬 Запускаю создание цифрового двойника...");
            await this.createDigitalTwin(ctx);
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
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], VideoGenerationScene.prototype, "createDigitalTwin", null);
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
], VideoGenerationScene.prototype, "showQualitySelection", null);
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
    __param(2, (0, common_1.Inject)((0, nestjs_telegraf_2.getBotToken)("airshorts1_bot"))),
    __metadata("design:paramtypes", [heygen_service_1.HeyGenService,
        process_manager_service_1.ProcessManagerService,
        telegraf_2.Telegraf])
], VideoGenerationScene);
//# sourceMappingURL=video-generation.scene.js.map