import { Controller, Get, Param, Post, Body } from "@nestjs/common";
import {
  HeyGenService,
  HeyGenVideoRequest,
  HeyGenVideoResponse,
} from "./heygen.service";

@Controller("heygen")
export class HeyGenController {
  constructor(private readonly heygenService: HeyGenService) {}

  @Post("generate")
  async generateVideo(request: HeyGenVideoRequest): Promise<HeyGenVideoResponse> {
    return this.heygenService.generateVideo(request);
  }

  @Get("status/:id")
  async getVideoStatus(id: string): Promise<HeyGenVideoResponse> {
    return this.heygenService.getVideoStatus(id);
  }
}
