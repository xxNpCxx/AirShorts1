import { Module } from '@nestjs/common';
import { TestFilesController } from './test-files.controller';

@Module({
  controllers: [TestFilesController],
})
export class TestFilesModule {}
