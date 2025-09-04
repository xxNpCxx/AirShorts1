import { ConfigService } from "@nestjs/config";
export interface HeyGenVideoRequest {
    photoUrl: string;
    audioUrl: string;
    script: string;
    platform: "youtube-shorts";
    duration: number;
    quality: "720p" | "1080p";
    textPrompt?: string;
    imageUrl?: string;
}
export interface HeyGenVideoResponse {
    id: string;
    status: string;
    result_url?: string;
    error?: string;
}
export declare class HeyGenService {
    private readonly configService;
    private readonly logger;
    private readonly apiKey;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    generateVideo(request: HeyGenVideoRequest): Promise<HeyGenVideoResponse>;
    getVideoStatus(videoId: string): Promise<HeyGenVideoResponse>;
    uploadAudio(audioBuffer: Buffer): Promise<string>;
    uploadImage(imageBuffer: Buffer): Promise<string>;
    private uploadImageFallback;
}
//# sourceMappingURL=heygen.service.d.ts.map