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
export declare class ElevenLabsWebhookController {
    private readonly elevenLabsService;
    private readonly voiceNotificationService;
    private readonly logger;
    constructor(elevenLabsService: ElevenLabsService, voiceNotificationService: VoiceNotificationService);
    handleWebhook(payload: ElevenLabsWebhookPayload): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
    }>;
    private handleVoiceCreated;
    private handleVoiceUpdated;
    private handleVoiceDeleted;
    private handleVoiceFailed;
}
export {};
//# sourceMappingURL=elevenlabs-webhook.controller.d.ts.map