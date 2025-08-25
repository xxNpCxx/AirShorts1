import { Context } from 'telegraf';
import { DidService } from '../d-id/did.service';
export declare class VideoGenerationScene {
    private readonly didService;
    private readonly logger;
    constructor(didService: DidService);
    onSceneEnter(ctx: Context): Promise<void>;
    onPhoto(ctx: any): Promise<void>;
    onVoice(ctx: any): Promise<void>;
    onText(ctx: any): Promise<void>;
    private showPlatformSelection;
    private showDurationSelection;
    private showQualitySelection;
    private showTextPromptInput;
    private startVideoGeneration;
    onCancel(ctx: Context): Promise<void>;
}
//# sourceMappingURL=video-generation.scene.d.ts.map