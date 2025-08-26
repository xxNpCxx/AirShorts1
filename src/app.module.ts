import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { BotUpdate } from './updates/bot.update';
import { HealthController } from './health.controller';
import { WebhookController } from './controllers/webhook.controller';
import { DatabaseModule } from './database/database.module';
import { SettingsModule } from './settings/settings.module';
import { UsersModule } from './users/users.module';
import { KeyboardsModule } from './keyboards/keyboards.module';
import { MenuModule } from './menu/menu.module';
import { RedisModule } from './redis/redis.module';
import { MenuUpdate } from './updates/menu.update';
import { LoggerModule } from './logger/logger.module';
import { DidModule } from './d-id/did.module';
import { VideoGenerationScene } from './scenes/video-generation.scene';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LoggerModule,
    DatabaseModule,
    SettingsModule,
    UsersModule,
    KeyboardsModule,
    MenuModule,
    RedisModule,
    DidModule,
    TelegrafModule.forRoot({
      token: process.env.BOT_TOKEN || '',
      middlewares: [session()],
      launchOptions: {
        webhook: {
          domain: process.env.WEBHOOK_URL || 'https://airshorts1.onrender.com',
          hookPath: '/webhook',
          port: Number(process.env.PORT) || 10000
        }
      },
      include: [BotUpdate, MenuUpdate, VideoGenerationScene],
      options: {
        telegram: {
          webhookReply: false
        }
      }
    })
  ],
  providers: [BotUpdate, MenuUpdate, VideoGenerationScene],
  controllers: [HealthController, WebhookController]
})
export class AppModule {}
