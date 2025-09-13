import { Module } from '@nestjs/common';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [LoggerModule],
  exports: [],
})
export class MiddlewareModule {}
