import { Module } from '@nestjs/common';
import { MenuService } from './menu.service';
import { KeyboardsModule } from '../keyboards/keyboards.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [KeyboardsModule, SettingsModule],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}
