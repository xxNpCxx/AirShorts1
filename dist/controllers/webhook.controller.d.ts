import { Request, Response } from 'express';
import { CustomLoggerService } from '../logger/logger.service';
export declare class WebhookController {
    private readonly logger;
    constructor(logger: CustomLoggerService);
    getWebhook(req: Request, res: Response): Promise<void>;
    handleWebhook(req: Request, res: Response, headers: any): Promise<void>;
    private getUpdateType;
    healthCheck(res: Response): Promise<void>;
    getStatus(res: Response): Promise<void>;
}
//# sourceMappingURL=webhook.controller.d.ts.map