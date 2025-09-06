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
  async getVideoStatus(@Param('id') id: string): Promise<{ message: string; status: string }> {
    return {
      message: "AKOOL использует webhook для уведомлений о готовности видео. Проверьте логи приложения или дождитесь уведомления в Telegram.",
      status: "webhook-based"
    };
  }
}
