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
exports.validateStandardVideoPayload = validateStandardVideoPayload;
exports.validateAvatarIVPayload = validateAvatarIVPayload;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
function validateStandardVideoPayload(payload) {
    return (Array.isArray(payload.video_inputs) &&
        payload.video_inputs.length > 0 &&
        payload.dimension &&
        typeof payload.dimension.width === 'number' &&
        typeof payload.dimension.height === 'number' &&
        payload.video_inputs.every((input) => input.character &&
            ['avatar', 'talking_photo'].includes(input.character.type) &&
            input.voice &&
            ['text', 'audio'].includes(input.voice.type)));
}
function validateAvatarIVPayload(payload) {
    return (typeof payload.image_key === 'string' &&
        typeof payload.video_title === 'string' &&
        typeof payload.script === 'string' &&
        typeof payload.voice_id === 'string' &&
        (!payload.video_orientation || ['portrait', 'landscape'].includes(payload.video_orientation)) &&
        (!payload.fit || ['cover', 'contain'].includes(payload.fit)));
}
const HEYGEN_API = {
    baseUrl: 'https://api.heygen.com',
    version: 'v2',
    endpoints: {
        avatarIV: '/v2/video/av4/generate',
        standardAvatar: '/v2/video/generate',
        uploadAsset: '/v1/upload',
        listAvatars: '/v1/avatar.list',
        videoStatus: '/v1/video_status.get'
    }
};
let HeyGenService = HeyGenService_1 = class HeyGenService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(HeyGenService_1.name);
        this.baseUrl = HEYGEN_API.baseUrl;
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
                request.audioUrl !== "null" &&
                !request.audioUrl.includes('heygen_tts_required');
            const availableAvatars = await this.getAvailableAvatars();
            const defaultAvatarId = availableAvatars[0] || "1bd001e7-c335-4a6a-9d1b-8f8b5b5b5b5b";
            let payload = {
                video_inputs: [
                    {
                        character: {
                            type: "avatar",
                            avatar_id: defaultAvatarId,
                            avatar_style: "normal"
                        },
                        voice: {
                            type: "text",
                            input_text: request.script,
                            voice_id: "119caed25533477ba63822d5d1552d25",
                            speed: 1.0
                        }
                    }
                ],
                dimension: {
                    width: 1280,
                    height: 720
                }
            };
            if (request.imageUrl && request.imageUrl.trim() !== "" && request.imageUrl !== "undefined" && request.imageUrl !== "null" && request.imageUrl !== "heygen_placeholder_image_url" && request.imageUrl !== "heygen_use_available_avatar") {
                this.logger.log(`[${requestId}] 📸 Используем пользовательское фото в Standard API: ${request.imageUrl}`);
                if (request.imageUrl.includes('photo_avatar_')) {
                    this.logger.log(`[${requestId}] 🎭 Используем Photo Avatar как TalkingPhoto`);
                    payload.video_inputs[0].character = {
                        type: "talking_photo",
                        talking_photo_id: request.imageUrl,
                        talking_photo_style: "square",
                        talking_style: "expressive",
                        expression: "default",
                        super_resolution: true,
                        scale: 1.0
                    };
                }
                else {
                    this.logger.log(`[${requestId}] 🖼️ Используем изображение как Background`);
                    payload.video_inputs[0].background = {
                        type: "image",
                        image_asset_id: request.imageUrl,
                        fit: "cover"
                    };
                }
            }
            if (useCustomAudio) {
                this.logger.log(`[${requestId}] 🎵 Используем пользовательское аудио asset: ${request.audioUrl}`);
                payload.video_inputs[0].voice = {
                    type: "audio",
                    audio_asset_id: request.audioUrl
                };
            }
            if (!request.imageUrl || request.imageUrl === "heygen_use_available_avatar" || request.imageUrl === "heygen_placeholder_image_url") {
                this.logger.log(`[${requestId}] 📸 Using available avatar: ${defaultAvatarId}`);
            }
            if (useCustomAudio) {
                this.logger.log(`[${requestId}] 🎵 Using custom user audio from: ${request.audioUrl}`);
            }
            else {
                this.logger.log(`[${requestId}] 🎵 Using TTS with script: ${request.script?.substring(0, 50)}...`);
            }
            if (!validateStandardVideoPayload(payload)) {
                this.logger.error(`[${requestId}] ❌ Invalid Standard Video API parameters:`, payload);
                throw new Error('Invalid Standard Video API parameters');
            }
            this.logger.log(`[${requestId}] 📤 Standard Video payload (validated):`, payload);
            this.logger.log(`[${requestId}] 📤 Sending request to ${this.baseUrl}${HEYGEN_API.endpoints.standardAvatar}`);
            const response = await fetch(`${this.baseUrl}${HEYGEN_API.endpoints.standardAvatar}`, {
                method: "POST",
                headers: {
                    "X-API-KEY": this.apiKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            this.logger.log(`[${requestId}] 📥 HeyGen API response: ${response.status} ${response.statusText}`);
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`[${requestId}] ❌ HeyGen API Error:`, {
                    status: response.status,
                    statusText: response.statusText,
                    url: `${this.baseUrl}/v2/video/generate`,
                    method: "POST",
                    errorBody: errorText,
                });
                throw new Error(`HeyGen API error: ${response.status} - ${errorText}`);
            }
            const result = (await response.json());
            this.logger.log(`[${requestId}] ✅ Video generation started successfully with ID: ${result.data?.video_id}`);
            this.logger.log(`[${requestId}] Full HeyGen response:`, result);
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
            const response = await fetch(`${this.baseUrl}/v1/video_status.get?video_id=${videoId}`, {
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
                    url: `${this.baseUrl}/v1/video_status.get?video_id=${videoId}`,
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
                id: result.data?.id || videoId,
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
            this.logger.log(`[${uploadId}] 🎵 Загружаем пользовательское аудио в HeyGen Assets (${audioBuffer.length} bytes)`);
            const FormData = require('form-data');
            const formData = new FormData();
            formData.append('file', audioBuffer, {
                filename: 'user_audio.wav',
                contentType: 'audio/wav',
                knownLength: audioBuffer.length
            });
            this.logger.debug(`[${uploadId}] 📤 FormData prepared with ${audioBuffer.length} bytes`);
            const response = await fetch('https://upload.heygen.com/v1/asset', {
                method: 'POST',
                headers: {
                    'X-Api-Key': this.apiKey,
                    ...formData.getHeaders(),
                },
                body: formData,
            });
            this.logger.log(`[${uploadId}] 📥 Upload Asset response: ${response.status} ${response.statusText}`);
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`[${uploadId}] ❌ Audio upload failed: ${response.status} ${response.statusText}`);
                this.logger.error(`[${uploadId}] Error details: ${errorText}`);
                throw new Error(`Audio upload failed: ${response.status} - ${errorText}`);
            }
            const result = await response.json();
            this.logger.log(`[${uploadId}] 📋 Upload Asset response data:`, result);
            const audioAssetId = result.data?.asset_id || result.asset_id;
            if (!audioAssetId) {
                this.logger.error(`[${uploadId}] ❌ No asset_id in response:`, result);
                throw new Error('No asset_id returned from HeyGen Upload Asset API');
            }
            this.logger.log(`[${uploadId}] ✅ Audio uploaded successfully: ${audioAssetId}`);
            return audioAssetId;
        }
        catch (error) {
            this.logger.error(`[${uploadId}] ❌ Error uploading audio:`, error);
            throw error;
        }
    }
    async uploadImage(imageBuffer) {
        const uploadId = `heygen_image_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        try {
            this.logger.log(`[${uploadId}] 🖼️ Загружаем пользовательское фото в HeyGen Assets (${imageBuffer.length} bytes)`);
            const FormData = require('form-data');
            const formData = new FormData();
            formData.append('file', imageBuffer, {
                filename: 'user_photo.jpg',
                contentType: 'image/jpeg',
                knownLength: imageBuffer.length
            });
            this.logger.debug(`[${uploadId}] 📤 FormData prepared with ${imageBuffer.length} bytes`);
            const response = await fetch('https://upload.heygen.com/v1/asset', {
                method: 'POST',
                headers: {
                    'X-Api-Key': this.apiKey,
                    ...formData.getHeaders(),
                },
                body: formData,
            });
            this.logger.log(`[${uploadId}] 📥 Upload Asset response: ${response.status} ${response.statusText}`);
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`[${uploadId}] ❌ Image upload failed: ${response.status} ${response.statusText}`);
                this.logger.error(`[${uploadId}] Error details: ${errorText}`);
                throw new Error(`Image upload failed: ${response.status} - ${errorText}`);
            }
            const result = await response.json();
            this.logger.log(`[${uploadId}] 📋 Upload Asset response data:`, result);
            const imageKey = result.data?.image_key || result.image_key;
            const assetId = result.data?.asset_id || result.asset_id;
            if (imageKey) {
                this.logger.log(`[${uploadId}] ✅ Image Key для Avatar IV: ${imageKey}`);
                return imageKey;
            }
            else if (assetId) {
                this.logger.log(`[${uploadId}] ✅ Asset ID для Standard API: ${assetId}`);
                return assetId;
            }
            else {
                this.logger.error(`[${uploadId}] ❌ No image_key or asset_id in response:`, result);
                throw new Error('No image_key or asset_id returned from HeyGen Upload Asset API');
            }
        }
        catch (error) {
            this.logger.error(`[${uploadId}] ❌ Error uploading image:`, error);
            throw error;
        }
    }
    async uploadImageFallback(imageBuffer, uploadId) {
        try {
            this.logger.log(`[${uploadId}] 🔄 Fallback: trying direct image upload...`);
            const formData = new FormData();
            formData.append('image', new Blob([imageBuffer]), 'user_photo.jpg');
            const response = await fetch(`${this.baseUrl}/v2/image/upload`, {
                method: 'POST',
                headers: {
                    'X-API-KEY': this.apiKey,
                },
                body: formData,
            });
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`[${uploadId}] ❌ Fallback image upload failed: ${response.status} ${response.statusText}`);
                this.logger.error(`[${uploadId}] Error details: ${errorText}`);
                this.logger.warn(`[${uploadId}] ⚠️ Will use default avatar instead of custom photo`);
                return "heygen_placeholder_image_url";
            }
            const result = await response.json();
            const imageUrl = result.data?.image_url || result.image_url || result.url;
            this.logger.log(`[${uploadId}] ✅ Fallback image upload successful: ${imageUrl}`);
            return imageUrl;
        }
        catch (error) {
            this.logger.error(`[${uploadId}] ❌ Fallback image upload error:`, error);
            this.logger.warn(`[${uploadId}] ⚠️ Will use default avatar instead of custom photo`);
            return "heygen_placeholder_image_url";
        }
    }
    async getAvailableAvatars() {
        try {
            const response = await fetch(`${this.baseUrl}/v1/avatar.list`, {
                headers: {
                    'X-API-KEY': this.apiKey,
                },
            });
            if (!response.ok) {
                this.logger.warn('Failed to get available avatars, using hardcoded fallback');
                return this.getHardcodedAvatars();
            }
            const result = await response.json();
            const avatars = result.data?.avatars || [];
            const avatarIds = avatars.map((avatar) => avatar.avatar_id).filter(Boolean);
            if (avatarIds.length === 0) {
                this.logger.warn('No avatars found, using hardcoded fallback');
                return this.getHardcodedAvatars();
            }
            this.logger.log(`Found ${avatarIds.length} available avatars: ${avatarIds.slice(0, 3).join(', ')}...`);
            return avatarIds;
        }
        catch (error) {
            this.logger.error('Error getting available avatars:', error);
            return this.getHardcodedAvatars();
        }
    }
    getHardcodedAvatars() {
        return [
            "Abigail_expressive_2024112501",
            "Abigail_standing_office_front",
            "Abigail_sitting_sofa_front",
            "1bd001e7-c335-4a6a-9d1b-8f8b5b5b5b5b",
            "Abigail_standing_office_front_2024112501"
        ];
    }
    async createPhotoAvatar(photoUrl, callbackId) {
        const requestId = `photo_avatar_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        try {
            this.logger.log(`📸 [HEYGEN_PHOTO_AVATAR] Starting Photo Avatar creation`, {
                requestId,
                callbackId,
                photoUrl: photoUrl.substring(0, 100) + '...',
                webhookUrl: `${process.env.WEBHOOK_URL}/heygen/webhook`,
                timestamp: new Date().toISOString()
            });
            const payload = {
                name: `avatar_${callbackId}`,
                photo_url: photoUrl,
                callback_url: `${process.env.WEBHOOK_URL}/heygen/webhook`,
                callback_id: callbackId
            };
            this.logger.log(`📤 [HEYGEN_PHOTO_AVATAR] Sending request to HeyGen API`, {
                requestId,
                callbackId,
                endpoint: `${this.baseUrl}/v1/photo_avatar.create`,
                payload: {
                    name: payload.name,
                    photo_url: payload.photo_url.substring(0, 100) + '...',
                    callback_url: payload.callback_url,
                    callback_id: payload.callback_id
                },
                timestamp: new Date().toISOString()
            });
            const response = await fetch(`${this.baseUrl}/v1/photo_avatar.create`, {
                method: 'POST',
                headers: {
                    'X-API-KEY': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            this.logger.log(`📥 [HEYGEN_PHOTO_AVATAR] Received response from HeyGen API`, {
                requestId,
                callbackId,
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                timestamp: new Date().toISOString()
            });
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`❌ [HEYGEN_PHOTO_AVATAR] API request failed`, {
                    requestId,
                    callbackId,
                    status: response.status,
                    statusText: response.statusText,
                    errorBody: errorText,
                    timestamp: new Date().toISOString()
                });
                throw new Error(`Photo Avatar creation failed: ${response.status} - ${errorText}`);
            }
            const result = await response.json();
            this.logger.log(`📋 [HEYGEN_PHOTO_AVATAR] Response data received`, {
                requestId,
                callbackId,
                responseData: result,
                timestamp: new Date().toISOString()
            });
            const avatarId = result.data?.avatar_id || result.avatar_id;
            if (!avatarId) {
                this.logger.error(`❌ [HEYGEN_PHOTO_AVATAR] No avatar_id in response`, {
                    requestId,
                    callbackId,
                    responseData: result,
                    timestamp: new Date().toISOString()
                });
                throw new Error('No avatar_id returned from Photo Avatar API');
            }
            this.logger.log(`✅ [HEYGEN_PHOTO_AVATAR] Photo Avatar created successfully`, {
                requestId,
                callbackId,
                avatarId,
                timestamp: new Date().toISOString()
            });
            return avatarId;
        }
        catch (error) {
            this.logger.error(`❌ [HEYGEN_PHOTO_AVATAR] Error creating Photo Avatar`, {
                requestId,
                callbackId,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                photoUrl: photoUrl.substring(0, 100) + '...',
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }
    async createVoiceClone(audioUrl, callbackId) {
        const requestId = `voice_clone_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        try {
            this.logger.log(`[${requestId}] 🎵 Creating Voice Clone from: ${audioUrl}`);
            const payload = {
                name: `voice_${callbackId}`,
                audio_url: audioUrl,
                callback_url: `${process.env.WEBHOOK_URL}/heygen/webhook`,
                callback_id: callbackId
            };
            this.logger.debug(`[${requestId}] 📤 Voice Cloning payload:`, payload);
            const response = await fetch(`${this.baseUrl}/v1/voice_cloning.create`, {
                method: 'POST',
                headers: {
                    'X-API-KEY': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            this.logger.log(`[${requestId}] 📥 Voice Cloning response: ${response.status} ${response.statusText}`);
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`[${requestId}] ❌ Voice Cloning failed: ${response.status} - ${errorText}`);
                throw new Error(`Voice Cloning failed: ${response.status} - ${errorText}`);
            }
            const result = await response.json();
            const voiceId = result.data?.voice_id || result.voice_id;
            if (!voiceId) {
                this.logger.error(`[${requestId}] ❌ No voice_id in response:`, result);
                throw new Error('No voice_id returned from Voice Cloning API');
            }
            this.logger.log(`[${requestId}] ✅ Voice Clone created successfully: ${voiceId}`);
            return voiceId;
        }
        catch (error) {
            this.logger.error(`[${requestId}] ❌ Error creating Voice Clone:`, error);
            throw error;
        }
    }
    async generateDigitalTwinVideo(avatarId, voiceId, script, videoTitle, callbackId) {
        const requestId = `digital_twin_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        try {
            this.logger.log(`[${requestId}] 🎬 Generating Digital Twin Video`);
            this.logger.log(`[${requestId}] Avatar ID: ${avatarId}, Voice ID: ${voiceId}`);
            this.logger.log(`[${requestId}] Script length: ${script.length} chars`);
            const payload = {
                image_key: avatarId,
                video_title: videoTitle,
                script: script,
                voice_id: voiceId,
                video_orientation: "portrait",
                fit: "cover"
            };
            if (!validateAvatarIVPayload(payload)) {
                this.logger.error(`[${requestId}] ❌ Invalid Avatar IV payload:`, payload);
                throw new Error('Invalid Avatar IV payload');
            }
            this.logger.debug(`[${requestId}] 📤 Avatar IV payload (validated):`, payload);
            const response = await fetch(`${this.baseUrl}${HEYGEN_API.endpoints.avatarIV}`, {
                method: 'POST',
                headers: {
                    'X-API-KEY': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            this.logger.log(`[${requestId}] 📥 Avatar IV response: ${response.status} ${response.statusText}`);
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`[${requestId}] ❌ Avatar IV generation failed: ${response.status} - ${errorText}`);
                throw new Error(`Avatar IV generation failed: ${response.status} - ${errorText}`);
            }
            const result = await response.json();
            const videoId = result.data?.video_id || result.video_id;
            if (!videoId) {
                this.logger.error(`[${requestId}] ❌ No video_id in response:`, result);
                throw new Error('No video_id returned from Avatar IV API');
            }
            this.logger.log(`[${requestId}] ✅ Digital Twin Video generation started: ${videoId}`);
            return videoId;
        }
        catch (error) {
            this.logger.error(`[${requestId}] ❌ Error generating Digital Twin Video:`, error);
            throw error;
        }
    }
    async setupWebhook() {
        const webhookUrl = `${process.env.WEBHOOK_URL}/heygen/webhook`;
        try {
            this.logger.log(`🔗 Setting up HeyGen webhook: ${webhookUrl}`);
            const response = await fetch(`${this.baseUrl}/v1/webhook/endpoint.add`, {
                method: 'POST',
                headers: {
                    'X-API-KEY': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: webhookUrl,
                    events: [
                        'photo_avatar.success',
                        'photo_avatar.failed',
                        'voice_clone.success',
                        'voice_clone.failed',
                        'video.success',
                        'video.failed'
                    ]
                })
            });
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`❌ Failed to setup webhook: ${response.status} - ${errorText}`);
                throw new Error(`Webhook setup failed: ${response.status} - ${errorText}`);
            }
            const result = await response.json();
            this.logger.log(`✅ HeyGen webhook setup successfully:`, result);
        }
        catch (error) {
            this.logger.error(`❌ Error setting up HeyGen webhook:`, error);
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