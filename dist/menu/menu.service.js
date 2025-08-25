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
const settings_service_1 = require("../settings/settings.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let MenuService = class MenuService {
    constructor(_kb, _settings) {
        this._kb = _kb;
        this._settings = _settings;
    }
    async sendMainMenu(ctx) {
        const isOperator = false;
        const isAdmin = false;
        await this.sendMainMenuBanner(ctx, isOperator, isAdmin);
        await this.sendReplyKeyboard(ctx);
    }
    async sendMainMenuBanner(ctx, isOperator, isAdmin) {
        try {
            console.log(`[MenuService] Попытка отправить баннер главного меню пользователю: ${ctx.from?.id}`);
            const imagePath = path.join(process.cwd(), 'images', 'banner.jpg');
            console.log(`[MenuService] Путь к баннеру: ${imagePath}`);
            if (!fs.existsSync(imagePath)) {
                console.warn(`[MenuService] Баннер banner.jpg не найден по пути: ${imagePath}`);
                await ctx.reply('🎬 ГЕНЕРАТОР ВИДЕО\n\nДобро пожаловать в AI генератор видео!\n\n✨ Создавайте персонализированные видео\n🎭 3D аватары с вашим голосом\n📱 Оптимизировано для YouTube Shorts\n🚀 Быстрая генерация с d-id API', {
                    reply_markup: this._kb.mainInline().reply_markup
                });
                return;
            }
            const stats = fs.statSync(imagePath);
            console.log(`[MenuService] Размер баннера: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
            const caption = `🎬 ГЕНЕРАТОР ВИДЕО\n\nДобро пожаловать в AI генератор видео!\n\n✨ Создавайте персонализированные видео\n🎭 3D аватары с вашим голосом\n📱 Оптимизировано для YouTube Shorts\n🚀 Быстрая генерация с d-id API`;
            if (ctx.telegram && ctx.from?.id) {
                console.log(`[MenuService] Отправляю баннер с inline-клавиатурой пользователю ${ctx.from.id}`);
                await ctx.telegram.sendPhoto(ctx.from.id, { source: imagePath }, {
                    caption,
                    parse_mode: 'HTML',
                    reply_markup: this._kb.mainInline().reply_markup
                });
                console.log(`[MenuService] Баннер главного меню с inline-клавиатурой успешно отправлен пользователю ${ctx.from.id}`);
            }
            else {
                console.warn('[MenuService] Не удалось отправить баннер: отсутствует telegram API или chat ID');
                await ctx.reply(caption, { reply_markup: this._kb.mainInline().reply_markup });
            }
        }
        catch (error) {
            console.error('[MenuService] Ошибка при отправке баннера главного меню:', error);
            console.error('[MenuService] Детали ошибки:', error instanceof Error ? error.stack : error);
            const caption = `🎬 ГЕНЕРАТОР ВИДЕО\n\nДобро пожаловать в AI генератор видео!\n\n✨ Создавайте персонализированные видео\n🎭 3D аватары с вашим голосом\n📱 Оптимизировано для YouTube Shorts\n🚀 Быстрая генерация с d-id API`;
            await ctx.reply(caption, { reply_markup: this._kb.mainInline().reply_markup });
        }
    }
    async sendReplyKeyboard(ctx) {
        try {
            await ctx.reply('⌨️', { reply_markup: this._kb.mainReply().reply_markup });
            console.log(`[MenuService] Reply-клавиатура отправлена пользователю ${ctx.from?.id}`);
        }
        catch (error) {
            console.error('[MenuService] Ошибка при отправке reply-клавиатуры:', error);
            console.error('[MenuService] Детали ошибки:', error instanceof Error ? error.stack : error);
            await ctx.reply('⌨️', { reply_markup: this._kb.mainReply().reply_markup });
        }
    }
};
exports.MenuService = MenuService;
exports.MenuService = MenuService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [keyboards_service_1.KeyboardsService, settings_service_1.SettingsService])
], MenuService);
//# sourceMappingURL=menu.service.js.map