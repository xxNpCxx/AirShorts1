import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { DidService, VideoGenerationRequest, VideoGenerationResponse } from './did.service';

@Controller('did')
export class DidController {
  constructor(private readonly didService: DidService) {}

  @Post('generate')
  async generateVideo(@Body() request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    return this.didService.generateVideo(request);
  }

  @Get('status/:id')
  async getVideoStatus(@Param('id') id: string): Promise<VideoGenerationResponse> {
    return this.didService.getVideoStatus(id);
  }
}
