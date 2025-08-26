import { Injectable, LoggerService } from "@nestjs/common";

interface TelegramUpdate {
  message?: {
    from?: { id?: string | number; username?: string };
    text?: string;
  };
  callback_query?: {
    from?: { id?: string | number; username?: string };
    data?: string;
  };
  inline_query?: {
    from?: { id?: string | number; username?: string };
  };
  chosen_inline_result?: {
    from?: { id?: string | number; username?: string };
  };
  edited_message?: {
    from?: { id?: string | number; username?: string };
    text?: string;
  };
  edited_channel_post?: {
    from?: { id?: string | number; username?: string };
    text?: string;
  };
  channel_post?: {
    from?: { id?: string | number; username?: string };
    text?: string;
  };
  shipping_query?: {
    from?: { id?: string | number; username?: string };
  };
  pre_checkout_query?: {
    from?: { id?: string | number; username?: string };
  };
  poll?: {
    from?: { id?: string | number; username?: string };
  };
  poll_answer?: {
    user?: { id?: string | number; username?: string };
  };
  my_chat_member?: {
    from?: { id?: string | number; username?: string };
  };
  chat_member?: {
    from?: { id?: string | number; username?: string };
  };
  chat_join_request?: {
    from?: { id?: string | number; username?: string };
  };
}

export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  LOG = "log",
  DEBUG = "debug",
  VERBOSE = "verbose",
}

@Injectable()
export class CustomLoggerService implements LoggerService {
  private readonly isDebugMode: boolean;
  private readonly isVerboseMode: boolean;

  constructor() {
    this.isDebugMode =
      process.env.DEBUG === "true" || process.env.DEBUG === "1";
    this.isVerboseMode =
      process.env.DEBUG === "verbose" || process.env.DEBUG === "2";
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: string,
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : "";
    const levelStr = `[${level.toUpperCase()}]`;
    return `${timestamp} ${levelStr} ${contextStr} ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isVerboseMode) return true;
    if (this.isDebugMode && level !== LogLevel.VERBOSE) return true;
    if (
      !this.isDebugMode &&
      [LogLevel.LOG, LogLevel.WARN, LogLevel.ERROR].includes(level)
    )
      return true;
    return false;
  }

  log(message: string, context?: string): void {
    if (this.shouldLog(LogLevel.LOG)) {
      console.log(this.formatMessage(LogLevel.LOG, message, context));
    }
  }

  error(message: string, trace?: string, context?: string): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message, context));
      if (trace && this.isDebugMode) {
        console.error(`[TRACE] ${trace}`);
      }
    }
  }

  warn(message: string, context?: string): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, context));
    }
  }

  debug(message: string, context?: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  verbose(message: string, context?: string): void {
    if (this.shouldLog(LogLevel.VERBOSE)) {
      console.log(this.formatMessage(LogLevel.VERBOSE, message, context));
    }
  }

  // Специальные методы для Telegram бота
  telegramUpdate(update: TelegramUpdate, context?: string): void {
    if (this.isDebugMode) {
      const type = this.getUpdateType(update);
      const userId = this.getUserId(update);
      const username = this.getUsername(update);
      const text = this.getText(update);
      const callback = this.getCallbackData(update);

      this.debug(
        `Telegram Update: type=${type}, userId=${userId}, username=${username}, text="${text}", callback="${callback}"`,
        context,
      );

      // Всегда логируем полный webhook в DEBUG режиме
      this.debug(
        `Full webhook data: ${JSON.stringify(update, null, 2)}`,
        context,
      );

      if (this.isVerboseMode) {
        this.verbose(
          `Full update: ${JSON.stringify(update, null, 2)}`,
          context,
        );
      }
    }
  }

  private getUpdateType(update: TelegramUpdate): string {
    if (update.message) return "message";
    if (update.callback_query) return "callback_query";
    if (update.inline_query) return "inline_query";
    if (update.chosen_inline_result) return "chosen_inline_result";
    if (update.channel_post) return "channel_post";
    if (update.edited_message) return "edited_message";
    if (update.edited_channel_post) return "edited_channel_post";
    if (update.shipping_query) return "shipping_query";
    if (update.pre_checkout_query) return "pre_checkout_query";
    if (update.poll) return "poll";
    if (update.poll_answer) return "poll_answer";
    if (update.my_chat_member) return "my_chat_member";
    if (update.chat_member) return "chat_member";
    if (update.chat_join_request) return "chat_join_request";
    return "unknown";
  }

  private getUserId(update: TelegramUpdate): string | number {
    return (
      update.message?.from?.id ||
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
      "unknown"
    );
  }

  private getUsername(update: TelegramUpdate): string {
    return (
      update.message?.from?.username ||
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
      "unknown"
    );
  }

  private getText(update: TelegramUpdate): string {
    return (
      update.message?.text ||
      update.edited_message?.text ||
      update.channel_post?.text ||
      update.edited_channel_post?.text ||
      ""
    );
  }

  private getCallbackData(update: TelegramUpdate): string {
    return update.callback_query?.data || "";
  }
}
