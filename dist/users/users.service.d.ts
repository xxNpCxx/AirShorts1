import { Pool } from 'pg';
interface TelegramUser {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    language_code?: string;
    is_bot?: boolean;
}
interface TelegramContext {
    from?: TelegramUser;
}
export declare class UsersService {
    private readonly pool;
    private readonly logger;
    constructor(pool: Pool);
    upsertFromContext(ctx: TelegramContext): Promise<boolean>;
}
export {};
//# sourceMappingURL=users.service.d.ts.map