type TelegramContext = {
    answerCbQuery: () => Promise<void>;
    reply: (text: string, options?: {
        parse_mode?: string;
        reply_markup?: unknown;
    }) => Promise<void>;
};
export declare class MenuUpdate {
    supportAction(ctx: TelegramContext): Promise<void>;
    support(ctx: TelegramContext): Promise<void>;
    rulesAction(ctx: TelegramContext): Promise<void>;
    rules(ctx: TelegramContext): Promise<void>;
}
export {};
//# sourceMappingURL=menu.update.d.ts.map