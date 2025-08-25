import { Module } from '@nestjs/common';
import { VideoGenerationScene } from './video-generation.scene';
import { DidModule } from '../d-id/did.module';

@Module({
  imports: [DidModule],
  providers: [VideoGenerationScene],
  exports: [VideoGenerationScene],
})
export class ScenesModule {}
