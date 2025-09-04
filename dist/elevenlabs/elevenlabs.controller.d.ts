import { ElevenLabsService, VoiceCloneRequest, VoiceCloneResponse, TextToSpeechRequest } from "./elevenlabs.service";
export declare class ElevenLabsController {
    private readonly elevenLabsService;
    constructor(elevenLabsService: ElevenLabsService);
    cloneVoice(request: VoiceCloneRequest): Promise<VoiceCloneResponse>;
    textToSpeech(request: TextToSpeechRequest): Promise<Buffer>;
    getVoices(): Promise<import("./elevenlabs.service").ElevenLabsVoiceResponse[]>;
    deleteVoice(id: string): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=elevenlabs.controller.d.ts.map