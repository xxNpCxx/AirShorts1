"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DidService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DidService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let DidService = DidService_1 = class DidService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(DidService_1.name);
        this.baseUrl = "https://api.d-id.com";
        this.apiKey =
            this.configService.get("DID_API_KEY") ||
                "eHhucGN4eEBnbWFpbC5jb20:coOsJoP3VqEWDKyQ7FobG";
    }
    async generateVideo(request) {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        try {
            this.logger.log(`[${requestId}] 🚀 Starting video generation with D-ID API`);
            this.logger.debug(`[${requestId}] Request params: platform=${request.platform}, quality=${request.quality}, duration=${request.duration}`);
            this.logger.debug(`[${requestId}] Audio provided: ${!!request.audioUrl}, Script length: ${request.script?.length || 0} chars`);
            const payload = {
                source_url: request.photoUrl,
                script: {
                    type: "text",
                    input: request.script,
                    provider: {
                        type: "microsoft",
                        voice_id: "ru-RU-SvetlanaNeural",
                    },
                },
                config: {
                    fluent: true,
                    pad_audio: 0.1,
                    stitch: true,
                    align_driver: true,
                    align_expand_factor: 0.9,
                    auto_match: true,
                    normalization_factor: 1,
                    motion_factor: 1,
                    result_format: "mp4",
                    quality: request.quality === "1080p" ? "full" : "medium",
                    output_resolution: request.quality === "1080p" ? 1080 : 720,
                },
                presenter_id: "d-u-01H7YFp1q8uYbH9sgX2J9Z4",
                driver_id: "d-u-01H7YFp1q8uYbH9sgX2J9Z4",
                background: {
                    type: "color",
                    value: "#000000",
                },
            };
            this.logger.debug(`[${requestId}] 📤 Sending request to ${this.baseUrl}/talks`);
            this.logger.debug(`[${requestId}] Payload config: quality=${payload.config.quality}, resolution=${payload.config.output_resolution}`);
            this.logger.log(`[${requestId}] 🎵 Script type: ${payload.script.type} (using TTS: ${payload.script.provider.voice_id})`);
            const response = await fetch(`${this.baseUrl}/talks`, {
                method: "POST",
                headers: {
                    Authorization: `Basic ${this.apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            this.logger.debug(`[${requestId}] 📥 D-ID API response: ${response.status} ${response.statusText}`);
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`[${requestId}] ❌ D-ID API Error:`, {
                    status: response.status,
                    statusText: response.statusText,
                    url: `${this.baseUrl}/talks`,
                    method: "POST",
                    errorBody: errorText,
                    requestPayload: {
                        source_url: request.photoUrl ? '[URL_PROVIDED]' : '[NO_URL]',
                        script_length: request.script?.length || 0,
                        quality: payload.config.quality,
                        resolution: payload.config.output_resolution
                    }
                });
                try {
                    const errorJson = JSON.parse(errorText);
                    this.logger.error(`[${requestId}] 📋 Parsed D-ID error:`, errorJson);
                }
                catch {
                    this.logger.error(`[${requestId}] 📋 Raw D-ID error text: ${errorText}`);
                }
                throw new Error(`D-ID API error: ${response.status} - ${errorText}`);
            }
            const result = (await response.json());
            this.logger.log(`[${requestId}] ✅ Video generation started successfully with ID: ${result.id}`);
            this.logger.debug(`[${requestId}] Full D-ID response:`, result);
            return {
                id: result.id,
                status: "created",
            };
        }
        catch (error) {
            this.logger.error(`[${requestId}] 💥 Critical error in generateVideo:`, {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                requestParams: {
                    platform: request.platform,
                    quality: request.quality,
                    duration: request.duration,
                    hasPhoto: !!request.photoUrl,
                    hasAudio: !!request.audioUrl,
                    scriptLength: request.script?.length || 0
                }
            });
            throw error;
        }
    }
    async getVideoStatus(videoId) {
        try {
            this.logger.debug(`🔍 Checking status for video: ${videoId}`);
            const response = await fetch(`${this.baseUrl}/talks/${videoId}`, {
                headers: {
                    Authorization: `Basic ${this.apiKey}`,
                },
            });
            this.logger.debug(`📥 Status check response: ${response.status} ${response.statusText} for video ${videoId}`);
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`❌ Failed to get video status for ${videoId}:`, {
                    status: response.status,
                    statusText: response.statusText,
                    url: `${this.baseUrl}/talks/${videoId}`,
                    errorBody: errorText
                });
                throw new Error(`Failed to get video status: ${response.status} - ${errorText}`);
            }
            const result = (await response.json());
            this.logger.debug(`📊 Video ${videoId} status: ${result.status}`, {
                hasResultUrl: !!result.result_url,
                hasError: !!result.error,
                errorMessage: result.error?.message
            });
            if (result.status === 'done' && result.result_url) {
                this.logger.log(`✅ Video ${videoId} completed successfully with URL: ${result.result_url}`);
            }
            else if (result.status === 'error' || result.error) {
                this.logger.error(`❌ Video ${videoId} failed:`, {
                    status: result.status,
                    error: result.error,
                    fullResponse: result
                });
            }
            return {
                id: result.id,
                status: result.status || "unknown",
                result_url: result.result_url,
                error: result.error?.message,
            };
        }
        catch (error) {
            this.logger.error(`💥 Critical error getting video status for ${videoId}:`, {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }
    async uploadAudio(audioBuffer) {
        const uploadId = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        try {
            this.logger.log(`[${uploadId}] 🎵 Starting audio upload (${audioBuffer.length} bytes)`);
            const formData = new FormData();
            formData.append("audio", new Blob([audioBuffer]), "audio.wav");
            const response = await fetch(`${this.baseUrl}/audios`, {
                method: "POST",
                headers: {
                    Authorization: `Basic ${this.apiKey}`,
                },
                body: formData,
            });
            this.logger.debug(`[${uploadId}] 📥 Audio upload response: ${response.status} ${response.statusText}`);
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`[${uploadId}] ❌ Failed to upload audio:`, {
                    status: response.status,
                    statusText: response.statusText,
                    url: `${this.baseUrl}/audios`,
                    audioSize: audioBuffer.length,
                    errorBody: errorText
                });
                throw new Error(`Failed to upload audio: ${response.status} - ${errorText}`);
            }
            const result = (await response.json());
            this.logger.log(`[${uploadId}] ✅ Audio uploaded successfully: ${result.audio_url}`);
            return result.audio_url;
        }
        catch (error) {
            this.logger.error(`[${uploadId}] 💥 Critical error uploading audio:`, {
                error: error instanceof Error ? error.message : String(error),
                audioSize: audioBuffer.length,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }
    async uploadImage(imageBuffer) {
        const uploadId = `image_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        try {
            this.logger.log(`[${uploadId}] 📸 Starting image upload (${imageBuffer.length} bytes)`);
            const formData = new FormData();
            formData.append("image", new Blob([imageBuffer]), "image.jpg");
            const response = await fetch(`${this.baseUrl}/images`, {
                method: "POST",
                headers: {
                    Authorization: `Basic ${this.apiKey}`,
                },
                body: formData,
            });
            this.logger.debug(`[${uploadId}] 📥 Image upload response: ${response.status} ${response.statusText}`);
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`[${uploadId}] ❌ Failed to upload image:`, {
                    status: response.status,
                    statusText: response.statusText,
                    url: `${this.baseUrl}/images`,
                    imageSize: imageBuffer.length,
                    errorBody: errorText
                });
                throw new Error(`Failed to upload image: ${response.status} - ${errorText}`);
            }
            const result = (await response.json());
            this.logger.log(`[${uploadId}] ✅ Image uploaded successfully: ${result.image_url}`);
            return result.image_url;
        }
        catch (error) {
            this.logger.error(`[${uploadId}] 💥 Critical error uploading image:`, {
                error: error instanceof Error ? error.message : String(error),
                imageSize: imageBuffer.length,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }
};
exports.DidService = DidService;
exports.DidService = DidService = DidService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DidService);
//# sourceMappingURL=did.service.js.map