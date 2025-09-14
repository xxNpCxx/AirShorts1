import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AkoolService } from './akool.service';
import { AkoolController } from './akool.controller';
import { AkoolWebhookController } from './akool-webhook.controller';
import { AkoolProgressService } from './akool-progress.service';
import { ElevenLabsModule } from '../elevenlabs/elevenlabs.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [ConfigModule, ElevenLabsModule, DatabaseModule],
  providers: [AkoolService, AkoolProgressService],
  controllers: [AkoolController, AkoolWebhookController],
  exports: [AkoolService, AkoolProgressService],
})
export class AkoolModule {}
