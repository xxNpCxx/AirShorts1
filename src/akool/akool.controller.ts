import { Controller, Get, Param, Post, Body } from "@nestjs/common";
import {
  AkoolService,
  AkoolVideoRequest,
  AkoolVideoResponse,
} from "./akool.service";
import { Inject } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "../database/database.module";

@Controller("akool")
export class AkoolController {
  constructor(
    private readonly akoolService: AkoolService,
    @Inject(PG_POOL) private readonly pool: Pool,
  ) {}

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

  @Get("webhooks")
  async getWebhookLogs(): Promise<any> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM webhook_logs 
         WHERE service = 'akool' 
         ORDER BY created_at DESC 
         LIMIT 10`
      );
      
      return {
        message: "Webhook логи получены успешно",
        status: "success",
        count: result.rows.length,
        data: result.rows
      };
    } catch (error) {
      return {
        message: `Ошибка получения webhook логов: ${error.message}`,
        status: "error",
        error: error.message
      };
    }
  }
}
