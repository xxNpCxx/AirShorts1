import { Module } from "@nestjs/common";
import { KeyboardsService } from "./keyboards.service";
import { SettingsModule } from "../settings/settings.module";

@Module({
  imports: [SettingsModule],
  providers: [KeyboardsService],
  exports: [KeyboardsService],
})
export class KeyboardsModule {}
