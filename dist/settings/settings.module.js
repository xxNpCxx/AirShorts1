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
var SettingsModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../database/database.module");
const settings_service_1 = require("./settings.service");
let SettingsModule = SettingsModule_1 = class SettingsModule {
    constructor() {
        this.logger = new common_1.Logger(SettingsModule_1.name);
        this.logger.log("[SettingsModule] Инициализация модуля настроек");
    }
};
exports.SettingsModule = SettingsModule;
exports.SettingsModule = SettingsModule = SettingsModule_1 = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        providers: [settings_service_1.SettingsService],
        exports: [settings_service_1.SettingsService],
    }),
    __metadata("design:paramtypes", [])
], SettingsModule);
