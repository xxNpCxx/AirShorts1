import { UsersService } from "../users/users.service";
import { MenuService } from "../menu/menu.service";
import { CustomLoggerService } from "../logger/logger.service";
interface TelegramContext {
    from?: {
        id: number;
        username?: string;
        first_name?: string;
        last_name?: string;
    };
    message?: {
        text?: string;
    };
    reply: (_text: string, _options?: {
        parse_mode?: string;
        reply_markup?: unknown;
    }) => Promise<void>;
    answerCbQuery: () => Promise<void>;
}
export declare class BotUpdate {
    private readonly _users;
    private readonly _menu;
    private readonly _logger;
    constructor(_users: UsersService, _menu: MenuService, _logger: CustomLoggerService);
    onMessage(ctx: TelegramContext): Promise<void>;
    onStart(ctx: TelegramContext): Promise<void>;
    onStartHears(ctx: TelegramContext): Promise<void>;
    onText(ctx: TelegramContext): Promise<void>;
    onMainMenu(ctx: TelegramContext): Promise<void>;
    onMainMenuAction(ctx: TelegramContext): Promise<void>;
    onMyId(ctx: TelegramContext): Promise<void>;
    onMyIdHears(ctx: TelegramContext): Promise<void>;
    onCreateVideo(ctx: TelegramContext): Promise<void>;
}
export {};
//# sourceMappingURL=bot.update.d.ts.map