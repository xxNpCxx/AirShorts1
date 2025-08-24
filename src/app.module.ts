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

@Module({
  imports: [
    LoggerModule,
    DatabaseModule,
    SettingsModule,
    UsersModule,
    KeyboardsModule,
    MenuModule,
    RedisModule,
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
    }),
  ],
  providers: [BotUpdate, MenuUpdate],
  controllers: [HealthController],
})
export class AppModule {}
