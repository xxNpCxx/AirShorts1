import { Telegraf } from "telegraf";
interface VoiceNotificationData {
    userId: number;
    chatId: number;
    voiceId: string;
    voiceName: string;
    status: string;
}
export declare class VoiceNotificationService {
    private readonly bot;
    private readonly logger;
    private readonly pendingNotifications;
    constructor(bot: Telegraf);
    registerVoiceNotification(userId: number, chatId: number, voiceId: string, voiceName: string): void;
    notifyVoiceReady(voiceId: string): Promise<void>;
    notifyVoiceError(voiceId: string, error: string): Promise<void>;
    getPendingNotifications(): VoiceNotificationData[];
    cleanupOldNotifications(): void;
}
export {};
//# sourceMappingURL=voice-notification.service.d.ts.map