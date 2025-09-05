"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeyGenModule = void 0;
const common_1 = require("@nestjs/common");
const heygen_controller_1 = require("./heygen.controller");
const heygen_service_1 = require("./heygen.service");
const heygen_webhook_controller_1 = require("./heygen-webhook.controller");
const process_manager_service_1 = require("./process-manager.service");
const nestjs_telegraf_1 = require("nestjs-telegraf");
let HeyGenModule = class HeyGenModule {
};
exports.HeyGenModule = HeyGenModule;
exports.HeyGenModule = HeyGenModule = __decorate([
    (0, common_1.Module)({
        imports: [nestjs_telegraf_1.TelegrafModule],
        controllers: [heygen_controller_1.HeyGenController, heygen_webhook_controller_1.HeyGenWebhookController],
        providers: [heygen_service_1.HeyGenService, process_manager_service_1.ProcessManagerService],
        exports: [heygen_service_1.HeyGenService, process_manager_service_1.ProcessManagerService],
    })
], HeyGenModule);
//# sourceMappingURL=heygen.module.js.map