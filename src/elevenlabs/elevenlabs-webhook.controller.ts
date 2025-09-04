import { Controller, Post, Body, Logger, HttpCode, HttpStatus } from "@nestjs/common";
import { ElevenLabsService } from "./elevenlabs.service";
import { VoiceNotificationService } from "./voice-notification.service";

interface ElevenLabsWebhookPayload {
  event: string;
  voice_id: string;
  status: string;
  error?: string;
  created_at?: string;
  updated_at?: string;
}

@Controller("elevenlabs/webhook")
export class ElevenLabsWebhookController {
  private readonly logger = new Logger(ElevenLabsWebhookController.name);

  constructor(
    private readonly elevenLabsService: ElevenLabsService,
    private readonly voiceNotificationService: VoiceNotificationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: ElevenLabsWebhookPayload) {
    try {
      this.logger.log(`📨 Received ElevenLabs webhook: ${payload.event} for voice ${payload.voice_id}`);
      this.logger.debug("Webhook payload:", payload);

      switch (payload.event) {
        case "voice.created":
          await this.handleVoiceCreated(payload);
          break;
        case "voice.updated":
          await this.handleVoiceUpdated(payload);
          break;
        case "voice.deleted":
          await this.handleVoiceDeleted(payload);
          break;
        case "voice.failed":
          await this.handleVoiceFailed(payload);
          break;
        default:
          this.logger.warn(`Unknown webhook event: ${payload.event}`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error("Error processing ElevenLabs webhook:", error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async handleVoiceCreated(payload: ElevenLabsWebhookPayload) {
    this.logger.log(`✅ Voice created successfully: ${payload.voice_id}`);
    
    // Проверяем статус голоса и уведомляем пользователя
    const voiceStatus = await this.elevenLabsService.getVoiceStatus(payload.voice_id);
    
    if (voiceStatus.ready) {
      await this.voiceNotificationService.notifyVoiceReady(payload.voice_id);
    } else {
      this.logger.log(`Voice ${payload.voice_id} created but not ready yet: ${voiceStatus.status}`);
    }
  }

  private async handleVoiceUpdated(payload: ElevenLabsWebhookPayload) {
    this.logger.log(`🔄 Voice updated: ${payload.voice_id}`);
    
    // Проверяем, готов ли голос после обновления
    const voiceStatus = await this.elevenLabsService.getVoiceStatus(payload.voice_id);
    
    if (voiceStatus.ready) {
      await this.voiceNotificationService.notifyVoiceReady(payload.voice_id);
    }
  }

  private async handleVoiceDeleted(payload: ElevenLabsWebhookPayload) {
    this.logger.log(`🗑️ Voice deleted: ${payload.voice_id}`);
    // Обработка удаления голоса
  }

  private async handleVoiceFailed(payload: ElevenLabsWebhookPayload) {
    this.logger.error(`❌ Voice creation failed: ${payload.voice_id}`, {
      error: payload.error,
      status: payload.status
    });
    
    // Уведомляем пользователя об ошибке
    await this.voiceNotificationService.notifyVoiceError(
      payload.voice_id, 
      payload.error || "Неизвестная ошибка"
    );
  }
}
