import { UsersService } from "../users/users.service";
import { MenuService } from "../menu/menu.service";
import { KeyboardsService } from "../keyboards/keyboards.service";
import { CustomLoggerService } from "../logger/logger.service";
import { Context } from "telegraf";
export declare class BotUpdate {
    private readonly _users;
    private readonly _menu;
    private readonly _kb;
    private readonly _logger;
    constructor(_users: UsersService, _menu: MenuService, _kb: KeyboardsService, _logger: CustomLoggerService);
    onStart(ctx: Context): Promise<void>;
    onText(ctx: Context): Promise<void>;
    onMainMenu(ctx: Context): Promise<void>;
    onMainMenuAction(ctx: Context): Promise<void>;
    onMyId(ctx: Context): Promise<void>;
    onMyIdHears(ctx: Context): Promise<void>;
    onCreateVideo(ctx: Context): Promise<void>;
    onServiceSettings(ctx: Context): Promise<void>;
    onSetServiceDid(ctx: Context): Promise<void>;
    onSetServiceHeyGen(ctx: Context): Promise<void>;
}
//# sourceMappingURL=bot.update.d.ts.map