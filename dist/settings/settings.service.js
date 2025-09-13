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
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../database/database.module");
const pg_1 = require("pg");
let SettingsService = class SettingsService {
    constructor(pool) {
        this.pool = pool;
    }
    async getSetting(key) {
        const res = await this.pool.query('SELECT value FROM settings WHERE key = $1', [key]);
        return res.rows[0]?.value ?? null;
    }
    async setSetting(key, value) {
        await this.pool.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', [key, value]);
    }
    async getCommissionPercent() {
        const value = await this.getSetting('commission_percent');
        const percent = parseFloat(value || '0');
        if (isNaN(percent) || percent < 0 || percent > 1)
            return 0.2;
        return percent;
    }
    async setCommissionPercent(percent) {
        if (typeof percent !== 'number' || percent < 0 || percent > 1) {
            throw new Error('Процент должен быть от 0 до 1');
        }
        await this.setSetting('commission_percent', percent.toString());
    }
    async getReferralCommissionPercent() {
        const value = await this.getSetting('referral_commission_percent');
        const percent = parseFloat(value || '0');
        if (isNaN(percent) || percent < 0 || percent > 1)
            return 0.25;
        return percent;
    }
    async setReferralCommissionPercent(percent) {
        if (typeof percent !== 'number' || percent < 0 || percent > 1) {
            throw new Error('Процент должен быть от 0 до 1');
        }
        await this.setSetting('referral_commission_percent', percent.toString());
    }
    async getOwnerId() {
        const value = await this.getSetting('owner_id');
        return value ? value.trim() : null;
    }
    async getAdminIds() {
        const value = await this.getSetting('admin_ids');
        return value
            ? value
                .split(',')
                .map((id) => id.trim())
                .filter(Boolean)
            : [];
    }
    async getOperatorIds() {
        const value = await this.getSetting('operator_ids');
        return value
            ? value
                .split(',')
                .map((id) => id.trim())
                .filter(Boolean)
            : [];
    }
    async checkRole(userId, role) {
        userId = String(userId);
        if (role === 'owner') {
            return (await this.getOwnerId()) === userId;
        }
        if (role === 'admin') {
            const admins = await this.getAdminIds();
            return admins.includes(userId);
        }
        if (role === 'operator') {
            const ops = await this.getOperatorIds();
            if (ops.includes(userId))
                return true;
            return this.checkRole(userId, 'admin');
        }
        return false;
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.PG_POOL)),
    __metadata("design:paramtypes", [pg_1.Pool])
], SettingsService);
