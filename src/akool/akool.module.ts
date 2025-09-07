import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AkoolService } from './akool.service';
import { AkoolController } from './akool.controller';
import { AkoolWebhookController } from './akool-webhook.controller';
import { ElevenLabsModule } from '../elevenlabs/elevenlabs.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [ConfigModule, ElevenLabsModule, DatabaseModule],
  providers: [AkoolService],
  controllers: [AkoolController, AkoolWebhookController],
  exports: [AkoolService],
})
export class AkoolModule {}
