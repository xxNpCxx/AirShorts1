import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { LoggerModule } from '../logger/logger.module';
import { TelegrafModule } from 'nestjs-telegraf';

@Module({
  imports: [LoggerModule, TelegrafModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
