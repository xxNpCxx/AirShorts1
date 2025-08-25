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
        this.baseUrl = 'https://api.d-id.com';
        this.apiKey = this.configService.get('DID_API_KEY') || 'eHhucGN4eEBnbWFpbC5jb20:coOsJoP3VqEWDKyQ7FobG';
    }
    async generateVideo(request) {
        try {
            this.logger.log('Starting video generation with d-id API');
            const payload = {
                source_url: request.photoUrl,
                script: {
                    type: 'text',
                    input: request.script,
                    provider: {
                        type: 'microsoft',
                        voice_id: 'en-US-JennyNeural'
                    }
                },
                config: {
                    fluent: true,
                    pad_audio: 0.1,
                    stitch: true,
                    align_driver: true,
                    align_expand_factor: 1,
                    auto_match: true,
                    normalization_factor: 1,
                    motion_factor: 1,
                    result_format: 'mp4',
                    quality: request.quality === '1080p' ? 'full' : 'medium',
                    output_resolution: request.quality === '1080p' ? '1080p' : '720p'
                },
                presenter_id: 'd-u-01H7YFp1q8uYbH9sgX2J9Z4',
                driver_id: 'd-u-01H7YFp1q8uYbH9sgX2J9Z4',
                background: {
                    type: 'color',
                    value: '#000000'
                }
            };
            const response = await fetch(`${this.baseUrl}/talks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`d-id API error: ${response.status} - ${errorText}`);
                throw new Error(`d-id API error: ${response.status}`);
            }
            const result = await response.json();
            this.logger.log(`Video generation started with ID: ${result.id}`);
            return {
                id: result.id,
                status: 'created',
            };
        }
        catch (error) {
            this.logger.error('Error generating video:', error);
            throw error;
        }
    }
    async getVideoStatus(videoId) {
        try {
            const response = await fetch(`${this.baseUrl}/talks/${videoId}`, {
                headers: {
                    'Authorization': `Basic ${this.apiKey}`,
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to get video status: ${response.status}`);
            }
            const result = await response.json();
            return {
                id: result.id,
                status: result.status,
                result_url: result.result_url,
                error: result.error?.message,
            };
        }
        catch (error) {
            this.logger.error('Error getting video status:', error);
            throw error;
        }
    }
    async uploadAudio(audioBuffer) {
        try {
            const formData = new FormData();
            formData.append('audio', new Blob([audioBuffer]), 'audio.wav');
            const response = await fetch(`${this.baseUrl}/audios`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${this.apiKey}`,
                },
                body: formData,
            });
            if (!response.ok) {
                throw new Error(`Failed to upload audio: ${response.status}`);
            }
            const result = await response.json();
            return result.audio_url;
        }
        catch (error) {
            this.logger.error('Error uploading audio:', error);
            throw error;
        }
    }
    async uploadImage(imageBuffer) {
        try {
            const formData = new FormData();
            formData.append('image', new Blob([imageBuffer]), 'image.jpg');
            const response = await fetch(`${this.baseUrl}/images`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${this.apiKey}`,
                },
                body: formData,
            });
            if (!response.ok) {
                throw new Error(`Failed to upload image: ${response.status}`);
            }
            const result = await response.json();
            return result.image_url;
        }
        catch (error) {
            this.logger.error('Error uploading image:', error);
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