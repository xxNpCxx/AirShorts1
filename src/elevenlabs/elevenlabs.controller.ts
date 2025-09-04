import { Controller, Get, Post, Delete, Param, Body } from "@nestjs/common";
import {
  ElevenLabsService,
  VoiceCloneRequest,
  VoiceCloneResponse,
  TextToSpeechRequest,
} from "./elevenlabs.service";

@Controller("elevenlabs")
export class ElevenLabsController {
  constructor(private readonly elevenLabsService: ElevenLabsService) {}

  @Post("clone-voice")
  async cloneVoice(@Body() request: VoiceCloneRequest): Promise<VoiceCloneResponse> {
    return this.elevenLabsService.cloneVoice(request);
  }

  @Post("text-to-speech")
  async textToSpeech(@Body() request: TextToSpeechRequest): Promise<Buffer> {
    return this.elevenLabsService.textToSpeech(request);
  }

  @Get("voices")
  async getVoices() {
    return this.elevenLabsService.getVoices();
  }

  @Delete("voices/:id")
  async deleteVoice(@Param("id") id: string): Promise<{ success: boolean }> {
    const success = await this.elevenLabsService.deleteVoice(id);
    return { success };
  }
}
