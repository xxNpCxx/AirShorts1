import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { LoggerModule } from '../logger/logger.module';
import { TelegrafModule } from 'nestjs-telegraf';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [LoggerModule, TelegrafModule, UsersModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
