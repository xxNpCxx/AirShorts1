import { KeyboardsService } from '../keyboards/keyboards.service';
import { SettingsService } from '../settings/settings.service';
import { CustomLoggerService } from '../logger/logger.service';
interface TelegramContext {
    from?: {
        id: number;
    };
    reply: (text: string, options?: {
        reply_markup?: unknown;
    }) => Promise<void>;
    telegram?: {
        sendPhoto: (chatId: number, photo: any, options?: any) => Promise<any>;
    };
}
export declare class MenuService {
    private readonly _kb;
    private readonly _settings;
    private readonly _logger;
    constructor(_kb: KeyboardsService, _settings: SettingsService, _logger: CustomLoggerService);
    sendMainMenu(ctx: TelegramContext): Promise<void>;
    sendMainMenuBanner(ctx: TelegramContext, isOperator: boolean, isAdmin: boolean): Promise<void>;
    private sendReplyKeyboard;
}
export {};
//# sourceMappingURL=menu.service.d.ts.map