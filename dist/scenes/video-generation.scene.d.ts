import { Context } from "telegraf";
import type { Message } from "@telegraf/types";
import { DidService } from "../d-id/did.service";
interface SessionData {
    photoFileId?: string;
    audioFileId?: string;
    script?: string;
    platform?: "youtube-shorts";
    duration?: number;
    quality?: "720p" | "1080p";
    textPrompt?: string;
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
    private readonly didService;
    private readonly logger;
    constructor(didService: DidService);
    onSceneEnter(ctx: Context): Promise<void>;
    onPhoto(ctx: PhotoContext): Promise<void>;
    onVoice(ctx: VoiceContext): Promise<void>;
    onText(ctx: TextContext): Promise<void>;
    private showPlatformSelection;
    private showDurationSelection;
    private showQualitySelection;
    private showTextPromptInput;
    private startVideoGeneration;
    onYouTubeShortsSelected(ctx: Context): Promise<void>;
    onTikTokSelected(ctx: Context): Promise<void>;
    onInstagramReelsSelected(ctx: Context): Promise<void>;
    onCancelVideoGeneration(ctx: Context): Promise<void>;
    onCancel(ctx: Context): Promise<void>;
}
export {};
//# sourceMappingURL=video-generation.scene.d.ts.map