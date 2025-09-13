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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var HeyGenService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeyGenService = exports.validateAvatarIVPayload = exports.validateStandardVideoPayload = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
/**
 * Validates Standard Video API payload against API specification
 * @param payload - Object to validate
 * @returns true if valid, false otherwise
 */
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
exports.validateStandardVideoPayload = validateStandardVideoPayload;
/**
 * Validates Avatar IV payload against API specification
 * @param payload - Object to validate
 * @returns true if valid, false otherwise
 */
function validateAvatarIVPayload(payload) {
    return (typeof payload.image_key === 'string' &&
        typeof payload.video_title === 'string' &&
        typeof payload.script === 'string' &&
        typeof payload.voice_id === 'string' &&
        (!payload.video_orientation || ['portrait', 'landscape'].includes(payload.video_orientation)) &&
        (!payload.fit || ['cover', 'contain'].includes(payload.fit)));
}
exports.validateAvatarIVPayload = validateAvatarIVPayload;
/**
 * HeyGen API Configuration
 *
 * @version Avatar IV API v2 (current)
 * @baseUrl https://api.heygen.com
 * @uploadUrl https://upload.heygen.com
 * @endpoints
 *   - POST /v2/video/av4/generate (Avatar IV)
 *   - POST /v2/video/generate (Standard Avatar)
 *   - POST /v1/asset (Asset Upload)
 *   - GET /v1/avatar.list (List Avatars)
 *   - GET /v1/video_status.get (Video Status)
 * @lastUpdated 2025-09-06
 * @documentation https://docs.heygen.com/reference/create-avatar-iv-video
 */
const HEYGEN_API = {
    baseUrl: 'https://api.heygen.com',
    uploadUrl: 'https://upload.heygen.com',
    version: 'v2',
    endpoints: {
        avatarIV: '/v2/video/av4/generate',
        standardAvatar: '/v2/video/generate',
        uploadAsset: '/v1/asset',
        listAvatars: '/v1/avatar.list',
        videoStatus: '/v1/video_status.get',
    },
};
let HeyGenService = HeyGenService_1 = class HeyGenService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(HeyGenService_1.name);
        this.baseUrl = HEYGEN_API.baseUrl;
        this.apiKey = this.configService.get('HEYGEN_API_KEY') || '';
        if (!this.apiKey) {
            this.logger.warn('HEYGEN_API_KEY не найден в переменных окружения');
        }
    }
    /**
     * Generate video using HeyGen API
     *
     * @see https://docs.heygen.com/reference/create-an-avatar-video-v2
     * @see https://docs.heygen.com/reference/create-avatar-iv-video
     * @endpoint POST /v2/video/generate (Standard Avatar API)
     * @endpoint POST /v2/video/av4/generate (Avatar IV API)
     * @param request - Video generation parameters
     * @returns Promise with video generation response
     * @throws Error if API validation fails or request is invalid
     */
    async generateVideo(request) {
        const requestId = `heygen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        try {
            this.logger.log(`[${requestId}] 🚀 Starting video generation with HeyGen API`);
            this.logger.debug(`[${requestId}] Request params: platform=${request.platform}, quality=${request.quality}, duration=${request.duration}`);
            this.logger.debug(`[${requestId}] Audio provided: ${!!request.audioUrl}, Script length: ${request.script?.length || 0} chars`);
            // Определяем, использовать ли пользовательское аудио или TTS
            const useCustomAudio = request.audioUrl &&
                request.audioUrl.trim() !== '' &&
                request.audioUrl !== 'undefined' &&
                request.audioUrl !== 'null' &&
                !request.audioUrl.includes('heygen_tts_required');
            // Получаем список доступных аватаров для дефолтного значения
            const availableAvatars = await this.getAvailableAvatars();
            const defaultAvatarId = availableAvatars[0] || '1bd001e7-c335-4a6a-9d1b-8f8b5b5b5b5b';
            // HeyGen API v2 структура согласно документации
            const payload = {
                video_inputs: [
                    {
                        character: {
                            type: 'avatar',
                            avatar_id: defaultAvatarId, // Рабочий аватар для бесплатного плана
                            avatar_style: 'normal',
                        },
                        voice: {
                            type: 'text',
                            input_text: request.script,
                            voice_id: '119caed25533477ba63822d5d1552d25', // Голос из документации
                            speed: 1.0,
                        },
                    },
                ],
                dimension: {
                    width: 1280,
                    height: 720,
                },
            };
            // Если есть пользовательское фото, создаем TalkingPhoto в Standard API
            if (request.imageUrl &&
                request.imageUrl.trim() !== '' &&
                request.imageUrl !== 'undefined' &&
                request.imageUrl !== 'null' &&
                request.imageUrl !== 'heygen_placeholder_image_url' &&
                request.imageUrl !== 'heygen_use_available_avatar') {
                this.logger.log(`[${requestId}] 📸 Используем пользовательское фото в Standard API: ${request.imageUrl}`);
                // Определяем тип загруженного изображения
                if (request.imageUrl.includes('photo_avatar_')) {
                    // Photo Avatar - используем TalkingPhoto
                    this.logger.log(`[${requestId}] 🎭 Используем Photo Avatar как TalkingPhoto`);
                    payload.video_inputs[0].character = {
                        type: 'talking_photo',
                        talking_photo_id: request.imageUrl,
                        talking_photo_style: 'square',
                        talking_style: 'expressive',
                        expression: 'default',
                        super_resolution: true,
                        scale: 1.0,
                    };
                }
                else {
                    // Asset или image_key - используем как Image Background
                    this.logger.log(`[${requestId}] 🖼️ Используем изображение как Background`);
                    payload.video_inputs[0].background = {
                        type: 'image',
                        image_asset_id: request.imageUrl,
                        fit: 'cover',
                    };
                }
            }
            // Если есть валидное пользовательское аудио, используем его
            if (useCustomAudio) {
                this.logger.log(`[${requestId}] 🎵 Используем пользовательское аудио asset: ${request.audioUrl}`);
                payload.video_inputs[0].voice = {
                    type: 'audio',
                    audio_asset_id: request.audioUrl,
                };
            }
            // Если нет пользовательского фото, используем доступный аватар
            if (!request.imageUrl ||
                request.imageUrl === 'heygen_use_available_avatar' ||
                request.imageUrl === 'heygen_placeholder_image_url') {
                this.logger.log(`[${requestId}] 📸 Using available avatar: ${defaultAvatarId}`);
                // defaultAvatarId уже установлен в payload выше
            }
            // Логируем финальный тип голоса
            if (useCustomAudio) {
                this.logger.log(`[${requestId}] 🎵 Using custom user audio from: ${request.audioUrl}`);
            }
            else {
                this.logger.log(`[${requestId}] 🎵 Using TTS with script: ${request.script?.substring(0, 50)}...`);
            }
            // Валидация payload согласно API стандартам
            if (!validateStandardVideoPayload(payload)) {
                this.logger.error(`[${requestId}] ❌ Invalid Standard Video API parameters:`, payload);
                throw new Error('Invalid Standard Video API parameters');
            }
            this.logger.log(`[${requestId}] 📤 Standard Video payload (validated):`, payload);
            this.logger.log(`[${requestId}] 📤 Sending request to ${this.baseUrl}${HEYGEN_API.endpoints.standardAvatar}`);
            const response = await fetch(`${this.baseUrl}${HEYGEN_API.endpoints.standardAvatar}`, {
                method: 'POST',
                headers: {
                    'X-API-KEY': this.apiKey,
                    'Content-Type': 'application/json',
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
                    method: 'POST',
                    errorBody: errorText,
                });
                throw new Error(`HeyGen API error: ${response.status} - ${errorText}`);
            }
            const result = (await response.json());
            this.logger.log(`[${requestId}] ✅ Video generation started successfully with ID: ${result.data?.video_id}`);
            this.logger.log(`[${requestId}] Full HeyGen response:`, result);
            return {
                id: result.data?.video_id || '',
                status: 'created',
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
                    scriptLength: request.script?.length || 0,
                },
            });
            throw error;
        }
    }
    async getVideoStatus(videoId) {
        try {
            this.logger.debug(`🔍 Checking status for HeyGen video: ${videoId}`);
            const response = await fetch(`${this.baseUrl}/v1/video_status.get?video_id=${videoId}`, {
                headers: {
                    'X-API-KEY': this.apiKey,
                },
            });
            this.logger.debug(`📥 Status check response: ${response.status} ${response.statusText} for video ${videoId}`);
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`❌ Failed to get video status for ${videoId}:`, {
                    status: response.status,
                    statusText: response.statusText,
                    url: `${this.baseUrl}/v1/video_status.get?video_id=${videoId}`,
                    errorBody: errorText,
                });
                throw new Error(`Failed to get video status: ${response.status} - ${errorText}`);
            }
            const result = (await response.json());
            this.logger.debug(`📊 Video ${videoId} status: ${result.data?.status}`, {
                hasResultUrl: !!result.data?.video_url,
                hasError: !!result.data?.error,
                errorMessage: result.data?.error,
            });
            // Логируем особые статусы
            if (result.data?.status === 'completed' && result.data?.video_url) {
                this.logger.log(`✅ Video ${videoId} completed successfully with URL: ${result.data.video_url}`);
            }
            else if (result.data?.status === 'failed' || result.data?.error) {
                this.logger.error(`❌ Video ${videoId} failed:`, {
                    status: result.data?.status,
                    error: result.data?.error,
                    fullResponse: result,
                });
            }
            return {
                id: result.data?.id || videoId,
                status: result.data?.status || 'unknown',
                result_url: result.data?.video_url,
                error: result.data?.error,
            };
        }
        catch (error) {
            this.logger.error(`💥 Critical error getting video status for ${videoId}:`, {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
            throw error;
        }
    }
    /**
     * Upload audio to HeyGen Assets API for Standard Avatar API
     *
     * @see https://docs.heygen.com/reference/upload-asset
     * @endpoint POST /v1/upload
     * @param audioBuffer - Audio file buffer
     * @returns Promise with audio asset ID
     * @throws Error if upload fails
     */
    /**
     * Upload audio asset to HeyGen API using presigned upload URL
     *
     * @see https://docs.heygen.com/reference/upload-asset
     * @endpoint POST /v2/audio_assets (create resource) + PUT to presigned URL (upload file)
     * @param audioBuffer - Audio file buffer
     * @returns Promise with audio asset ID
     * @throws Error if upload fails
     */
    async uploadAudio(audioBuffer) {
        const uploadId = `heygen_audio_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        try {
            this.logger.log(`[${uploadId}] 🎵 Загружаем пользовательское аудио в HeyGen Assets (${audioBuffer.length} bytes)`);
            // Шаг 1: Создаем аудио-ресурс и получаем presigned upload URL
            this.logger.log(`[${uploadId}] 📤 Step 1: Creating audio resource...`);
            const createResponse = await fetch(`${this.baseUrl}/v2/audio_assets`, {
                method: 'POST',
                headers: {
                    'X-Api-Key': this.apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: `audio_${uploadId}`,
                    size: audioBuffer.length,
                    content_type: 'audio/mpeg',
                }),
            });
            this.logger.log(`[${uploadId}] 📥 Create audio resource response: ${createResponse.status} ${createResponse.statusText}`);
            if (!createResponse.ok) {
                const errorText = await createResponse.text();
                this.logger.error(`[${uploadId}] ❌ Failed to create audio resource: ${createResponse.status} - ${errorText}`);
                throw new Error(`Failed to create audio resource: ${createResponse.status} - ${errorText}`);
            }
            const createResult = (await createResponse.json());
            this.logger.log(`[${uploadId}] 📋 Create audio resource response:`, createResult);
            const audioAssetId = createResult.data?.id || createResult.id;
            const uploadUrl = createResult.data?.upload_url || createResult.upload_url;
            if (!audioAssetId) {
                this.logger.error(`[${uploadId}] ❌ No audio asset ID in response:`, createResult);
                throw new Error('No audio asset ID returned from HeyGen Create Audio Resource API');
            }
            if (!uploadUrl) {
                this.logger.error(`[${uploadId}] ❌ No upload URL in response:`, createResult);
                throw new Error('No upload URL returned from HeyGen Create Audio Resource API');
            }
            this.logger.log(`[${uploadId}] ✅ Audio resource created: ${audioAssetId}`);
            this.logger.log(`[${uploadId}] 📤 Step 2: Uploading file to presigned URL...`);
            // Шаг 2: Загружаем файл на presigned URL
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'audio/mpeg',
                    'Content-Length': audioBuffer.length.toString(),
                },
                body: audioBuffer,
            });
            this.logger.log(`[${uploadId}] 📥 Upload file response: ${uploadResponse.status} ${uploadResponse.statusText}`);
            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                this.logger.error(`[${uploadId}] ❌ Audio file upload failed: ${uploadResponse.status} - ${errorText}`);
                throw new Error(`Audio file upload failed: ${uploadResponse.status} - ${errorText}`);
            }
            this.logger.log(`[${uploadId}] ✅ Audio uploaded successfully: ${audioAssetId}`);
            return audioAssetId;
        }
        catch (error) {
            this.logger.error(`[${uploadId}] ❌ Error uploading audio:`, error);
            throw error;
        }
    }
    /**
     * Upload image asset to HeyGen API for Avatar IV
     *
     * @see https://docs.heygen.com/reference/upload-asset
     * @endpoint POST https://upload.heygen.com/v1/asset
     * @param imageBuffer - Image file buffer
     * @returns Promise with image_key for Avatar IV or asset_id for Standard API
     */
    async uploadImage(imageBuffer) {
        const uploadId = `heygen_image_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        try {
            this.logger.log(`[${uploadId}] 🖼️ Загружаем пользовательское фото в HeyGen Assets (${imageBuffer.length} bytes)`);
            // Используем правильный FormData для Node.js
            const FormData = require('form-data');
            const formData = new FormData();
            // Добавляем обязательные поля согласно актуальной документации HeyGen API
            formData.append('type', 'image');
            formData.append('asset', imageBuffer, {
                filename: 'user_photo.jpg',
                contentType: 'image/jpeg',
                knownLength: imageBuffer.length,
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
            const result = (await response.json());
            this.logger.log(`[${uploadId}] 📋 Upload Asset response data:`, result);
            // Ищем image_key для Avatar IV или asset_id для Standard API
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
            formData.append('image', new Blob([new Uint8Array(imageBuffer)]), 'user_photo.jpg');
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
                return 'heygen_placeholder_image_url';
            }
            const result = (await response.json());
            const imageUrl = result.data?.image_url || result.image_url || result.url;
            this.logger.log(`[${uploadId}] ✅ Fallback image upload successful: ${imageUrl}`);
            return imageUrl;
        }
        catch (error) {
            this.logger.error(`[${uploadId}] ❌ Fallback image upload error:`, error);
            this.logger.warn(`[${uploadId}] ⚠️ Will use default avatar instead of custom photo`);
            return 'heygen_placeholder_image_url';
        }
    }
    // Получаем список доступных аватаров для fallback
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
            const result = (await response.json());
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
    // Список проверенных аватаров, которые работают с HeyGen API
    getHardcodedAvatars() {
        return [
            'Abigail_expressive_2024112501',
            'Abigail_standing_office_front',
            'Abigail_sitting_sofa_front',
            '1bd001e7-c335-4a6a-9d1b-8f8b5b5b5b5b', // Fallback ID
            'Abigail_standing_office_front_2024112501',
        ];
    }
    /**
     * Создает Photo Avatar из пользовательского фото
     * Использует Avatar IV API с загруженным изображением
     *
     * @see https://docs.heygen.com/reference/create-avatar-iv-video
     * @endpoint POST /v2/video/av4/generate
     * @param photoUrl - URL фото пользователя
     * @param callbackId - ID для webhook callback
     * @returns Promise с avatar_id (временный ID для отслеживания)
     * @throws Error если создание не удалось
     */
    async createPhotoAvatar(photoUrl, callbackId) {
        const requestId = `photo_avatar_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        try {
            this.logger.log(`📸 [HEYGEN_PHOTO_AVATAR] Starting Photo Avatar creation via Avatar IV API`, {
                requestId,
                callbackId,
                photoUrl: `${photoUrl.substring(0, 100)}...`,
                webhookUrl: `${process.env.WEBHOOK_URL}/heygen/webhook`,
                timestamp: new Date().toISOString(),
            });
            // Сначала загружаем изображение как asset
            const uploadResponse = await this.uploadAsset(photoUrl, 'image');
            this.logger.log(`📤 [HEYGEN_PHOTO_AVATAR] Image uploaded successfully`, {
                requestId,
                callbackId,
                assetKey: uploadResponse.asset_key,
                timestamp: new Date().toISOString(),
            });
            // Пока что возвращаем asset_key как avatar_id
            // В будущем здесь будет создание аватара через отдельный API
            this.logger.log(`✅ [HEYGEN_PHOTO_AVATAR] Asset uploaded, using as avatar_id`, {
                requestId,
                callbackId,
                assetKey: uploadResponse.asset_key,
                timestamp: new Date().toISOString(),
            });
            return uploadResponse.asset_key;
        }
        catch (error) {
            this.logger.error(`❌ [HEYGEN_PHOTO_AVATAR] Error creating Photo Avatar`, {
                requestId,
                callbackId,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                photoUrl: `${photoUrl.substring(0, 100)}...`,
                timestamp: new Date().toISOString(),
            });
            throw error;
        }
    }
    /**
     * Создает Photo Avatar из загруженного asset
     *
     * @param assetKey - Ключ загруженного asset
     * @param callbackId - ID для webhook callback
     * @returns Promise с avatar_id
     */
    async createPhotoAvatarFromAsset(assetKey, callbackId) {
        const requestId = `avatar_create_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        try {
            this.logger.log(`🎭 [HEYGEN_AVATAR_CREATE] Creating Photo Avatar from asset`, {
                requestId,
                callbackId,
                assetKey,
                timestamp: new Date().toISOString(),
            });
            // Создаем Photo Avatar используя Avatar IV API
            const response = await axios_1.default.post(`${HEYGEN_API.baseUrl}/v2/video/av4/generate`, {
                video_input: {
                    character: {
                        type: 'photo_avatar',
                        photo_avatar_id: assetKey,
                    },
                    voice: {
                        type: 'text',
                        input_text: 'Hello, this is a test video.',
                        voice_id: '1bd001e7e50f421d891986aad5158bc3',
                    },
                    background: {
                        type: 'color',
                        value: '#FFFFFF',
                    },
                },
                dimension: {
                    width: 720,
                    height: 1280,
                },
                aspect_ratio: '9:16',
                quality: 'medium',
                callback_url: `${process.env.WEBHOOK_URL}/heygen/webhook`,
                callback_id: callbackId,
            }, {
                headers: {
                    'X-Api-Key': this.apiKey,
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            });
            this.logger.log(`✅ [HEYGEN_AVATAR_CREATE] Photo Avatar creation initiated`, {
                requestId,
                callbackId,
                assetKey,
                responseData: response.data,
                timestamp: new Date().toISOString(),
            });
            return {
                avatar_id: response.data.data?.video_id || response.data.video_id || assetKey,
            };
        }
        catch (error) {
            // Логируем подробную информацию об ошибке
            if (error.response) {
                this.logger.error(`❌ [HEYGEN_AVATAR_CREATE] HeyGen API Error`, {
                    requestId,
                    callbackId,
                    assetKey,
                    status: error.response.status,
                    statusText: error.response.statusText,
                    errorData: error.response.data,
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                this.logger.error(`❌ [HEYGEN_AVATAR_CREATE] Network Error`, {
                    requestId,
                    callbackId,
                    assetKey,
                    error: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                    timestamp: new Date().toISOString(),
                });
            }
            throw error;
        }
    }
    /**
     * Загружает файл как asset в HeyGen
     *
     * @see https://docs.heygen.com/reference/upload-asset
     * @endpoint POST /v1/asset
     * @param fileUrl - URL файла для загрузки
     * @param fileType - Тип файла ('image' или 'audio')
     * @returns Promise с asset_key
     * @throws Error если загрузка не удалась
     */
    async uploadAsset(fileUrl, fileType) {
        const requestId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        try {
            this.logger.log(`📤 [HEYGEN_UPLOAD] Starting asset upload`, {
                requestId,
                fileUrl: `${fileUrl.substring(0, 100)}...`,
                fileType,
                endpoint: `${HEYGEN_API.uploadUrl}/v1/asset`,
                timestamp: new Date().toISOString(),
            });
            // Сначала скачиваем файл по URL
            const fileResponse = await fetch(fileUrl);
            if (!fileResponse.ok) {
                throw new Error(`Failed to download file: ${fileResponse.status} ${fileResponse.statusText}`);
            }
            const fileBuffer = await fileResponse.arrayBuffer();
            const buffer = Buffer.from(fileBuffer);
            this.logger.log(`📥 [HEYGEN_UPLOAD] File downloaded successfully`, {
                requestId,
                fileSize: buffer.length,
                fileType,
                timestamp: new Date().toISOString(),
            });
            // Определяем правильный Content-Type для файла
            const contentType = fileType === 'image' ? 'image/jpeg' : 'audio/wav';
            this.logger.log(`📤 [HEYGEN_UPLOAD] Preparing binary data for HeyGen API`, {
                requestId,
                fileSize: buffer.length,
                contentType,
                timestamp: new Date().toISOString(),
            });
            let response;
            try {
                // Используем data-binary подход вместо multipart/form-data
                const uploadUrl = `${HEYGEN_API.uploadUrl}/v1/asset?type=${fileType}`;
                response = await axios_1.default.post(uploadUrl, buffer, {
                    headers: {
                        'X-Api-Key': this.apiKey,
                        'Content-Type': contentType,
                    },
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity,
                    timeout: 30000, // 30 секунд таймаут
                });
                this.logger.log(`📥 [HEYGEN_UPLOAD] Received response from HeyGen API`, {
                    requestId,
                    status: response.status,
                    statusText: response.statusText,
                    timestamp: new Date().toISOString(),
                });
                const data = response.data;
                this.logger.log(`✅ [HEYGEN_UPLOAD] Asset uploaded successfully`, {
                    requestId,
                    responseData: data,
                    timestamp: new Date().toISOString(),
                });
                // Извлекаем asset_key из нового формата ответа
                const assetKey = data.data?.image_key || data.data?.asset_key || data.image_key || data.asset_key;
                if (!assetKey) {
                    this.logger.error(`❌ [HEYGEN_UPLOAD] No asset_key found in response`, {
                        requestId,
                        responseData: data,
                        timestamp: new Date().toISOString(),
                    });
                    throw new Error('No asset_key in response');
                }
                this.logger.log(`✅ [HEYGEN_UPLOAD] Asset key extracted: ${assetKey}`, {
                    requestId,
                    assetKey,
                    timestamp: new Date().toISOString(),
                });
                return { asset_key: assetKey };
            }
            catch (axiosError) {
                if (axiosError.response) {
                    // Сервер ответил с кодом ошибки
                    const errorBody = axiosError.response.data;
                    this.logger.error(`❌ [HEYGEN_UPLOAD] Upload failed`, {
                        requestId,
                        status: axiosError.response.status,
                        statusText: axiosError.response.statusText,
                        errorBody,
                        timestamp: new Date().toISOString(),
                    });
                    throw new Error(`Asset upload failed: ${axiosError.response.status} - ${JSON.stringify(errorBody)}`);
                }
                else {
                    // Ошибка сети или другая ошибка
                    this.logger.error(`❌ [HEYGEN_UPLOAD] Network error`, {
                        requestId,
                        error: axiosError.message,
                        timestamp: new Date().toISOString(),
                    });
                    throw new Error(`Asset upload network error: ${axiosError.message}`);
                }
            }
        }
        catch (error) {
            this.logger.error(`❌ [HEYGEN_UPLOAD] Error uploading asset`, {
                requestId,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                fileUrl: `${fileUrl.substring(0, 100)}...`,
                fileType,
                timestamp: new Date().toISOString(),
            });
            throw error;
        }
    }
    /**
     * Валидирует и подготавливает голосовой файл для клонирования
     *
     * @param audioUrl - URL аудио файла
     * @param fileId - ID файла в Telegram
     * @returns Promise с валидированным URL
     * @throws Error если файл не подходит для клонирования
     */
    async validateAndPrepareAudioFile(audioUrl, fileId) {
        const requestId = `audio_validate_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        try {
            this.logger.log(`[${requestId}] 🎵 Validating audio file`, {
                requestId,
                audioUrl: `${audioUrl.substring(0, 100)}...`,
                fileId,
                timestamp: new Date().toISOString(),
            });
            // Проверяем доступность файла
            const headResponse = await fetch(audioUrl, { method: 'HEAD' });
            if (!headResponse.ok) {
                throw new Error(`Audio file not accessible: ${headResponse.status} ${headResponse.statusText}`);
            }
            const contentLength = headResponse.headers.get('content-length');
            const contentType = headResponse.headers.get('content-type');
            const fileSize = contentLength ? parseInt(contentLength, 10) : 0;
            this.logger.log(`[${requestId}] 📊 Audio file info`, {
                requestId,
                fileSize,
                contentType,
                contentLength,
                timestamp: new Date().toISOString(),
            });
            // Проверяем размер файла (максимум 25MB для HeyGen)
            const maxSize = 25 * 1024 * 1024; // 25MB
            if (fileSize > maxSize) {
                throw new Error(`Audio file too large: ${fileSize} bytes (max: ${maxSize} bytes)`);
            }
            // Проверяем минимальный размер (минимум 1MB для качественного клонирования)
            const minSize = 1024 * 1024; // 1MB
            if (fileSize < minSize) {
                this.logger.warn(`[${requestId}] ⚠️ Audio file may be too small for quality cloning`, {
                    requestId,
                    fileSize,
                    minSize,
                    timestamp: new Date().toISOString(),
                });
            }
            // Проверяем поддерживаемые форматы
            const supportedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/oga'];
            if (contentType && !supportedTypes.some(type => contentType.includes(type))) {
                this.logger.warn(`[${requestId}] ⚠️ Unsupported audio format: ${contentType}`, {
                    requestId,
                    contentType,
                    supportedTypes,
                    timestamp: new Date().toISOString(),
                });
            }
            this.logger.log(`[${requestId}] ✅ Audio file validation passed`, {
                requestId,
                fileSize,
                contentType,
                timestamp: new Date().toISOString(),
            });
            return audioUrl;
        }
        catch (error) {
            this.logger.error(`[${requestId}] ❌ Audio file validation failed`, {
                requestId,
                audioUrl: `${audioUrl.substring(0, 100)}...`,
                fileId,
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString(),
            });
            throw error;
        }
    }
    /**
     * Создает клон голоса из пользовательского аудио
     *
     * @see https://docs.heygen.com/reference/create-voice-cloning
     * @endpoint POST /v1/voice_cloning/create
     * @param audioUrl - URL аудио пользователя
     * @param callbackId - ID для webhook callback
     * @returns Promise с voice_id
     * @throws Error если клонирование не удалось
     */
    async createVoiceClone(audioUrl, callbackId, fileId) {
        const requestId = `voice_clone_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
        try {
            this.logger.log(`[${requestId}] 🎵 Creating Voice Clone from: ${audioUrl}`, {
                requestId,
                audioUrl: `${audioUrl.substring(0, 100)}...`,
                callbackId,
                fileId,
                timestamp: new Date().toISOString(),
            });
            // Валидация входных данных
            if (!audioUrl || audioUrl.trim() === '') {
                throw new Error('Audio URL is required');
            }
            if (!callbackId || callbackId.trim() === '') {
                throw new Error('Callback ID is required');
            }
            // Валидируем и подготавливаем аудио файл
            const validatedAudioUrl = await this.validateAndPrepareAudioFile(audioUrl, fileId || 'unknown');
            const payload = {
                name: `voice_${callbackId}`,
                audio_url: validatedAudioUrl,
                callback_url: `${process.env.WEBHOOK_URL}/heygen/webhook`,
                callback_id: callbackId,
            };
            this.logger.debug(`[${requestId}] 📤 Voice Cloning payload:`, {
                requestId,
                payload: {
                    ...payload,
                    audio_url: `${payload.audio_url.substring(0, 100)}...`,
                },
                timestamp: new Date().toISOString(),
            });
            this.logger.log(`[${requestId}] 📤 Sending request to HeyGen API`, {
                requestId,
                endpoint: `${this.baseUrl}/v1/voice_cloning/create`,
                method: 'POST',
                timestamp: new Date().toISOString(),
            });
            const response = await fetch(`${this.baseUrl}/v1/voice_cloning/create`, {
                method: 'POST',
                headers: {
                    'X-API-KEY': this.apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });
            clearTimeout(timeout);
            this.logger.log(`[${requestId}] 📥 Voice Cloning response received`, {
                requestId,
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                timestamp: new Date().toISOString(),
            });
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`[${requestId}] ❌ Voice Cloning failed`, {
                    requestId,
                    status: response.status,
                    statusText: response.statusText,
                    errorText,
                    audioUrl: `${audioUrl.substring(0, 100)}...`,
                    callbackId,
                    timestamp: new Date().toISOString(),
                });
                throw new Error(`Voice Cloning failed: ${response.status} - ${errorText}`);
            }
            const result = (await response.json());
            this.logger.debug(`[${requestId}] 📋 Voice Cloning response data:`, {
                requestId,
                responseData: result,
                timestamp: new Date().toISOString(),
            });
            // Проверяем различные возможные форматы ответа
            const voiceId = result.data?.voice_id || result.voice_id || result.data?.id || result.id;
            if (!voiceId) {
                this.logger.error(`[${requestId}] ❌ No voice_id found in response`, {
                    requestId,
                    responseData: result,
                    possibleFields: ['data.voice_id', 'voice_id', 'data.id', 'id'],
                    timestamp: new Date().toISOString(),
                });
                throw new Error('No voice_id returned from Voice Cloning API');
            }
            this.logger.log(`[${requestId}] ✅ Voice Clone created successfully`, {
                requestId,
                voiceId,
                audioUrl: `${audioUrl.substring(0, 100)}...`,
                callbackId,
                timestamp: new Date().toISOString(),
            });
            return voiceId;
        }
        catch (error) {
            clearTimeout(timeout);
            // Детальная обработка различных типов ошибок
            if (error.name === 'AbortError') {
                this.logger.error(`[${requestId}] ⏰ Voice Cloning timeout after 30 seconds`, {
                    requestId,
                    audioUrl: `${audioUrl.substring(0, 100)}...`,
                    callbackId,
                    timestamp: new Date().toISOString(),
                });
                throw new Error('Voice Cloning request timed out after 30 seconds');
            }
            if (error instanceof TypeError && error.message.includes('fetch')) {
                this.logger.error(`[${requestId}] 🌐 Network error during Voice Cloning`, {
                    requestId,
                    error: error.message,
                    audioUrl: `${audioUrl.substring(0, 100)}...`,
                    callbackId,
                    timestamp: new Date().toISOString(),
                });
                throw new Error(`Network error during Voice Cloning: ${error.message}`);
            }
            this.logger.error(`[${requestId}] ❌ Error creating Voice Clone`, {
                requestId,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                audioUrl: `${audioUrl.substring(0, 100)}...`,
                callbackId,
                timestamp: new Date().toISOString(),
            });
            throw error;
        }
    }
    /**
     * Генерирует видео с цифровым двойником используя Standard Avatar API
     * Обязательно использует клонированный голос из ElevenLabs
     *
     * @see https://docs.heygen.com/reference/create-an-avatar-video-v2
     * @endpoint POST /v2/video/generate
     * @param avatarId - ID созданного Photo Avatar (image_key)
     * @param voiceId - ID созданного Voice Clone из ElevenLabs
     * @param script - Текст для озвучивания
     * @param videoTitle - Название видео
     * @param callbackId - ID для webhook callback
     * @param elevenlabsService - ElevenLabsService для генерации аудио (обязательно)
     * @returns Promise с video_id
     * @throws Error если генерация не удалась или отсутствует ElevenLabs сервис
     */
    async generateDigitalTwinVideo(avatarId, voiceId, script, videoTitle, callbackId, elevenlabsService // ElevenLabsService для генерации аудио (обязательно)
    ) {
        const requestId = `digital_twin_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        try {
            this.logger.log(`[${requestId}] 🎬 Generating Digital Twin Video with ElevenLabs voice`);
            this.logger.log(`[${requestId}] Avatar ID: ${avatarId}, ElevenLabs Voice ID: ${voiceId}`);
            this.logger.log(`[${requestId}] Script length: ${script.length} chars`);
            // Проверяем обязательные параметры
            if (!elevenlabsService) {
                throw new Error('ElevenLabs service is required for voice cloning');
            }
            if (!voiceId) {
                throw new Error('Voice ID is required for voice cloning');
            }
            this.logger.log(`[${requestId}] 🎵 Generating audio with ElevenLabs cloned voice: ${voiceId}`);
            // Генерируем аудио с клонированным голосом через ElevenLabs
            const audioBuffer = await elevenlabsService.textToSpeech({
                text: script,
                voice_id: voiceId,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                    style: 0.0,
                    use_speaker_boost: true,
                },
            });
            this.logger.log(`[${requestId}] ✅ Audio generated: ${audioBuffer.length} bytes`);
            // Загружаем аудио в HeyGen как asset
            const audioAssetId = await this.uploadAudio(audioBuffer);
            this.logger.log(`[${requestId}] ✅ Audio uploaded to HeyGen: ${audioAssetId}`);
            // Извлекаем UUID из avatarId (убираем префикс "image/" и суффикс "/original")
            const talkingPhotoId = avatarId.replace(/^image\//, '').replace(/\/original$/, '');
            this.logger.log(`[${requestId}] 🔧 Extracted talking_photo_id: ${talkingPhotoId} from avatarId: ${avatarId}`);
            // Используем правильную структуру для HeyGen v2 API
            const payload = {
                video_inputs: [
                    {
                        character: {
                            type: 'talking_photo',
                            talking_photo_id: talkingPhotoId, // UUID без префиксов
                            scale: 1.0,
                            style: 'normal',
                        },
                        voice: {
                            type: 'audio',
                            audio_asset_id: audioAssetId,
                        },
                        background: {
                            type: 'color',
                            value: '#f6f6fc',
                        },
                    },
                ],
                dimension: {
                    width: 1280,
                    height: 720,
                },
            };
            // Логируем payload для отладки
            this.logger.debug(`[${requestId}] 📤 HeyGen v2 API payload:`, payload);
            // Используем правильный endpoint для TalkingPhoto
            const response = await fetch(`${this.baseUrl}/v2/video/generate`, {
                method: 'POST',
                headers: {
                    'X-API-KEY': this.apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            this.logger.log(`[${requestId}] 📥 Standard Avatar response: ${response.status} ${response.statusText}`);
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`[${requestId}] ❌ Standard Avatar generation failed: ${response.status} - ${errorText}`);
                throw new Error(`Standard Avatar generation failed: ${response.status} - ${errorText}`);
            }
            const result = (await response.json());
            const videoId = result.data?.video_id || result.video_id;
            if (!videoId) {
                this.logger.error(`[${requestId}] ❌ No video_id in response:`, result);
                throw new Error('No video_id returned from Standard Avatar API');
            }
            this.logger.log(`[${requestId}] ✅ Digital Twin Video generation started: ${videoId}`);
            return videoId;
        }
        catch (error) {
            this.logger.error(`[${requestId}] ❌ Error generating Digital Twin Video:`, error);
            throw error;
        }
    }
    /**
     * Настраивает webhook для HeyGen API
     *
     * @see https://docs.heygen.com/reference/webhook-events
     * @endpoint POST /v1/webhook/endpoint.add
     */
    async setupWebhook() {
        const webhookUrl = `${process.env.WEBHOOK_URL}/heygen/webhook`;
        try {
            this.logger.log(`🔗 Setting up HeyGen webhook: ${webhookUrl}`);
            const response = await fetch(`${this.baseUrl}/v1/webhook/endpoint.add`, {
                method: 'POST',
                headers: {
                    'X-API-KEY': this.apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: webhookUrl,
                    events: [
                        'photo_avatar.success',
                        'photo_avatar.failed',
                        'voice_clone.success',
                        'voice_clone.failed',
                        'video.success',
                        'video.failed',
                    ],
                }),
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
