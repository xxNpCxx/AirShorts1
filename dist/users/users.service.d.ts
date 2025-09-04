import { Pool } from "pg";
import { Context } from "telegraf";
interface TelegramContext extends Context {
}
export declare class UsersService {
    private readonly pool;
    private readonly logger;
    constructor(pool: Pool);
    upsertFromContext(ctx: TelegramContext): Promise<boolean>;
    getUserPreferredService(telegramId: number): Promise<'did' | 'heygen'>;
    setUserPreferredService(telegramId: number, service: 'did' | 'heygen'): Promise<boolean>;
}
export {};
//# sourceMappingURL=users.service.d.ts.map