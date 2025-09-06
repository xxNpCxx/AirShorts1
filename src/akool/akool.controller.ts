import { Controller, Get, Param, Post, Body } from "@nestjs/common";
import {
  AkoolService,
  AkoolVideoRequest,
  AkoolVideoResponse,
} from "./akool.service";

@Controller("akool")
export class AkoolController {
  constructor(private readonly akoolService: AkoolService) {}

  @Post("generate")
  async generateVideo(request: AkoolVideoRequest): Promise<AkoolVideoResponse> {
    return this.akoolService.createDigitalTwin(request);
  }

  @Get("status/:id")
  async getVideoStatus(id: string): Promise<AkoolVideoResponse> {
    return this.akoolService.getVideoStatus(id);
  }
}
