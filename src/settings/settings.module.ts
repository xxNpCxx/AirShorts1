import { Module, Logger } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { SettingsService } from "./settings.service";

@Module({
  imports: [DatabaseModule],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {
  private readonly logger = new Logger(SettingsModule.name);

  constructor() {
    this.logger.log("[SettingsModule] Инициализация модуля настроек");
  }
}
