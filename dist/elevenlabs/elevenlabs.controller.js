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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElevenLabsController = void 0;
const common_1 = require("@nestjs/common");
const elevenlabs_service_1 = require("./elevenlabs.service");
let ElevenLabsController = class ElevenLabsController {
    constructor(elevenLabsService) {
        this.elevenLabsService = elevenLabsService;
    }
    async cloneVoice(request) {
        return this.elevenLabsService.cloneVoice(request);
    }
    async textToSpeech(request) {
        return this.elevenLabsService.textToSpeech(request);
    }
    async getVoices() {
        return this.elevenLabsService.getVoices();
    }
    async deleteVoice(id) {
        const success = await this.elevenLabsService.deleteVoice(id);
        return { success };
    }
};
exports.ElevenLabsController = ElevenLabsController;
__decorate([
    (0, common_1.Post)("clone-voice"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ElevenLabsController.prototype, "cloneVoice", null);
__decorate([
    (0, common_1.Post)("text-to-speech"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ElevenLabsController.prototype, "textToSpeech", null);
__decorate([
    (0, common_1.Get)("voices"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ElevenLabsController.prototype, "getVoices", null);
__decorate([
    (0, common_1.Delete)("voices/:id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ElevenLabsController.prototype, "deleteVoice", null);
exports.ElevenLabsController = ElevenLabsController = __decorate([
    (0, common_1.Controller)("elevenlabs"),
    __metadata("design:paramtypes", [elevenlabs_service_1.ElevenLabsService])
], ElevenLabsController);
