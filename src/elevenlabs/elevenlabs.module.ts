import { Module } from '@nestjs/common';
import { ElevenLabsController } from './elevenlabs.controller';
import { ElevenLabsWebhookController } from './elevenlabs-webhook.controller';
import { ElevenLabsService } from './elevenlabs.service';
import { VoiceNotificationService } from './voice-notification.service';

@Module({
  controllers: [ElevenLabsController, ElevenLabsWebhookController],
  providers: [ElevenLabsService, VoiceNotificationService],
  exports: [ElevenLabsService, VoiceNotificationService],
})
export class ElevenLabsModule {}
