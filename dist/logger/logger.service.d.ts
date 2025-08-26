import { LoggerService } from "@nestjs/common";
interface TelegramUpdate {
    message?: {
        from?: {
            id?: string | number;
            username?: string;
        };
        text?: string;
    };
    callback_query?: {
        from?: {
            id?: string | number;
            username?: string;
        };
        data?: string;
    };
    inline_query?: {
        from?: {
            id?: string | number;
            username?: string;
        };
    };
    chosen_inline_result?: {
        from?: {
            id?: string | number;
            username?: string;
        };
    };
    edited_message?: {
        from?: {
            id?: string | number;
            username?: string;
        };
        text?: string;
    };
    edited_channel_post?: {
        from?: {
            id?: string | number;
            username?: string;
        };
        text?: string;
    };
    channel_post?: {
        from?: {
            id?: string | number;
            username?: string;
        };
        text?: string;
    };
    shipping_query?: {
        from?: {
            id?: string | number;
            username?: string;
        };
    };
    pre_checkout_query?: {
        from?: {
            id?: string | number;
            username?: string;
        };
    };
    poll?: {
        from?: {
            id?: string | number;
            username?: string;
        };
    };
    poll_answer?: {
        user?: {
            id?: string | number;
            username?: string;
        };
    };
    my_chat_member?: {
        from?: {
            id?: string | number;
            username?: string;
        };
    };
    chat_member?: {
        from?: {
            id?: string | number;
            username?: string;
        };
    };
    chat_join_request?: {
        from?: {
            id?: string | number;
            username?: string;
        };
    };
}
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
    telegramUpdate(update: TelegramUpdate, context?: string): void;
    private getUpdateType;
    private getUserId;
    private getUsername;
    private getText;
    private getCallbackData;
}
export {};
//# sourceMappingURL=logger.service.d.ts.map