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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuService = void 0;
const common_1 = require("@nestjs/common");
const keyboards_service_1 = require("../keyboards/keyboards.service");
const logger_service_1 = require("../logger/logger.service");
let MenuService = class MenuService {
    constructor(_kb, _logger) {
        this._kb = _kb;
        this._logger = _logger;
    }
    async sendMainMenu(ctx) {
        this._logger.debug(`Отправка главного меню пользователю ${ctx.from?.id}`, "MenuService");
        try {
            await ctx.reply("🎬 ГЕНЕРАТОР ВИДЕО\n\nДобро пожаловать в генератор видео!\n\n✨ Создавайте персонализированные видео\n🎭 3D аватары с вашим голосом\n📱 Оптимизировано для коротких роликов\n🚀 Быстрая и качественная генерация", {
                reply_markup: this._kb.mainInline().reply_markup,
            });
            await this.sendReplyKeyboard(ctx);
            this._logger.debug(`Главное меню успешно отправлено пользователю ${ctx.from?.id}`, "MenuService");
        }
        catch (error) {
            this._logger.error(`Ошибка при отправке главного меню: ${error}`, undefined, "MenuService");
            throw error;
        }
    }
    async sendReplyKeyboard(ctx) {
        try {
            await ctx.reply("🎬", {
                reply_markup: this._kb.mainReply().reply_markup,
            });
            this._logger.debug(`Reply-клавиатура отправлена пользователю ${ctx.from?.id}`, "MenuService");
        }
        catch (error) {
            this._logger.error(`Ошибка при отправке reply-клавиатуры: ${error}`, undefined, "MenuService");
            try {
                await ctx.reply("🎬", {
                    reply_markup: this._kb.mainReply().reply_markup,
                });
            }
            catch (fallbackError) {
                this._logger.error(`Критическая ошибка reply-клавиатуры: ${fallbackError}`, undefined, "MenuService");
            }
        }
    }
};
exports.MenuService = MenuService;
exports.MenuService = MenuService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [keyboards_service_1.KeyboardsService,
        logger_service_1.CustomLoggerService])
], MenuService);
//# sourceMappingURL=menu.service.js.map