import { Inject, Injectable, Logger } from "@nestjs/common";
import { PG_POOL } from "../database/database.module";
import { Pool } from "pg";

interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
  is_bot?: boolean;
}

import { Context } from "telegraf";

interface TelegramContext extends Context {}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly temporaryPreferences = new Map<number, 'did' | 'heygen'>(); // Временный кеш

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async upsertFromContext(ctx: TelegramContext): Promise<boolean> {
    const u = ctx.from;
    if (!u) return false;
    try {
      const res = await this.pool.query(
        "SELECT telegram_id FROM users WHERE telegram_id = $1",
        [u.id],
      );
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
      this.logger.error("[users][pg] Ошибка upsert:", err);
      return false;
    }
  }

  async getUserPreferredService(telegramId: number): Promise<'did' | 'heygen'> {
    // Сначала проверяем, существует ли колонка preferred_service
    const columnCheck = await this.pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'preferred_service'
    `);
    
    if (columnCheck.rowCount === 0) {
      this.logger.warn("[users][pg] Колонка preferred_service не существует, используем временный кеш");
      // Используем временный кеш
      const cachedPreference = this.temporaryPreferences.get(telegramId);
      this.logger.log(`Получено предпочтение из кеша для пользователя ${telegramId}: ${cachedPreference || 'did'}`);
      return cachedPreference || 'did';
    }

    const res = await this.pool.query(
      "SELECT preferred_service FROM users WHERE telegram_id = $1",
      [telegramId],
    );
    if (res.rowCount === 0) {
      return 'did'; // По умолчанию D-ID для новых пользователей
    }
    return res.rows[0].preferred_service || 'did';
  }

  async setUserPreferredService(telegramId: number, service: 'did' | 'heygen'): Promise<boolean> {
    // Сначала проверяем, существует ли колонка preferred_service
    const columnCheck = await this.pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'preferred_service'
    `);
    
    if (columnCheck.rowCount === 0) {
      this.logger.warn("[users][pg] Колонка preferred_service не существует, сохраняем во временный кеш");
      // Сохраняем в временный кеш
      this.temporaryPreferences.set(telegramId, service);
      this.logger.log(`Пользователь ${telegramId} выбрал сервис: ${service} (сохранено во временный кеш)`);
      return true;
    }

    await this.pool.query(
      "UPDATE users SET preferred_service = $1 WHERE telegram_id = $2",
      [service, telegramId],
    );
    this.logger.log(`Установлен предпочтительный сервис ${service} для пользователя ${telegramId}`);
    return true;
  }
}
