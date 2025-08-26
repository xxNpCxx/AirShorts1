import { KeyboardsService } from "../keyboards/keyboards.service";
import { CustomLoggerService } from "../logger/logger.service";
type TelegramContext = {
    from?: {
        id: number;
    };
    reply: (text: string, options?: {
        reply_markup?: unknown;
    }) => Promise<void>;
    telegram?: {
        sendPhoto: (chatId: number, photo: string, options?: {
            reply_markup?: unknown;
            caption?: string;
            parse_mode?: string;
        }) => Promise<void>;
    };
};
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