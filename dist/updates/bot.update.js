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
exports.BotUpdate = void 0;
const nestjs_telegraf_1 = require("nestjs-telegraf");
const users_service_1 = require("../users/users.service");
const menu_service_1 = require("../menu/menu.service");
const keyboards_service_1 = require("../keyboards/keyboards.service");
const logger_service_1 = require("../logger/logger.service");
const telegraf_1 = require("telegraf");
let BotUpdate = class BotUpdate {
    constructor(_users, _menu, _kb, _logger) {
        this._users = _users;
        this._menu = _menu;
        this._kb = _kb;
        this._logger = _logger;
        this._logger.debug("BotUpdate инициализирован", "BotUpdate");
        this._logger.log("🚀 BotUpdate создан и готов к работе", "BotUpdate");
    }
    async onStart(ctx) {
        this._logger.log(`🚀 [@Start] Команда /start получена от пользователя ${ctx.from?.id}`, "BotUpdate");
        try {
            await ctx.reply("🎉 Бот работает! Команда /start обработана!");
            this._logger.log("✅ Тестовое сообщение отправлено", "BotUpdate");
        }
        catch (error) {
            this._logger.error(`❌ Ошибка отправки тестового сообщения: ${error}`, undefined, "BotUpdate");
        }
        try {
            await this._users.upsertFromContext(ctx);
            this._logger.debug("Пользователь обновлен в базе данных", "BotUpdate");
            await this._menu.sendMainMenu(ctx);
            this._logger.debug("Главное меню отправлено", "BotUpdate");
        }
        catch (error) {
            this._logger.error(`Ошибка при обработке команды /start: ${error}`, undefined, "BotUpdate");
            await ctx.reply("❌ Произошла ошибка при запуске бота. Попробуйте еще раз.");
        }
    }
    async onText(ctx) {
        const messageText = ctx.message && "text" in ctx.message ? ctx.message.text : "";
        if (messageText === "/start") {
            this._logger.log(`🚀 [@On text] Команда /start получена от пользователя ${ctx.from?.id}`, "BotUpdate");
            this._logger.log(`📝 [@On text] Текст сообщения: "${messageText}"`, "BotUpdate");
            try {
                await ctx.reply("🎉 Бот работает! Команда /start обработана через @On text!");
                this._logger.log("✅ Тестовое сообщение отправлено через @On text", "BotUpdate");
            }
            catch (error) {
                this._logger.error(`❌ Ошибка отправки тестового сообщения через @On text: ${error}`, undefined, "BotUpdate");
            }
            try {
                await this._users.upsertFromContext(ctx);
                this._logger.debug("Пользователь обновлен в базе данных", "BotUpdate");
                await this._menu.sendMainMenu(ctx);
                this._logger.debug("Главное меню отправлено", "BotUpdate");
            }
            catch (error) {
                this._logger.error(`Ошибка при обработке команды /start через @On text: ${error}`, undefined, "BotUpdate");
                await ctx.reply("❌ Произошла ошибка при запуске бота. Попробуйте еще раз.");
            }
            return;
        }
        if (messageText?.startsWith("/")) {
            this._logger.debug(`[@On text] Пропускаем команду: "${messageText}"`, "BotUpdate");
            return;
        }
        const hearsMessages = ["🏠 Главное меню", "Главное меню"];
        if (hearsMessages.includes(messageText)) {
            this._logger.debug(`[@On text] Обнаружено сообщение главного меню: "${messageText}" - выход из сцены и показ главного меню`, "BotUpdate");
            await this.onMainMenu(ctx);
            return;
        }
        const sceneContext = ctx;
        if (sceneContext.scene?.current) {
            this._logger.debug(`[@On text] Пользователь ${ctx.from?.id} находится в сцене "${sceneContext.scene.current.id}", пропускаем обработку в BotUpdate`, "BotUpdate");
            return;
        }
        this._logger.debug(`[@On text] Текстовое сообщение получено: "${messageText}" от пользователя ${ctx.from?.id} (вне сцены)`, "BotUpdate");
        this._logger.debug(`[@On text] Неизвестное сообщение: "${messageText}"`, "BotUpdate");
    }
    async onMainMenu(ctx) {
        const messageText = ctx.message && "text" in ctx.message ? ctx.message.text : "";
        this._logger.log(`🏠 [@Hears] Главное меню запрошено пользователем ${ctx.from?.id}, текст: "${messageText}"`, "BotUpdate");
        try {
            const sceneContext = ctx;
            if (sceneContext.scene?.current) {
                this._logger.log(`🚪 Выходим из сцены "${sceneContext.scene.current.id}" для пользователя ${ctx.from?.id}`, "BotUpdate");
                await sceneContext.scene.leave();
                this._logger.debug("Сцена успешно завершена", "BotUpdate");
            }
            await this._users.upsertFromContext(ctx);
            await this._menu.sendMainMenu(ctx);
            this._logger.debug("Главное меню отправлено через @Hears", "BotUpdate");
        }
        catch (error) {
            this._logger.error(`❌ Ошибка при обработке главного меню: ${error}`, undefined, "BotUpdate");
            await ctx.reply("❌ Произошла ошибка при загрузке главного меню");
        }
    }
    async onMainMenuAction(ctx) {
        this._logger.log(`🏠 [@Action] Главное меню запрошено через inline кнопку пользователем ${ctx.from?.id}`, "BotUpdate");
        try {
            await ctx.answerCbQuery();
            const sceneContext = ctx;
            if (sceneContext.scene?.current) {
                this._logger.log(`🚪 Выходим из сцены "${sceneContext.scene.current.id}" для пользователя ${ctx.from?.id}`, "BotUpdate");
                await sceneContext.scene.leave();
                this._logger.debug("Сцена успешно завершена через @Action", "BotUpdate");
            }
            await this._menu.sendMainMenu(ctx);
            this._logger.debug("Главное меню отправлено через @Action", "BotUpdate");
        }
        catch (error) {
            this._logger.error(`❌ Ошибка при обработке главного меню через @Action: ${error}`, undefined, "BotUpdate");
            await ctx.answerCbQuery("❌ Произошла ошибка");
        }
    }
    async onMyId(ctx) {
        if (!ctx.from) {
            await ctx.reply("❌ Не удалось получить данные пользователя");
            return;
        }
        const userId = ctx.from.id;
        const username = ctx.from.username || "не задан";
        const firstName = ctx.from.first_name || "";
        const lastName = ctx.from.last_name || "";
        const message = `🆔 Ваши данные:\n\n` +
            `📱 Chat ID: \`${userId}\`\n` +
            `👤 Username: @${username}\n` +
            `📝 Имя: ${firstName} ${lastName}\n\n` +
            `💡 Для копирования Chat ID выделите число выше`;
        await ctx.reply(message, { parse_mode: "Markdown" });
    }
    async onMyIdHears(ctx) {
        return this.onMyId(ctx);
    }
    async onCreateVideo(ctx) {
        await ctx.answerCbQuery();
        await ctx.scene.enter("video-generation");
    }
    async onServiceSettings(ctx) {
        await ctx.answerCbQuery();
        if (!ctx.from?.id) {
            await ctx.reply("❌ Ошибка получения данных пользователя");
            return;
        }
        const currentService = await this._users.getUserPreferredService(ctx.from.id);
        const serviceNames = {
            'did': '🤖 ИИ-Аватар (D-ID)',
            'heygen': '👤 Цифровой двойник (HeyGen)'
        };
        await ctx.editMessageText(`⚙️ **Настройки сервиса генерации видео**\n\n` +
            `Текущий сервис: ${serviceNames[currentService]}\n\n` +
            `🤖 **ИИ-Аватар (D-ID):**\n` +
            `• Быстрая генерация\n` +
            `• Качественная синхронизация губ\n` +
            `• Поддержка клонирования голоса\n\n` +
            `👤 **Цифровой двойник (HeyGen):**\n` +
            `• Более реалистичные движения\n` +
            `• Профессиональное качество\n` +
            `• Расширенные возможности персонализации\n\n` +
            `Выберите предпочтительный сервис:`, {
            parse_mode: "Markdown",
            reply_markup: this._kb.serviceSettings().reply_markup,
        });
    }
    async onSetServiceDid(ctx) {
        await ctx.answerCbQuery("🤖 ИИ-Аватар (D-ID) выбран!");
        if (!ctx.from?.id) {
            await ctx.reply("❌ Ошибка получения данных пользователя");
            return;
        }
        const success = await this._users.setUserPreferredService(ctx.from.id, 'did');
        if (!success) {
            await ctx.reply("❌ Не удалось сохранить настройки. Попробуйте позже.");
            return;
        }
        await ctx.editMessageText(`✅ **Сервис успешно изменен!**\n\n` +
            `🤖 Теперь используется: **ИИ-Аватар (D-ID)**\n\n` +
            `Особенности:\n` +
            `• Быстрая генерация видео\n` +
            `• Качественная синхронизация губ\n` +
            `• Поддержка клонирования голоса\n` +
            `• Оптимизировано для коротких роликов\n\n` +
            `🎬 Теперь можете создавать видео!`, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🎬 Создать видео", callback_data: "create_video" }],
                    [{ text: "🔙 Назад в меню", callback_data: "main_menu" }],
                ]
            }
        });
    }
    async onSetServiceHeyGen(ctx) {
        await ctx.answerCbQuery("👤 Цифровой двойник (HeyGen) выбран!");
        if (!ctx.from?.id) {
            await ctx.reply("❌ Ошибка получения данных пользователя");
            return;
        }
        const success = await this._users.setUserPreferredService(ctx.from.id, 'heygen');
        if (!success) {
            await ctx.reply("❌ Не удалось сохранить настройки. Попробуйте позже.");
            return;
        }
        await ctx.editMessageText(`✅ **Сервис успешно изменен!**\n\n` +
            `👤 Теперь используется: **Цифровой двойник (HeyGen)**\n\n` +
            `Особенности:\n` +
            `• Более реалистичные движения\n` +
            `• Профессиональное качество видео\n` +
            `• Расширенные возможности персонализации\n` +
            `• Продвинутая технология создания аватаров\n\n` +
            `🎬 Теперь можете создавать видео!`, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🎬 Создать видео", callback_data: "create_video" }],
                    [{ text: "🔙 Назад в меню", callback_data: "main_menu" }],
                ]
            }
        });
    }
};
exports.BotUpdate = BotUpdate;
__decorate([
    (0, nestjs_telegraf_1.Start)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onStart", null);
__decorate([
    (0, nestjs_telegraf_1.On)("text"),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onText", null);
__decorate([
    (0, nestjs_telegraf_1.Hears)(["🏠 Главное меню", "Главное меню"]),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onMainMenu", null);
__decorate([
    (0, nestjs_telegraf_1.Action)("main_menu"),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onMainMenuAction", null);
__decorate([
    (0, nestjs_telegraf_1.Command)("myid"),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onMyId", null);
__decorate([
    (0, nestjs_telegraf_1.Hears)(/^myid$/i),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onMyIdHears", null);
__decorate([
    (0, nestjs_telegraf_1.Action)("create_video"),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onCreateVideo", null);
__decorate([
    (0, nestjs_telegraf_1.Action)("service_settings"),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onServiceSettings", null);
__decorate([
    (0, nestjs_telegraf_1.Action)("set_service_did"),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onSetServiceDid", null);
__decorate([
    (0, nestjs_telegraf_1.Action)("set_service_heygen"),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onSetServiceHeyGen", null);
exports.BotUpdate = BotUpdate = __decorate([
    (0, nestjs_telegraf_1.Update)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        menu_service_1.MenuService,
        keyboards_service_1.KeyboardsService,
        logger_service_1.CustomLoggerService])
], BotUpdate);
//# sourceMappingURL=bot.update.js.map