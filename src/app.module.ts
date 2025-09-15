import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { AkoolModule } from './akool/akool.module';
import { ElevenLabsModule } from './elevenlabs/elevenlabs.module';
import { VideoGenerationScene } from './scenes/video-generation.scene';
import { ReferralScene } from './scenes/referral.scene';
import { PaymentScene } from './scenes/payment.scene';
import { AdminReferralScene } from './scenes/admin-referral.scene';
import { ReferralsModule } from './referrals/referrals.module';
import { WebhookModule } from './webhook/webhook.module';
import { TestFilesModule } from './test-files/test-files.module';
import { AdminModule } from './admin/admin.module';
import { MigrationsModule } from './migrations/migrations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? undefined : '.env',
    }),
    LoggerModule,
    DatabaseModule,
    SettingsModule,
    UsersModule,
    KeyboardsModule,
    MenuModule,
    RedisModule,
    AkoolModule,
    ElevenLabsModule,
    ReferralsModule,
    WebhookModule,
    TestFilesModule,
    AdminModule,
    MigrationsModule,
    TelegrafModule.forRoot({
      token: process.env.BOT_TOKEN || '',
      botName: 'airshorts1_bot',
      middlewares: [session()],
      launchOptions: {
        dropPendingUpdates: true,
        webhook: {
          domain: process.env.WEBHOOK_URL || 'https://airshorts1.onrender.com',
          path: '/webhook',
        },
      },
      options: {
        telegram: {
          webhookReply: false,
        },
      },
    }),
  ],
  providers: [
    BotUpdate,
    MenuUpdate,
    VideoGenerationScene,
    ReferralScene,
    PaymentScene,
    AdminReferralScene,
  ],
  controllers: [HealthController],
})
export class AppModule {}
