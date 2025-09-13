"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
const process_manager_service_1 = require("../heygen/process-manager.service");
const telegraf_1 = require("telegraf");
let BotUpdate = class BotUpdate {
    constructor(_users, _menu, _kb, _logger, _processManager) {
        this._users = _users;
        this._menu = _menu;
        this._kb = _kb;
        this._logger = _logger;
        this._processManager = _processManager;
        this._logger.debug('BotUpdate инициализирован', 'BotUpdate');
        this._logger.log('🚀 BotUpdate создан и готов к работе', 'BotUpdate');
    }
    async onStart(ctx) {
        this._logger.log(`🚀 [@Start] Команда /start получена от пользователя ${ctx.from?.id}`, 'BotUpdate');
        // Отправляем простое сообщение для тестирования
        try {
            await ctx.reply('🎉 Бот работает! Команда /start обработана!');
            this._logger.log('✅ Тестовое сообщение отправлено', 'BotUpdate');
        }
        catch (error) {
            this._logger.error(`❌ Ошибка отправки тестового сообщения: ${error}`, undefined, 'BotUpdate');
        }
        try {
            await this._users.upsertFromContext(ctx);
            this._logger.debug('Пользователь обновлен в базе данных', 'BotUpdate');
            await this._menu.sendMainMenu(ctx);
            this._logger.debug('Главное меню отправлено', 'BotUpdate');
        }
        catch (error) {
            this._logger.error(`Ошибка при обработке команды /start: ${error}`, undefined, 'BotUpdate');
            await ctx.reply('❌ Произошла ошибка при запуске бота. Попробуйте еще раз.');
        }
    }
    // Обработчик для всех текстовых сообщений (кроме команд)
    async onText(ctx) {
        const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
        // Проверяем, является ли сообщение командой /start
        if (messageText === '/start') {
            this._logger.log(`🚀 [@On text] Команда /start получена от пользователя ${ctx.from?.id}`, 'BotUpdate');
            this._logger.log(`📝 [@On text] Текст сообщения: "${messageText}"`, 'BotUpdate');
            // Отправляем простое сообщение для тестирования
            try {
                await ctx.reply('🎉 Бот работает! Команда /start обработана через @On text!');
                this._logger.log('✅ Тестовое сообщение отправлено через @On text', 'BotUpdate');
            }
            catch (error) {
                this._logger.error(`❌ Ошибка отправки тестового сообщения через @On text: ${error}`, undefined, 'BotUpdate');
            }
            try {
                await this._users.upsertFromContext(ctx);
                this._logger.debug('Пользователь обновлен в базе данных', 'BotUpdate');
                await this._menu.sendMainMenu(ctx);
                this._logger.debug('Главное меню отправлено', 'BotUpdate');
            }
            catch (error) {
                this._logger.error(`Ошибка при обработке команды /start через @On text: ${error}`, undefined, 'BotUpdate');
                await ctx.reply('❌ Произошла ошибка при запуске бота. Попробуйте еще раз.');
            }
            return;
        }
        // Пропускаем команды - они обрабатываются отдельными декораторами
        if (messageText?.startsWith('/')) {
            this._logger.debug(`[@On text] Пропускаем команду: "${messageText}"`, 'BotUpdate');
            return;
        }
        // Обрабатываем сообщения главного меню напрямую
        const { MainMenuHandler } = await Promise.resolve().then(() => __importStar(require('../utils/main-menu-handler')));
        if (MainMenuHandler.isMainMenuMessage(messageText)) {
            this._logger.debug(`[@On text] Обнаружено сообщение главного меню: "${messageText}" - выход из сцены и показ главного меню`, 'BotUpdate');
            await this._users.upsertFromContext(ctx);
            await MainMenuHandler.handleMainMenuRequest(ctx, 'BotUpdate-OnText');
            return;
        }
        // Проверяем, находится ли пользователь в сцене
        const sceneContext = ctx;
        if (sceneContext.scene?.current) {
            this._logger.debug(`[@On text] Пользователь ${ctx.from?.id} находится в сцене "${sceneContext.scene.current.id}", пропускаем обработку в BotUpdate`, 'BotUpdate');
            // Не обрабатываем сообщение здесь, позволяем сцене его обработать
            return;
        }
        this._logger.debug(`[@On text] Текстовое сообщение получено: "${messageText}" от пользователя ${ctx.from?.id} (вне сцены)`, 'BotUpdate');
        // Для других сообщений просто логируем
        this._logger.debug(`[@On text] Неизвестное сообщение: "${messageText}"`, 'BotUpdate');
    }
    // Обработчик для фото
    async onPhoto(ctx) {
        this._logger.log(`📸 [@On photo] Фото получено от пользователя ${ctx.from?.id}`, 'BotUpdate');
        // Проверяем, находится ли пользователь в сцене
        const sceneContext = ctx;
        if (sceneContext.scene?.current) {
            this._logger.debug(`[@On photo] Пользователь ${ctx.from?.id} находится в сцене "${sceneContext.scene.current.id}", пропускаем обработку в BotUpdate`, 'BotUpdate');
            // Не обрабатываем сообщение здесь, позволяем сцене его обработать
            return;
        }
        // Если пользователь не в сцене, отправляем сообщение о том, что нужно начать создание видео
        await ctx.reply('📸 Фото получено!\n\n' +
            "🎬 Для создания видео с этим фото нажмите кнопку 'Создать видео' в главном меню.");
    }
    // Обработчик для голосовых сообщений
    async onVoice(ctx) {
        this._logger.log(`🎤 [@On voice] Голосовое сообщение получено от пользователя ${ctx.from?.id}`, 'BotUpdate');
        // Проверяем, находится ли пользователь в сцене
        const sceneContext = ctx;
        if (sceneContext.scene?.current) {
            this._logger.debug(`[@On voice] Пользователь ${ctx.from?.id} находится в сцене "${sceneContext.scene.current.id}", пропускаем обработку в BotUpdate`, 'BotUpdate');
            // Не обрабатываем сообщение здесь, позволяем сцене его обработать
            return;
        }
        // Если пользователь не в сцене, отправляем сообщение о том, что нужно начать создание видео
        await ctx.reply('🎤 Голосовое сообщение получено!\n\n' +
            '📸 Для создания видео с вашим голосом сначала отправьте фото с человеком.\n\n' +
            "🎬 Нажмите кнопку 'Создать видео' в главном меню.");
    }
    async onMainMenu(ctx) {
        const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
        this._logger.log(`🏠 [@Hears] Главное меню запрошено пользователем ${ctx.from?.id}, текст: "${messageText}"`, 'BotUpdate');
        try {
            await this._users.upsertFromContext(ctx);
            // Используем централизованный обработчик главного меню
            const { MainMenuHandler } = await Promise.resolve().then(() => __importStar(require('../utils/main-menu-handler')));
            await MainMenuHandler.handleMainMenuRequest(ctx, 'BotUpdate');
            this._logger.debug('Главное меню отправлено через @Hears', 'BotUpdate');
        }
        catch (error) {
            this._logger.error(`❌ Ошибка при обработке главного меню: ${error}`, undefined, 'BotUpdate');
            await ctx.reply('❌ Произошла ошибка при загрузке главного меню');
        }
    }
    async onMainMenuAction(ctx) {
        this._logger.log(`🏠 [@Action] Главное меню запрошено через inline кнопку пользователем ${ctx.from?.id}`, 'BotUpdate');
        try {
            await ctx.answerCbQuery();
            // Используем централизованный обработчик главного меню
            const { MainMenuHandler } = await Promise.resolve().then(() => __importStar(require('../utils/main-menu-handler')));
            await MainMenuHandler.handleMainMenuRequest(ctx, 'BotUpdate-Action');
            this._logger.debug('Главное меню отправлено через @Action', 'BotUpdate');
        }
        catch (error) {
            this._logger.error(`❌ Ошибка при обработке главного меню через @Action: ${error}`, undefined, 'BotUpdate');
            await ctx.answerCbQuery('❌ Произошла ошибка');
        }
    }
    // Удаляем дублирующую команду operator - она уже есть в OperatorModule
    // @Command('operator') - УДАЛЕНО для предотвращения конфликтов
    async onMyId(ctx) {
        if (!ctx.from) {
            await ctx.reply('❌ Не удалось получить данные пользователя');
            return;
        }
        const userId = ctx.from.id;
        const username = ctx.from.username || 'не задан';
        const firstName = ctx.from.first_name || '';
        const lastName = ctx.from.last_name || '';
        const message = `🆔 Ваши данные:\n\n` +
            `📱 Chat ID: \`${userId}\`\n` +
            `👤 Username: @${username}\n` +
            `📝 Имя: ${firstName} ${lastName}\n\n` +
            `💡 Для копирования Chat ID выделите число выше`;
        await ctx.reply(message, { parse_mode: 'Markdown' });
    }
    // Вариант без слеша, чтобы не дублировать с @Command('myid')
    async onMyIdHears(ctx) {
        return this.onMyId(ctx);
    }
    async onStatus(ctx) {
        if (!ctx.from?.id) {
            await ctx.reply('❌ Не удалось получить данные пользователя');
            return;
        }
        try {
            const userId = ctx.from.id;
            const activeProcesses = this._processManager.getActiveProcesses();
            const userProcesses = activeProcesses.filter(process => process.userId === userId);
            if (userProcesses.length === 0) {
                await ctx.reply('📊 **Статус процессов**\n\n' +
                    '❌ У вас нет активных процессов создания видео.\n\n' +
                    "💡 Для создания видео используйте команду /start или кнопку 'Создать видео'", { parse_mode: 'Markdown' });
                return;
            }
            let message = '📊 **Активные процессы создания видео:**\n\n';
            for (const process of userProcesses) {
                const statusEmoji = this.getStatusEmoji(process.status);
                const statusText = this.getStatusText(process.status);
                const timeAgo = this.getTimeAgo(process.createdAt);
                message += `🎬 **Процесс:** \`${process.id}\`\n`;
                message += `${statusEmoji} **Статус:** ${statusText}\n`;
                message += `📝 **Сценарий:** ${process.script.substring(0, 50)}...\n`;
                message += `🎥 **Качество:** ${process.quality}\n`;
                message += `⏰ **Создан:** ${timeAgo}\n\n`;
            }
            message += '💡 **Статусы:**\n';
            message += '📸 Создание аватара из фото\n';
            message += '🎵 Клонирование голоса\n';
            message += '🎬 Генерация видео\n';
            message += '✅ Готово\n\n';
            message += '⏳ Обычно процесс занимает 2-5 минут';
            await ctx.reply(message, { parse_mode: 'Markdown' });
        }
        catch (error) {
            this._logger.error(`Ошибка получения статуса процессов: ${error}`, undefined, 'BotUpdate');
            await ctx.reply('❌ Ошибка получения статуса процессов. Попробуйте позже.');
        }
    }
    getStatusEmoji(status) {
        switch (status) {
            case 'photo_avatar_creating':
                return '📸';
            case 'photo_avatar_completed':
                return '✅';
            case 'photo_avatar_failed':
                return '❌';
            case 'voice_cloning':
                return '🎵';
            case 'voice_clone_completed':
                return '✅';
            case 'voice_clone_failed':
                return '❌';
            case 'video_generating':
                return '🎬';
            case 'video_completed':
                return '🎉';
            case 'video_failed':
                return '❌';
            default:
                return '⏳';
        }
    }
    getStatusText(status) {
        switch (status) {
            case 'photo_avatar_creating':
                return 'Создание аватара из фото';
            case 'photo_avatar_completed':
                return 'Аватар создан';
            case 'photo_avatar_failed':
                return 'Ошибка создания аватара';
            case 'voice_cloning':
                return 'Клонирование голоса';
            case 'voice_clone_completed':
                return 'Голос клонирован';
            case 'voice_clone_failed':
                return 'Ошибка клонирования голоса';
            case 'video_generating':
                return 'Генерация видео';
            case 'video_completed':
                return 'Видео готово';
            case 'video_failed':
                return 'Ошибка создания видео';
            default:
                return 'Неизвестный статус';
        }
    }
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        if (diffMins < 1)
            return 'только что';
        if (diffMins < 60)
            return `${diffMins} мин назад`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24)
            return `${diffHours} ч назад`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} дн назад`;
    }
    async onCreateVideo(ctx) {
        await ctx.answerCbQuery();
        await ctx.scene.enter('video-generation');
    }
    async onServiceSettings(ctx) {
        await ctx.answerCbQuery();
        if (!ctx.from?.id) {
            await ctx.reply('❌ Ошибка получения данных пользователя');
            return;
        }
        const currentService = await this._users.getUserPreferredService(ctx.from.id);
        const serviceNames = {
            did: '🤖 ИИ-Аватар',
            heygen: '👤 Цифровой двойник',
        };
        const newText = `⚙️ **Настройки сервиса генерации видео**\n\n` +
            `Текущий сервис: ${serviceNames[currentService]}\n\n` +
            `🤖 **ИИ-Аватар:**\n` +
            `• Быстрая генерация\n` +
            `• Качественная синхронизация губ\n` +
            `• Поддержка клонирования голоса\n\n` +
            `👤 **Цифровой двойник:**\n` +
            `• Более реалистичные движения\n` +
            `• Профессиональное качество\n` +
            `• Расширенные возможности персонализации\n\n` +
            `Выберите предпочтительный сервис:`;
        // Проверяем, изменилось ли содержимое сообщения
        const currentText = ctx.callbackQuery?.message && 'text' in ctx.callbackQuery.message
            ? ctx.callbackQuery.message.text
            : '';
        if (currentText !== newText) {
            await ctx.editMessageText(newText, {
                parse_mode: 'Markdown',
                reply_markup: this._kb.serviceSettings().reply_markup,
            });
        }
        else {
            await ctx.answerCbQuery('✅ Настройки уже актуальны!');
        }
    }
    async onSetServiceDid(ctx) {
        await ctx.answerCbQuery('🤖 ИИ-Аватар выбран!');
        if (!ctx.from?.id) {
            await ctx.reply('❌ Ошибка получения данных пользователя');
            return;
        }
        const success = await this._users.setUserPreferredService(ctx.from.id, 'did');
        if (!success) {
            await ctx.reply('❌ Не удалось сохранить настройки. Попробуйте позже.');
            return;
        }
        await ctx.editMessageText(`✅ **Сервис успешно изменен!**\n\n` +
            `🤖 Теперь используется: **ИИ-Аватар**\n\n` +
            `Особенности:\n` +
            `• Быстрая генерация видео\n` +
            `• Качественная синхронизация губ\n` +
            `• Поддержка клонирования голоса\n` +
            `• Оптимизировано для коротких роликов\n\n` +
            `🎬 Теперь можете создавать видео!`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🎬 Создать видео', callback_data: 'create_video' }],
                    [{ text: '🔙 Назад в меню', callback_data: 'main_menu' }],
                ],
            },
        });
    }
    async onSetServiceHeyGen(ctx) {
        await ctx.answerCbQuery('👤 Цифровой двойник выбран!');
        if (!ctx.from?.id) {
            await ctx.reply('❌ Ошибка получения данных пользователя');
            return;
        }
        const success = await this._users.setUserPreferredService(ctx.from.id, 'heygen');
        if (!success) {
            await ctx.reply('❌ Не удалось сохранить настройки. Попробуйте позже.');
            return;
        }
        await ctx.editMessageText(`✅ **Сервис успешно изменен!**\n\n` +
            `👤 Теперь используется: **Цифровой двойник**\n\n` +
            `Особенности:\n` +
            `• Более реалистичные движения\n` +
            `• Профессиональное качество видео\n` +
            `• Расширенные возможности персонализации\n` +
            `• Продвинутая технология создания аватаров\n\n` +
            `🎬 Теперь можете создавать видео!`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🎬 Создать видео', callback_data: 'create_video' }],
                    [{ text: '🔙 Назад в меню', callback_data: 'main_menu' }],
                ],
            },
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
    (0, nestjs_telegraf_1.On)('text'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onText", null);
__decorate([
    (0, nestjs_telegraf_1.On)('photo'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onPhoto", null);
__decorate([
    (0, nestjs_telegraf_1.On)('voice'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onVoice", null);
__decorate([
    (0, nestjs_telegraf_1.Hears)(['🏠 Главное меню', 'Главное меню']),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onMainMenu", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('main_menu'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onMainMenuAction", null);
__decorate([
    (0, nestjs_telegraf_1.Command)('myid'),
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
    (0, nestjs_telegraf_1.Command)('status'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onStatus", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('create_video'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onCreateVideo", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('service_settings'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onServiceSettings", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('set_service_did'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onSetServiceDid", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('set_service_heygen'),
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
        logger_service_1.CustomLoggerService,
        process_manager_service_1.ProcessManagerService])
], BotUpdate);
