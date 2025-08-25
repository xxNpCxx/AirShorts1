import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { BotUpdate } from './updates/bot.update';
import { HealthController } from './health.controller';
import { DatabaseModule } from './database/database.module';
import { SettingsModule } from './settings/settings.module';
import { UsersModule } from './users/users.module';
import { KeyboardsModule } from './keyboards/keyboards.module';
import { MenuModule } from './menu/menu.module';
import { RedisModule } from './redis/redis.module';
import { MenuUpdate } from './updates/menu.update';
import { LoggerModule } from './logger/logger.module';
import { DidModule } from './d-id/did.module';
import { ScenesModule } from './scenes/scenes.module';
import { VideoGenerationScene } from './scenes/video-generation.scene';

@Module({
  imports: [
    LoggerModule,
    DatabaseModule,
    SettingsModule,
    UsersModule,
    KeyboardsModule,
    MenuModule,
    RedisModule,
    DidModule,
    ScenesModule,
    TelegrafModule.forRoot({
      token: process.env.BOT_TOKEN || '',
      launchOptions: {
        webhook: {
          domain:
            process.env.RENDER_EXTERNAL_URL || process.env.WEBHOOK_URL || '',
          hookPath: '/webhook',
        },
      },
      middlewares: [session()],
      include: [ScenesModule],
    }),
  ],
  providers: [BotUpdate, MenuUpdate, VideoGenerationScene],
  controllers: [HealthController],
})
export class AppModule {}
