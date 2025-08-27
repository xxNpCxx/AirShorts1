import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [LoggerModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
