import { Module } from "@nestjs/common";
import { HeyGenController } from "./heygen.controller";
import { HeyGenService } from "./heygen.service";
import { HeyGenWebhookController } from "./heygen-webhook.controller";
import { ProcessManagerService } from "./process-manager.service";
import { TelegrafModule } from "nestjs-telegraf";
import { ElevenLabsModule } from "../elevenlabs/elevenlabs.module";

@Module({
  imports: [TelegrafModule, ElevenLabsModule],
  controllers: [HeyGenController, HeyGenWebhookController],
  providers: [HeyGenService, ProcessManagerService],
  exports: [HeyGenService, ProcessManagerService],
})
export class HeyGenModule {}
