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
exports.MenuUpdate = void 0;
const nestjs_telegraf_1 = require("nestjs-telegraf");
const telegraf_1 = require("telegraf");
let MenuUpdate = class MenuUpdate {
    async supportAction(ctx) {
        await ctx.answerCbQuery();
        return this.support(ctx);
    }
    async support(ctx) {
        const username = (process.env.OPERATOR_USERNAME || '').replace('@', '');
        const url = username ? `https://t.me/${username}` : 'https://t.me/';
        await ctx.reply('Связь с оператором:', telegraf_1.Markup.inlineKeyboard([telegraf_1.Markup.button.url('Написать оператору', url)]));
    }
    async rulesAction(ctx) {
        await ctx.answerCbQuery();
        return this.rules(ctx);
    }
    async rules(ctx) {
        await ctx.reply(`📌 Правила пользования обменным сервисом

🔒 1. Безопасность и законность
Запрещено использовать услуги обменника для незаконных переводов или мошеннических действий.
При подозрении в нарушении закона, клиент обязан предоставить удостоверяющие личность документы.

⚖️ 2. Право на отказ
Администрация обменника вправе отказать в выполнении заявки без объяснения причин. Это правило действует в отношении любого клиента.

🚫 3. Строгие запреты
Запрещается:
• переводы по номеру 900
• оплата через банкоматы и терминалы
• разбивка суммы на 2 и более перевода без согласования

🛡 4. Антифрод-система
Для борьбы с противоправной деятельностью используется автоматизированная система анализа транзакций и поведения пользователей, блокирующая подозрительные операции.

⚠️ 5. Отправка криптовалют
Мы используем сторонние ресурсы для отправки BTC, LTC. Не рекомендуем пополнять биржевые аккаунты — возможна блокировка из-за высокого AML.
Рекомендуемые кошельки: Electrum, Exodus, Ledger, Trust Wallet и др.
Обменник не несёт ответственности за последствия отправки на биржи.

📵 6. Контакт с получателем ЗАПРЕЩЁН
Категорически запрещено звонить или писать получателю перевода.
За нарушение — пожизненный бан во всех наших ботах.

🔔 Соблюдение правил — гарантия вашей безопасности и стабильной работы обменника.
📲 При вопросах — обращайтесь к оператору.`, { parse_mode: 'Markdown' });
    }
};
exports.MenuUpdate = MenuUpdate;
__decorate([
    (0, nestjs_telegraf_1.Action)('support'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MenuUpdate.prototype, "supportAction", null);
__decorate([
    (0, nestjs_telegraf_1.Hears)('🆘 Поддержка оператора'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MenuUpdate.prototype, "support", null);
__decorate([
    (0, nestjs_telegraf_1.Action)('rules'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MenuUpdate.prototype, "rulesAction", null);
__decorate([
    (0, nestjs_telegraf_1.Hears)('📜 Правила'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MenuUpdate.prototype, "rules", null);
exports.MenuUpdate = MenuUpdate = __decorate([
    (0, nestjs_telegraf_1.Update)()
], MenuUpdate);
