import { Module } from "@nestjs/common";
import { HeyGenController } from "./heygen.controller";
import { HeyGenService } from "./heygen.service";
import { HeyGenWebhookController } from "./heygen-webhook.controller";
import { ProcessManagerService } from "./process-manager.service";
import { TelegrafModule } from "nestjs-telegraf";

@Module({
  imports: [TelegrafModule],
  controllers: [HeyGenController, HeyGenWebhookController],
  providers: [HeyGenService, ProcessManagerService],
  exports: [HeyGenService, ProcessManagerService],
})
export class HeyGenModule {}
