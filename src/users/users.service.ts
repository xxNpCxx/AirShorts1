import { Inject, Injectable, Logger } from '@nestjs/common';
import { PG_POOL } from '../database/database.module';
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

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async upsertFromContext(ctx: TelegramContext): Promise<boolean> {
    const u = ctx.from;
    if (!u) return false;
    try {
      const res = await this.pool.query('SELECT telegram_id FROM users WHERE telegram_id = $1', [u.id]);
      const isNewUser = res.rowCount === 0;
      await this.pool.query(
        `INSERT INTO users (telegram_id, username, first_name, last_name, language_code, is_bot)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (telegram_id) DO UPDATE
           SET username = EXCLUDED.username,
               first_name = EXCLUDED.first_name,
               last_name = EXCLUDED.last_name,
               language_code = EXCLUDED.language_code,
               is_bot = EXCLUDED.is_bot,
               last_active = NOW(),
               requests_count = users.requests_count + 1`,
        [
          u.id,
          u.username || null,
          u.first_name || null,
          u.last_name || null,
          u.language_code || null,
          u.is_bot || false,
        ],
      );
      return isNewUser;
    } catch (err) {
      this.logger.error('[users][pg] Ошибка upsert:', err);
      return false;
    }
  }
}


