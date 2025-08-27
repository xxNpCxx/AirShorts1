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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuService = void 0;
const common_1 = require("@nestjs/common");
const keyboards_service_1 = require("../keyboards/keyboards.service");
const logger_service_1 = require("../logger/logger.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let MenuService = class MenuService {
    constructor(_kb, _logger) {
        this._kb = _kb;
        this._logger = _logger;
    }
    async sendMainMenu(ctx) {
        this._logger.debug(`Отправка главного меню пользователю ${ctx.from?.id}`, "MenuService");
        try {
            await this.sendMainMenuBanner(ctx);
            await this.sendReplyKeyboard(ctx);
            this._logger.debug(`Главное меню успешно отправлено пользователю ${ctx.from?.id}`, "MenuService");
        }
        catch (error) {
            this._logger.error(`Ошибка при отправке главного меню: ${error}`, undefined, "MenuService");
            throw error;
        }
    }
    async sendMainMenuBanner(ctx) {
        try {
            this._logger.debug(`Попытка отправить баннер главного меню пользователю: ${ctx.from?.id}`, "MenuService");
            const imagePath = path.join(process.cwd(), "images", "banner.jpg");
            this._logger.debug(`Путь к баннеру: ${imagePath}`, "MenuService");
            if (!fs.existsSync(imagePath)) {
                this._logger.warn(`Баннер banner.jpg не найден по пути: ${imagePath}`, "MenuService");
                await ctx.reply("🎬 ГЕНЕРАТОР ВИДЕО\n\nДобро пожаловать в генератор видео!\n\n✨ Создавайте персонализированные видео\n🎭 3D аватары с вашим голосом\n📱 Оптимизировано для коротких роликов\n🚀 Быстрая и качественная генерация", {
                    reply_markup: this._kb.mainInline().reply_markup,
                });
                return;
            }
            const stats = fs.statSync(imagePath);
            this._logger.debug(`Размер баннера: ${(stats.size / 1024 / 1024).toFixed(2)} MB`, "MenuService");
            const caption = `🎬 ГЕНЕРАТОР ВИДЕО\n\nДобро пожаловать в генератор видео!\n\n✨ Создавайте персонализированные видео\n🎭 3D аватары с вашим голосом\n📱 Оптимизировано для коротких роликов\n🚀 Быстрая и качественная генерация`;
            if (ctx.telegram && ctx.from?.id) {
                this._logger.debug(`Отправляю баннер с inline-клавиатурой пользователю ${ctx.from.id}`, "MenuService");
                await ctx.telegram.sendPhoto(ctx.from.id, imagePath, {
                    caption,
                    parse_mode: "HTML",
                    reply_markup: this._kb.mainInline().reply_markup,
                });
                this._logger.debug(`Баннер главного меню с inline-клавиатурой успешно отправлен пользователю ${ctx.from.id}`, "MenuService");
            }
            else {
                this._logger.warn("Не удалось отправить баннер: отсутствует telegram API или chat ID", "MenuService");
                await ctx.reply(caption, {
                    reply_markup: this._kb.mainInline().reply_markup,
                });
            }
        }
        catch (error) {
            this._logger.error(`Ошибка при отправке баннера главного меню: ${error}`, undefined, "MenuService");
            this._logger.debug(`Детали ошибки: ${error instanceof Error ? error.stack : error}`, "MenuService");
            const caption = `🎬 ГЕНЕРАТОР ВИДЕО\n\nДобро пожаловать в генератор видео!\n\n✨ Создавайте персонализированные видео\n🎭 3D аватары с вашим голосом\n📱 Оптимизировано для коротких роликов\n🚀 Быстрая и качественная генерация`;
            await ctx.reply(caption, {
                reply_markup: this._kb.mainInline().reply_markup,
            });
        }
    }
    async sendReplyKeyboard(ctx) {
        try {
            const imagePath = path.join(__dirname, "../images/banner.jpg");
            const alternativePath = path.join(process.cwd(), "dist/images/banner.jpg");
            const devPath = path.join(process.cwd(), "src/images/banner.jpg");
            let finalImagePath = null;
            if (fs.existsSync(imagePath)) {
                finalImagePath = imagePath;
            }
            else if (fs.existsSync(alternativePath)) {
                finalImagePath = alternativePath;
            }
            else if (fs.existsSync(devPath)) {
                finalImagePath = devPath;
            }
            if (finalImagePath) {
                await ctx.sendPhoto({ source: finalImagePath }, {
                    reply_markup: this._kb.mainReply().reply_markup,
                });
                this._logger.debug(`Reply-клавиатура с фото отправлена пользователю ${ctx.from?.id}, путь: ${finalImagePath}`, "MenuService");
            }
            else {
                this._logger.warn(`Баннер не найден по всем путям: [${imagePath}, ${alternativePath}, ${devPath}]`, "MenuService");
                await ctx.reply("🎬", {
                    reply_markup: this._kb.mainReply().reply_markup,
                });
                this._logger.debug(`Reply-клавиатура с эмодзи отправлена пользователю ${ctx.from?.id}`, "MenuService");
            }
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