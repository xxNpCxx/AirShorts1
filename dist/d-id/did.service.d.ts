import { ConfigService } from "@nestjs/config";
export interface VideoGenerationRequest {
    photoUrl: string;
    audioUrl: string;
    script: string;
    platform: "youtube-shorts";
    duration: number;
    quality: "720p" | "1080p";
    textPrompt?: string;
}
export interface VideoGenerationResponse {
    id: string;
    status: string;
    result_url?: string;
    error?: string;
}
export declare class DidService {
    private readonly configService;
    private readonly logger;
    private readonly apiKey;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse>;
    getVideoStatus(videoId: string): Promise<VideoGenerationResponse>;
    uploadAudio(audioBuffer: Buffer): Promise<string>;
    uploadImage(imageBuffer: Buffer): Promise<string>;
}
//# sourceMappingURL=did.service.d.ts.map