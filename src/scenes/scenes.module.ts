import { Module } from "@nestjs/common";
import { VideoGenerationScene } from "./video-generation.scene";

@Module({
  imports: [],
  providers: [VideoGenerationScene],
  exports: [VideoGenerationScene],
})
export class ScenesModule {}
