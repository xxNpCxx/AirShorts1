import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { AkoolService, AkoolVideoRequest, AkoolVideoResponse } from './akool.service';
import { Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import {
  AkoolVideoStatusResponse,
  AkoolWebhookLogsResponse,
  AkoolWebhookLog,
  AKOOL_CONTROLLER_MESSAGES,
} from '../types';

@Controller('akool')
export class AkoolController {
  constructor(
    private readonly akoolService: AkoolService,
    @Inject(PG_POOL) private readonly pool: Pool
  ) {}

  @Post('generate')
  async generateVideo(request: AkoolVideoRequest): Promise<AkoolVideoResponse> {
    return this.akoolService.createDigitalTwin(request);
  }

  @Get('status/:id')
  async getVideoStatus(@Param('id') id: string): Promise<AkoolVideoStatusResponse> {
    try {
      const result = await this.akoolService.getVideoStatus(id);
      return {
        message: AKOOL_CONTROLLER_MESSAGES.VIDEO_STATUS_SUCCESS,
        status: 'success',
        data: result,
      };
    } catch (error) {
      return {
        message: `${AKOOL_CONTROLLER_MESSAGES.VIDEO_STATUS_ERROR}: ${error.message}`,
        status: 'error',
        error: error.message,
      };
    }
  }

  @Get('webhooks')
  async getWebhookLogs(): Promise<AkoolWebhookLogsResponse> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM webhook_logs 
         WHERE service = 'akool' 
         ORDER BY created_at DESC 
         LIMIT 10`
      );

      return {
        message: AKOOL_CONTROLLER_MESSAGES.WEBHOOK_LOGS_SUCCESS,
        status: 'success',
        count: result.rows.length,
        data: result.rows as AkoolWebhookLog[],
      };
    } catch (error) {
      return {
        message: `${AKOOL_CONTROLLER_MESSAGES.WEBHOOK_LOGS_ERROR}: ${error.message}`,
        status: 'error',
        error: error.message,
      };
    }
  }
}
