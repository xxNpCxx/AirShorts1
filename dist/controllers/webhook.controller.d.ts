import { Response } from 'express';
import { CustomLoggerService } from '../logger/logger.service';
export declare class WebhookController {
    private readonly bot;
    private readonly logger;
    constructor(logger: CustomLoggerService);
    handleWebhook(update: any, res: Response): Promise<void>;
}
//# sourceMappingURL=webhook.controller.d.ts.map