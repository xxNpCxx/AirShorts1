import { UsersService } from '../users/users.service';
import { MenuService } from '../menu/menu.service';
import { SettingsService } from '../settings/settings.service';
export declare class BotUpdate {
    private readonly _users;
    private readonly _menu;
    private readonly _settings;
    constructor(_users: UsersService, _menu: MenuService, _settings: SettingsService);
    onStart(ctx: any): Promise<void>;
    onMainMenu(ctx: any): Promise<void>;
    onMainMenuAction(ctx: any): Promise<void>;
    onMyId(ctx: any): Promise<void>;
    onMyIdHears(ctx: any): Promise<void>;
    onCreateVideo(ctx: any): Promise<void>;
}
//# sourceMappingURL=bot.update.d.ts.map