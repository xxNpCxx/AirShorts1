import { Context } from "telegraf";
import type { Message } from "@telegraf/types";
import { HeyGenService } from "../heygen/heygen.service";
import { ProcessManagerService } from "../heygen/process-manager.service";
import { Telegraf } from "telegraf";
interface SessionData {
    photoFileId?: string;
    voiceFileId?: string;
    script?: string;
    platform?: "youtube-shorts";
    duration?: number;
    quality?: "720p" | "1080p";
}
type PhotoContext = Context & {
    message: Message.PhotoMessage;
    session?: SessionData;
};
type VoiceContext = Context & {
    message: Message.VoiceMessage;
    session?: SessionData;
};
type TextContext = Context & {
    message: Message.TextMessage;
    session?: SessionData;
};
export declare class VideoGenerationScene {
    private readonly heygenService;
    private readonly processManager;
    private readonly bot;
    private readonly logger;
    constructor(heygenService: HeyGenService, processManager: ProcessManagerService, bot: Telegraf);
    private calculateVideoDuration;
    private createDigitalTwin;
    onSceneEnter(ctx: Context): Promise<void>;
    onPhoto(ctx: PhotoContext): Promise<void>;
    onDocument(ctx: Context): Promise<void>;
    onVideo(ctx: Context): Promise<void>;
    onAudio(ctx: Context): Promise<void>;
    onVoice(ctx: VoiceContext): Promise<void>;
    onText(ctx: TextContext): Promise<void>;
    private showQualitySelection;
    onQuality720Selected(ctx: Context): Promise<void>;
    onQuality1080Selected(ctx: Context): Promise<void>;
    onCancelVideoGeneration(ctx: Context): Promise<void>;
    onCancel(ctx: Context): Promise<void>;
}
export {};
//# sourceMappingURL=video-generation.scene.d.ts.map