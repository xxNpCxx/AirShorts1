"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const telegraf_1 = require("telegraf");
const bot_update_1 = require("./updates/bot.update");
const health_controller_1 = require("./health.controller");
const database_module_1 = require("./database/database.module");
const settings_module_1 = require("./settings/settings.module");
const users_module_1 = require("./users/users.module");
const keyboards_module_1 = require("./keyboards/keyboards.module");
const menu_module_1 = require("./menu/menu.module");
const redis_module_1 = require("./redis/redis.module");
const menu_update_1 = require("./updates/menu.update");
const logger_module_1 = require("./logger/logger.module");
const did_module_1 = require("./d-id/did.module");
const video_generation_scene_1 = require("./scenes/video-generation.scene");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ".env",
            }),
            logger_module_1.LoggerModule,
            database_module_1.DatabaseModule,
            settings_module_1.SettingsModule,
            users_module_1.UsersModule,
            keyboards_module_1.KeyboardsModule,
            menu_module_1.MenuModule,
            redis_module_1.RedisModule,
            did_module_1.DidModule,
            nestjs_telegraf_1.TelegrafModule.forRoot({
                token: process.env.BOT_TOKEN || "",
                botName: "AirShortsBot",
                middlewares: [(0, telegraf_1.session)()],
                launchOptions: {
                    webhook: {
                        domain: process.env.WEBHOOK_URL || "https://airshorts1.onrender.com",
                        hookPath: "/webhook",
                    },
                },
                options: {
                    telegram: {
                        webhookReply: false,
                    },
                },
            }),
        ],
        providers: [bot_update_1.BotUpdate, menu_update_1.MenuUpdate, video_generation_scene_1.VideoGenerationScene],
        controllers: [health_controller_1.HealthController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map