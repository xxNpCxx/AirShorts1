import { Request, Response } from "express";
import { CustomLoggerService } from "../logger/logger.service";
export declare class WebhookController {
    private readonly _logger;
    private bot;
    constructor(_logger: CustomLoggerService);
    getWebhook(req: Request, res: Response): Promise<void>;
    handleWebhook(req: Request, res: Response, headers: Record<string, string | string[] | undefined>): Promise<void>;
    private getUpdateType;
    healthCheck(res: Response): Promise<void>;
    getStatus(res: Response): Promise<void>;
}
//# sourceMappingURL=webhook.controller.d.ts.map