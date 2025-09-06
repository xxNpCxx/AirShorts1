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
var ElevenLabsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElevenLabsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let ElevenLabsService = ElevenLabsService_1 = class ElevenLabsService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(ElevenLabsService_1.name);
        this.baseUrl = "https://api.elevenlabs.io/v1";
        this.apiKey = this.configService.get("ELEVENLABS_API_KEY") || "";
        if (!this.apiKey) {
            this.logger.warn("ELEVENLABS_API_KEY не найден в переменных окружения");
        }
    }
    /**
     * Создает клон голоса из аудиофайла (асинхронно через fine-tuning)
     */
    async cloneVoiceAsync(request) {
        const cloneId = `clone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        try {
            this.logger.log(`[${cloneId}] 🎤 Starting voice fine-tuning with ElevenLabs`);
            this.logger.debug(`[${cloneId}] Voice name: ${request.name}, Audio size: ${request.audioBuffer.length} bytes`);
            // Сначала создаем базовый голос
            const formData = new FormData();
            formData.append("name", request.name);
            formData.append("description", request.description || "Клонированный голос пользователя");
            formData.append("files", new Blob([request.audioBuffer], { type: "audio/wav" }), "voice_sample.wav");
            // Добавляем метки для fine-tuning
            formData.append("labels", JSON.stringify({
                "accent": "russian",
                "age": "young_adult",
                "gender": "neutral",
                "use_case": "conversational"
            }));
            const response = await fetch(`${this.baseUrl}/voices/add`, {
                method: "POST",
                headers: {
                    "xi-api-key": this.apiKey,
                },
                body: formData,
            });
            this.logger.debug(`[${cloneId}] 📥 Voice creation response: ${response.status} ${response.statusText}`);
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`[${cloneId}] ❌ Failed to create voice:`, {
                    status: response.status,
                    statusText: response.statusText,
                    url: `${this.baseUrl}/voices/add`,
                    audioSize: request.audioBuffer.length,
                    errorBody: errorText
                });
                // Если instant cloning недоступен, пробуем fine-tuning
                if (errorText.includes("can_not_use_instant_voice_cloning")) {
                    this.logger.warn(`[${cloneId}] Instant cloning недоступен, используем fine-tuning`);
                    return await this.createVoiceWithFineTuning(request, cloneId);
                }
                throw new Error(`Failed to create voice: ${response.status} - ${errorText}`);
            }
            const result = await response.json();
            this.logger.log(`[${cloneId}] ✅ Voice created successfully with ID: ${result.voice_id}`);
            this.logger.debug(`[${cloneId}] Full response:`, result);
            return {
                voice_id: result.voice_id,
                name: result.name,
                status: "processing",
                message: "Клонирование голоса запущено. Вы получите уведомление, когда оно будет готово."
            };
        }
        catch (error) {
            this.logger.error(`[${cloneId}] 💥 Critical error creating voice:`, {
                error: error instanceof Error ? error.message : String(error),
                audioSize: request.audioBuffer.length,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }
    /**
     * Создает голос через fine-tuning (для бесплатных аккаунтов)
     */
    async createVoiceWithFineTuning(request, cloneId) {
        try {
            this.logger.log(`[${cloneId}] 🔧 Using fine-tuning approach for voice creation`);
            // Создаем голос без instant cloning
            const formData = new FormData();
            formData.append("name", request.name);
            formData.append("description", request.description || "Клонированный голос пользователя (fine-tuning)");
            formData.append("files", new Blob([request.audioBuffer], { type: "audio/wav" }), "voice_sample.wav");
            const response = await fetch(`${this.baseUrl}/voices/add`, {
                method: "POST",
                headers: {
                    "xi-api-key": this.apiKey,
                },
                body: formData,
            });
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`[${cloneId}] ❌ Fine-tuning also failed:`, errorText);
                throw new Error(`Fine-tuning failed: ${response.status} - ${errorText}`);
            }
            const result = await response.json();
            this.logger.log(`[${cloneId}] ✅ Voice created via fine-tuning with ID: ${result.voice_id}`);
            return {
                voice_id: result.voice_id,
                name: result.name,
                status: "processing",
                message: "Клонирование голоса запущено через fine-tuning. Это может занять больше времени."
            };
        }
        catch (error) {
            this.logger.error(`[${cloneId}] 💥 Fine-tuning error:`, error);
            throw error;
        }
    }
    /**
     * Создает клон голоса из аудиофайла (синхронно - для обратной совместимости)
     */
    async cloneVoice(request) {
        const cloneId = `clone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        try {
            this.logger.log(`[${cloneId}] 🎤 Starting voice cloning with ElevenLabs`);
            this.logger.debug(`[${cloneId}] Voice name: ${request.name}, Audio size: ${request.audioBuffer.length} bytes`);
            const formData = new FormData();
            formData.append("name", request.name);
            formData.append("description", request.description || "Клонированный голос пользователя");
            formData.append("files", new Blob([request.audioBuffer], { type: "audio/wav" }), "voice_sample.wav");
            const response = await fetch(`${this.baseUrl}/voices/add`, {
                method: "POST",
                headers: {
                    "xi-api-key": this.apiKey,
                },
                body: formData,
            });
            this.logger.debug(`[${cloneId}] 📥 Voice cloning response: ${response.status} ${response.statusText}`);
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`[${cloneId}] ❌ Failed to clone voice:`, {
                    status: response.status,
                    statusText: response.statusText,
                    url: `${this.baseUrl}/voices/add`,
                    audioSize: request.audioBuffer.length,
                    errorBody: errorText
                });
                throw new Error(`Failed to clone voice: ${response.status} - ${errorText}`);
            }
            const result = await response.json();
            this.logger.log(`[${cloneId}] ✅ Voice cloned successfully with ID: ${result.voice_id}`);
            this.logger.debug(`[${cloneId}] Full response:`, result);
            return {
                voice_id: result.voice_id,
                name: result.name,
                status: "created",
            };
        }
        catch (error) {
            this.logger.error(`[${cloneId}] 💥 Critical error cloning voice:`, {
                error: error instanceof Error ? error.message : String(error),
                audioSize: request.audioBuffer.length,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }
    /**
     * Генерирует речь с использованием клонированного голоса
     */
    async textToSpeech(request) {
        const ttsId = `tts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        try {
            this.logger.log(`[${ttsId}] 🗣️ Starting text-to-speech with voice: ${request.voice_id}`);
            this.logger.debug(`[${ttsId}] Text length: ${request.text.length} characters`);
            const payload = {
                text: request.text,
                model_id: request.model_id || "eleven_multilingual_v2",
                voice_settings: request.voice_settings || {
                    stability: 0.5,
                    similarity_boost: 0.75,
                    style: 0.0,
                    use_speaker_boost: true
                }
            };
            const response = await fetch(`${this.baseUrl}/text-to-speech/${request.voice_id}`, {
                method: "POST",
                headers: {
                    "xi-api-key": this.apiKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            this.logger.debug(`[${ttsId}] 📥 TTS response: ${response.status} ${response.statusText}`);
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`[${ttsId}] ❌ Failed to generate speech:`, {
                    status: response.status,
                    statusText: response.statusText,
                    url: `${this.baseUrl}/text-to-speech/${request.voice_id}`,
                    textLength: request.text.length,
                    errorBody: errorText
                });
                throw new Error(`Failed to generate speech: ${response.status} - ${errorText}`);
            }
            const audioBuffer = Buffer.from(await response.arrayBuffer());
            this.logger.log(`[${ttsId}] ✅ Speech generated successfully: ${audioBuffer.length} bytes`);
            return audioBuffer;
        }
        catch (error) {
            this.logger.error(`[${ttsId}] 💥 Critical error generating speech:`, {
                error: error instanceof Error ? error.message : String(error),
                textLength: request.text.length,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }
    /**
     * Получает список всех голосов пользователя
     */
    async getVoices() {
        try {
            this.logger.debug("📋 Fetching user voices from ElevenLabs");
            const response = await fetch(`${this.baseUrl}/voices`, {
                headers: {
                    "xi-api-key": this.apiKey,
                },
            });
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error("❌ Failed to fetch voices:", {
                    status: response.status,
                    statusText: response.statusText,
                    errorBody: errorText
                });
                throw new Error(`Failed to fetch voices: ${response.status} - ${errorText}`);
            }
            const result = await response.json();
            this.logger.log(`✅ Retrieved ${result.voices?.length || 0} voices`);
            return result.voices || [];
        }
        catch (error) {
            this.logger.error("💥 Critical error fetching voices:", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }
    /**
     * Проверяет статус клонирования голоса
     */
    async getVoiceStatus(voiceId) {
        try {
            this.logger.debug(`🔍 Checking voice status: ${voiceId}`);
            const response = await fetch(`${this.baseUrl}/voices/${voiceId}`, {
                headers: {
                    "xi-api-key": this.apiKey,
                },
            });
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`❌ Failed to get voice status for ${voiceId}:`, {
                    status: response.status,
                    statusText: response.statusText,
                    errorBody: errorText
                });
                return { status: "error", ready: false, error: errorText };
            }
            const result = await response.json();
            // Проверяем статус клонирования
            const isReady = result.fine_tuning?.finetuning_state === "completed" ||
                result.fine_tuning?.finetuning_state === "ready";
            this.logger.debug(`📊 Voice ${voiceId} status:`, {
                finetuning_state: result.fine_tuning?.finetuning_state,
                isReady,
                hasSamples: result.samples?.length > 0
            });
            return {
                status: result.fine_tuning?.finetuning_state || "unknown",
                ready: isReady,
                error: result.fine_tuning?.verification_failures?.join(", ")
            };
        }
        catch (error) {
            this.logger.error(`💥 Critical error getting voice status for ${voiceId}:`, {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            return { status: "error", ready: false, error: error instanceof Error ? error.message : String(error) };
        }
    }
    /**
     * Удаляет клонированный голос
     */
    async deleteVoice(voiceId) {
        try {
            this.logger.log(`🗑️ Deleting voice: ${voiceId}`);
            const response = await fetch(`${this.baseUrl}/voices/${voiceId}`, {
                method: "DELETE",
                headers: {
                    "xi-api-key": this.apiKey,
                },
            });
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`❌ Failed to delete voice ${voiceId}:`, {
                    status: response.status,
                    statusText: response.statusText,
                    errorBody: errorText
                });
                return false;
            }
            this.logger.log(`✅ Voice ${voiceId} deleted successfully`);
            return true;
        }
        catch (error) {
            this.logger.error(`💥 Critical error deleting voice ${voiceId}:`, {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            return false;
        }
    }
};
exports.ElevenLabsService = ElevenLabsService;
exports.ElevenLabsService = ElevenLabsService = ElevenLabsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ElevenLabsService);
