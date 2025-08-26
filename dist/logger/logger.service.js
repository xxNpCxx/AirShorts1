"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomLoggerService = exports.LogLevel = void 0;
const common_1 = require("@nestjs/common");
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["LOG"] = "log";
    LogLevel["DEBUG"] = "debug";
    LogLevel["VERBOSE"] = "verbose";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
let CustomLoggerService = class CustomLoggerService {
    constructor() {
        this.isDebugMode =
            process.env.DEBUG === "true" || process.env.DEBUG === "1";
        this.isVerboseMode =
            process.env.DEBUG === "verbose" || process.env.DEBUG === "2";
    }
    formatMessage(level, message, context) {
        const timestamp = new Date().toISOString();
        const contextStr = context ? `[${context}]` : "";
        const levelStr = `[${level.toUpperCase()}]`;
        return `${timestamp} ${levelStr} ${contextStr} ${message}`;
    }
    shouldLog(level) {
        if (this.isVerboseMode)
            return true;
        if (this.isDebugMode && level !== LogLevel.VERBOSE)
            return true;
        if (!this.isDebugMode &&
            [LogLevel.LOG, LogLevel.WARN, LogLevel.ERROR].includes(level))
            return true;
        return false;
    }
    log(message, context) {
        if (this.shouldLog(LogLevel.LOG)) {
            console.log(this.formatMessage(LogLevel.LOG, message, context));
        }
    }
    error(message, trace, context) {
        if (this.shouldLog(LogLevel.ERROR)) {
            console.error(this.formatMessage(LogLevel.ERROR, message, context));
            if (trace && this.isDebugMode) {
                console.error(`[TRACE] ${trace}`);
            }
        }
    }
    warn(message, context) {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(this.formatMessage(LogLevel.WARN, message, context));
        }
    }
    debug(message, context) {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.log(this.formatMessage(LogLevel.DEBUG, message, context));
        }
    }
    verbose(message, context) {
        if (this.shouldLog(LogLevel.VERBOSE)) {
            console.log(this.formatMessage(LogLevel.VERBOSE, message, context));
        }
    }
    telegramUpdate(update, context) {
        if (this.isDebugMode) {
            const type = this.getUpdateType(update);
            const userId = this.getUserId(update);
            const username = this.getUsername(update);
            const text = this.getText(update);
            const callback = this.getCallbackData(update);
            this.debug(`Telegram Update: type=${type}, userId=${userId}, username=${username}, text="${text}", callback="${callback}"`, context);
            this.debug(`Full webhook data: ${JSON.stringify(update, null, 2)}`, context);
            if (this.isVerboseMode) {
                this.verbose(`Full update: ${JSON.stringify(update, null, 2)}`, context);
            }
        }
    }
    getUpdateType(update) {
        if (update.message)
            return "message";
        if (update.callback_query)
            return "callback_query";
        if (update.inline_query)
            return "inline_query";
        if (update.chosen_inline_result)
            return "chosen_inline_result";
        if (update.channel_post)
            return "channel_post";
        if (update.edited_message)
            return "edited_message";
        if (update.edited_channel_post)
            return "edited_channel_post";
        if (update.shipping_query)
            return "shipping_query";
        if (update.pre_checkout_query)
            return "pre_checkout_query";
        if (update.poll)
            return "poll";
        if (update.poll_answer)
            return "poll_answer";
        if (update.my_chat_member)
            return "my_chat_member";
        if (update.chat_member)
            return "chat_member";
        if (update.chat_join_request)
            return "chat_join_request";
        return "unknown";
    }
    getUserId(update) {
        return (update.message?.from?.id ||
            update.callback_query?.from?.id ||
            update.inline_query?.from?.id ||
            update.chosen_inline_result?.from?.id ||
            update.edited_message?.from?.id ||
            update.edited_channel_post?.from?.id ||
            update.shipping_query?.from?.id ||
            update.pre_checkout_query?.from?.id ||
            update.poll_answer?.user?.id ||
            update.my_chat_member?.from?.id ||
            update.chat_member?.from?.id ||
            update.chat_join_request?.from?.id ||
            "unknown");
    }
    getUsername(update) {
        return (update.message?.from?.username ||
            update.callback_query?.from?.username ||
            update.inline_query?.from?.username ||
            update.chosen_inline_result?.from?.username ||
            update.edited_message?.from?.username ||
            update.edited_channel_post?.from?.username ||
            update.shipping_query?.from?.username ||
            update.pre_checkout_query?.from?.username ||
            update.poll_answer?.user?.username ||
            update.my_chat_member?.from?.username ||
            update.chat_member?.from?.username ||
            update.chat_join_request?.from?.username ||
            "unknown");
    }
    getText(update) {
        return (update.message?.text ||
            update.edited_message?.text ||
            update.channel_post?.text ||
            update.edited_channel_post?.text ||
            "");
    }
    getCallbackData(update) {
        return update.callback_query?.data || "";
    }
};
exports.CustomLoggerService = CustomLoggerService;
exports.CustomLoggerService = CustomLoggerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CustomLoggerService);
//# sourceMappingURL=logger.service.js.map