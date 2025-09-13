"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyboardsService = void 0;
const common_1 = require("@nestjs/common");
const telegraf_1 = require("telegraf");
let KeyboardsService = class KeyboardsService {
    mainReply() {
        return telegraf_1.Markup.keyboard([['🏠 Главное меню']])
            .resize()
            .persistent();
    }
    mainInline(newsChannel) {
        const rows = [
            [telegraf_1.Markup.button.callback('🎬 Создать видео', 'create_video')],
            [telegraf_1.Markup.button.callback('⚙️ Настройки сервиса', 'service_settings')],
            [telegraf_1.Markup.button.callback('🆘 Поддержка оператора', 'support')],
            [telegraf_1.Markup.button.callback('📜 Правила', 'rules')],
            [telegraf_1.Markup.button.url('📰 Новостной канал', newsChannel || 'https://t.me/')],
            [telegraf_1.Markup.button.url('⭐️ Отзывы', 'https://t.me/review413n_obmen')],
        ];
        return telegraf_1.Markup.inlineKeyboard(rows);
    }
    serviceSettings() {
        return telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('🤖 ИИ-Аватар (D-ID)', 'set_service_did')],
            [telegraf_1.Markup.button.callback('👤 Цифровой двойник (HeyGen)', 'set_service_heygen')],
            [telegraf_1.Markup.button.callback('🔙 Назад в меню', 'main_menu')],
        ]);
    }
};
exports.KeyboardsService = KeyboardsService;
exports.KeyboardsService = KeyboardsService = __decorate([
    (0, common_1.Injectable)()
], KeyboardsService);
