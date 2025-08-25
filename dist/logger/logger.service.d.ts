import { LoggerService } from '@nestjs/common';
export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    LOG = "log",
    DEBUG = "debug",
    VERBOSE = "verbose"
}
export declare class CustomLoggerService implements LoggerService {
    private readonly isDebugMode;
    private readonly isVerboseMode;
    constructor();
    private formatMessage;
    private shouldLog;
    log(message: string, context?: string): void;
    error(message: string, trace?: string, context?: string): void;
    warn(message: string, context?: string): void;
    debug(message: string, context?: string): void;
    verbose(message: string, context?: string): void;
    telegramUpdate(update: any, context?: string): void;
    private getUpdateType;
    private getUserId;
    private getUsername;
    private getText;
    private getCallbackData;
}
//# sourceMappingURL=logger.service.d.ts.map