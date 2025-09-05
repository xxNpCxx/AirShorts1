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
export interface StandardVideoPayload {
    video_inputs: VideoInput[];
    dimension: {
        width: number;
        height: number;
    };
    caption?: boolean;
    title?: string;
    callback_id?: string;
    folder_id?: string;
    callback_url?: string;
}
export interface VideoInput {
    character: {
        type: "avatar" | "talking_photo";
        avatar_id?: string;
        talking_photo_id?: string;
        avatar_style?: string;
        talking_photo_style?: string;
        talking_style?: string;
        expression?: string;
        super_resolution?: boolean;
        scale?: number;
    };
    voice: {
        type: "text" | "audio";
        input_text?: string;
        voice_id?: string;
        speed?: number;
        audio_asset_id?: string;
    };
    background?: {
        type: "color" | "image" | "video";
        value?: string;
        image_asset_id?: string;
        fit?: string;
    };
}
export interface AvatarIVPayload {
    image_key: string;
    video_title: string;
    script: string;
    voice_id: string;
    video_orientation?: 'portrait' | 'landscape';
    fit?: 'cover' | 'contain';
}
export declare function validateStandardVideoPayload(payload: any): payload is StandardVideoPayload;
export declare function validateAvatarIVPayload(payload: any): payload is AvatarIVPayload;
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
    private getAvailableAvatars;
    private getHardcodedAvatars;
}
//# sourceMappingURL=heygen.service.d.ts.map