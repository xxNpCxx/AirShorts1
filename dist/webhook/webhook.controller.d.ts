import { Response } from 'express';
import { CustomLoggerService } from '../logger/logger.service';
import { Telegraf } from 'telegraf';
export declare class WebhookController {
    private readonly logger;
    private readonly bot;
    constructor(logger: CustomLoggerService, bot: Telegraf);
    handleWebhook(update: any, res: Response): Promise<void>;
}
//# sourceMappingURL=webhook.controller.d.ts.map