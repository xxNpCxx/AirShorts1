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
var HeyGenService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeyGenService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let HeyGenService = HeyGenService_1 = class HeyGenService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(HeyGenService_1.name);
        this.baseUrl = "https://api.heygen.com/v2";
        this.apiKey = this.configService.get("HEYGEN_API_KEY") || "";
        if (!this.apiKey) {
            this.logger.warn("HEYGEN_API_KEY не найден в переменных окружения");
        }
    }
    async generateVideo(request) {
        const requestId = `heygen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        try {
            this.logger.log(`[${requestId}] 🚀 Starting video generation with HeyGen API`);
            this.logger.debug(`[${requestId}] Request params: platform=${request.platform}, quality=${request.quality}, duration=${request.duration}`);
            this.logger.debug(`[${requestId}] Audio provided: ${!!request.audioUrl}, Script length: ${request.script?.length || 0} chars`);
            const useCustomAudio = request.audioUrl &&
                request.audioUrl.trim() !== "" &&
                request.audioUrl !== "undefined" &&
                request.audioUrl !== "null";
            let payload = {
                video_inputs: [
                    {
                        character: {
                            type: "avatar",
                            avatar_id: "default",
                            avatar_style: "normal"
                        },
                        voice: useCustomAudio ? {
                            type: "audio",
                            audio_url: request.audioUrl
                        } : {
                            type: "text",
                            input_text: request.script,
                            voice_id: "ru-RU-SvetlanaNeural"
                        },
                        background: {
                            type: "color",
                            value: "#000000"
                        }
                    }
                ],
                dimension: {
                    width: request.quality === "1080p" ? 1080 : 720,
                    height: request.quality === "1080p" ? 1920 : 1280
                },
                aspect_ratio: "9:16"
            };
            if (useCustomAudio) {
                this.logger.log(`[${requestId}] 🎵 Using custom user audio from: ${request.audioUrl}`);
            }
            else {
                this.logger.log(`[${requestId}] 🎵 Using TTS with script: ${request.script?.substring(0, 50)}...`);
            }
            this.logger.debug(`[${requestId}] 📤 Sending request to ${this.baseUrl}/video/generate`);
            const response = await fetch(`${this.baseUrl}/video/generate`, {
                method: "POST",
                headers: {
                    "X-API-KEY": this.apiKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            this.logger.debug(`[${requestId}] 📥 HeyGen API response: ${response.status} ${response.statusText}`);
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`[${requestId}] ❌ HeyGen API Error:`, {
                    status: response.status,
                    statusText: response.statusText,
                    url: `${this.baseUrl}/video/generate`,
                    method: "POST",
                    errorBody: errorText,
                });
                throw new Error(`HeyGen API error: ${response.status} - ${errorText}`);
            }
            const result = (await response.json());
            this.logger.log(`[${requestId}] ✅ Video generation started successfully with ID: ${result.data?.video_id}`);
            this.logger.debug(`[${requestId}] Full HeyGen response:`, result);
            return {
                id: result.data?.video_id || "",
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
            this.logger.debug(`🔍 Checking status for HeyGen video: ${videoId}`);
            const response = await fetch(`${this.baseUrl}/video/${videoId}`, {
                headers: {
                    "X-API-KEY": this.apiKey,
                },
            });
            this.logger.debug(`📥 Status check response: ${response.status} ${response.statusText} for video ${videoId}`);
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`❌ Failed to get video status for ${videoId}:`, {
                    status: response.status,
                    statusText: response.statusText,
                    url: `${this.baseUrl}/video/${videoId}`,
                    errorBody: errorText
                });
                throw new Error(`Failed to get video status: ${response.status} - ${errorText}`);
            }
            const result = (await response.json());
            this.logger.debug(`📊 Video ${videoId} status: ${result.data?.status}`, {
                hasResultUrl: !!result.data?.video_url,
                hasError: !!result.data?.error,
                errorMessage: result.data?.error
            });
            if (result.data?.status === 'completed' && result.data?.video_url) {
                this.logger.log(`✅ Video ${videoId} completed successfully with URL: ${result.data.video_url}`);
            }
            else if (result.data?.status === 'failed' || result.data?.error) {
                this.logger.error(`❌ Video ${videoId} failed:`, {
                    status: result.data?.status,
                    error: result.data?.error,
                    fullResponse: result
                });
            }
            return {
                id: result.data?.video_id || videoId,
                status: result.data?.status || "unknown",
                result_url: result.data?.video_url,
                error: result.data?.error,
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
        const uploadId = `heygen_audio_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        try {
            this.logger.log(`[${uploadId}] 🎵 Starting audio upload to HeyGen (${audioBuffer.length} bytes)`);
            const formData = new FormData();
            formData.append("file", new Blob([audioBuffer]), "audio.wav");
            const response = await fetch(`${this.baseUrl}/assets/upload`, {
                method: "POST",
                headers: {
                    "X-API-KEY": this.apiKey,
                },
                body: formData,
            });
            this.logger.debug(`[${uploadId}] 📥 Audio upload response: ${response.status} ${response.statusText}`);
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`[${uploadId}] ❌ Failed to upload audio to HeyGen:`, {
                    status: response.status,
                    statusText: response.statusText,
                    url: `${this.baseUrl}/assets/upload`,
                    audioSize: audioBuffer.length,
                    errorBody: errorText
                });
                throw new Error(`Failed to upload audio: ${response.status} - ${errorText}`);
            }
            const result = await response.json();
            this.logger.debug(`[${uploadId}] 📋 Full audio upload response:`, result);
            const audioUrl = result.data?.url || result.url || result.audio_url;
            if (!audioUrl) {
                this.logger.error(`[${uploadId}] ❌ No audio URL in HeyGen response:`, result);
                throw new Error('No audio URL received from HeyGen API');
            }
            this.logger.log(`[${uploadId}] ✅ Audio uploaded to HeyGen successfully: ${audioUrl}`);
            return audioUrl;
        }
        catch (error) {
            this.logger.error(`[${uploadId}] 💥 Critical error uploading audio to HeyGen:`, {
                error: error instanceof Error ? error.message : String(error),
                audioSize: audioBuffer.length,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }
    async uploadImage(imageBuffer) {
        const uploadId = `heygen_image_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        try {
            this.logger.log(`[${uploadId}] 📸 Starting image upload to HeyGen (${imageBuffer.length} bytes)`);
            const formData = new FormData();
            formData.append("file", new Blob([imageBuffer]), "image.jpg");
            const response = await fetch(`${this.baseUrl}/assets/upload`, {
                method: "POST",
                headers: {
                    "X-API-KEY": this.apiKey,
                },
                body: formData,
            });
            this.logger.debug(`[${uploadId}] 📥 Image upload response: ${response.status} ${response.statusText}`);
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`[${uploadId}] ❌ Failed to upload image to HeyGen:`, {
                    status: response.status,
                    statusText: response.statusText,
                    url: `${this.baseUrl}/assets/upload`,
                    imageSize: imageBuffer.length,
                    errorBody: errorText
                });
                throw new Error(`Failed to upload image: ${response.status} - ${errorText}`);
            }
            const result = await response.json();
            this.logger.debug(`[${uploadId}] 📋 Full image upload response:`, result);
            const imageUrl = result.data?.url || result.url || result.image_url;
            if (!imageUrl) {
                this.logger.error(`[${uploadId}] ❌ No image URL in HeyGen response:`, result);
                throw new Error('No image URL received from HeyGen API');
            }
            this.logger.log(`[${uploadId}] ✅ Image uploaded to HeyGen successfully: ${imageUrl}`);
            return imageUrl;
        }
        catch (error) {
            this.logger.error(`[${uploadId}] 💥 Critical error uploading image to HeyGen:`, {
                error: error instanceof Error ? error.message : String(error),
                imageSize: imageBuffer.length,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }
};
exports.HeyGenService = HeyGenService;
exports.HeyGenService = HeyGenService = HeyGenService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], HeyGenService);
//# sourceMappingURL=heygen.service.js.map