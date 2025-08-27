import { KeyboardsService } from "../keyboards/keyboards.service";
import { CustomLoggerService } from "../logger/logger.service";
import { Context } from "telegraf";
type TelegramContext = Context;
export declare class MenuService {
    private readonly _kb;
    private readonly _logger;
    constructor(_kb: KeyboardsService, _logger: CustomLoggerService);
    sendMainMenu(ctx: TelegramContext): Promise<void>;
    sendMainMenuBanner(ctx: TelegramContext): Promise<void>;
    private sendReplyKeyboard;
}
export {};
//# sourceMappingURL=menu.service.d.ts.map