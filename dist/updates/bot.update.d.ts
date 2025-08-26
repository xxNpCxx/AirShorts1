import { UsersService } from '../users/users.service';
import { MenuService } from '../menu/menu.service';
import { SettingsService } from '../settings/settings.service';
import { CustomLoggerService } from '../logger/logger.service';
export declare class BotUpdate {
    private readonly _users;
    private readonly _menu;
    private readonly _settings;
    private readonly _logger;
    constructor(_users: UsersService, _menu: MenuService, _settings: SettingsService, _logger: CustomLoggerService);
    onMessage(ctx: any): Promise<void>;
    onStart(ctx: any): Promise<void>;
    onStartHears(ctx: any): Promise<void>;
    onText(ctx: any): Promise<void>;
    onMainMenu(ctx: any): Promise<void>;
    onMainMenuAction(ctx: any): Promise<void>;
    onMyId(ctx: any): Promise<void>;
    onMyIdHears(ctx: any): Promise<void>;
    onCreateVideo(ctx: any): Promise<void>;
}
//# sourceMappingURL=bot.update.d.ts.map