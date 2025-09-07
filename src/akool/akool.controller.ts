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
  async getVideoStatus(@Param('id') id: string): Promise<any> {
    try {
      const result = await this.akoolService.getVideoStatus(id);
      return {
        message: "Статус видео получен успешно",
        status: "success",
        data: result
      };
    } catch (error) {
      return {
        message: `Ошибка получения статуса: ${error.message}`,
        status: "error",
        error: error.message
      };
    }
  }
}
