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
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../database/database.module");
const pg_1 = require("pg");
let UsersService = UsersService_1 = class UsersService {
    constructor(pool) {
        this.pool = pool;
        this.logger = new common_1.Logger(UsersService_1.name);
    }
    async upsertFromContext(ctx) {
        const u = ctx.from;
        if (!u)
            return false;
        try {
            const res = await this.pool.query("SELECT telegram_id FROM users WHERE telegram_id = $1", [u.id]);
            const isNewUser = res.rowCount === 0;
            await this.pool.query(`INSERT INTO users (telegram_id, username, first_name, last_name, language_code, is_bot)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (telegram_id) DO UPDATE
           SET username = EXCLUDED.username,
               first_name = EXCLUDED.first_name,
               last_name = EXCLUDED.last_name,
               language_code = EXCLUDED.language_code,
               is_bot = EXCLUDED.is_bot,
               last_active = NOW(),
               requests_count = users.requests_count + 1`, [
                u.id,
                u.username || null,
                u.first_name || null,
                u.last_name || null,
                u.language_code || null,
                u.is_bot || false,
            ]);
            return isNewUser;
        }
        catch (err) {
            this.logger.error("[users][pg] Ошибка upsert:", err);
            return false;
        }
    }
    async getUserPreferredService(telegramId) {
        try {
            const res = await this.pool.query("SELECT preferred_service FROM users WHERE telegram_id = $1", [telegramId]);
            if (res.rowCount === 0) {
                return 'did';
            }
            return res.rows[0].preferred_service || 'did';
        }
        catch (error) {
            if (error.code === '42703' && error.message.includes('preferred_service')) {
                this.logger.warn(`[users][pg] Колонка preferred_service не существует, используем значение по умолчанию для пользователя ${telegramId}`);
                return 'did';
            }
            throw error;
        }
    }
    async setUserPreferredService(telegramId, service) {
        try {
            await this.pool.query("UPDATE users SET preferred_service = $1 WHERE telegram_id = $2", [service, telegramId]);
            this.logger.log(`Установлен предпочтительный сервис ${service} для пользователя ${telegramId}`);
            return true;
        }
        catch (error) {
            if (error.code === '42703' && error.message.includes('preferred_service')) {
                this.logger.warn(`[users][pg] Колонка preferred_service не существует, не можем сохранить предпочтение для пользователя ${telegramId}`);
                return false;
            }
            throw error;
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.PG_POOL)),
    __metadata("design:paramtypes", [pg_1.Pool])
], UsersService);
//# sourceMappingURL=users.service.js.map