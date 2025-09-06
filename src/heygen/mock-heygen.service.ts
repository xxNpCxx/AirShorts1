import { Injectable, Logger } from '@nestjs/common';

/**
 * Mock HeyGen Service
 * Temporary implementation to allow application to start
 * while heygen module compilation issues are resolved
 */
@Injectable()
export class MockHeyGenService {
  private readonly logger = new Logger(MockHeyGenService.name);

  async generateVideo(request: any): Promise<any> {
    this.logger.warn('MockHeyGenService.generateVideo called - heygen module is temporarily disabled');
    return {
      success: false,
      error: 'HeyGen service is temporarily unavailable due to compilation issues'
    };
  }

  async getVideoStatus(id: string): Promise<any> {
    this.logger.warn('MockHeyGenService.getVideoStatus called - heygen module is temporarily disabled');
    return {
      success: false,
      error: 'HeyGen service is temporarily unavailable due to compilation issues'
    };
  }
}

/**
 * Mock Process Manager Service
 * Temporary implementation to allow application to start
 * while heygen module compilation issues are resolved
 */
@Injectable()
export class MockProcessManagerService {
  private readonly logger = new Logger(MockProcessManagerService.name);

  async createDigitalTwinProcess(
    userId: number,
    photoUrl: string,
    audioUrl: string,
    script: string,
    title: string,
    quality: string
  ): Promise<any> {
    this.logger.warn('MockProcessManagerService.createDigitalTwinProcess called - heygen module is temporarily disabled');
    return {
      id: `mock_process_${Date.now()}`,
      userId,
      photoUrl,
      audioUrl,
      script,
      title,
      quality,
      status: 'mock_created'
    };
  }

  async updateProcessStatus(processId: string, status: string, data?: any): Promise<void> {
    this.logger.warn('MockProcessManagerService.updateProcessStatus called - heygen module is temporarily disabled');
  }

  async executeNextStep(processId: string): Promise<void> {
    this.logger.warn('MockProcessManagerService.executeNextStep called - heygen module is temporarily disabled');
  }

  async getProcess(processId: string): Promise<any> {
    this.logger.warn('MockProcessManagerService.getProcess called - heygen module is temporarily disabled');
    return null;
  }
}
