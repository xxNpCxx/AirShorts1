import { Inject, Injectable } from '@nestjs/common';
import { PG_POOL } from '../database/database.module';
import { Pool } from 'pg';

@Injectable()
export class SettingsService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async getSetting(key: string): Promise<string | null> {
    const res = await this.pool.query('SELECT value FROM settings WHERE key = $1', [key]);
    return res.rows[0]?.value ?? null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await this.pool.query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
      [key, value]
    );
  }

  async getCommissionPercent(): Promise<number> {
    const value = await this.getSetting('commission_percent');
    const percent = parseFloat(value || '0');
    const isPercentNaN = Number.isNaN(percent) === true;
    const isPercentOutOfRange = percent < 0 || percent > 1;
    const isInvalidPercent = isPercentNaN === true || isPercentOutOfRange === true;
    if (isInvalidPercent === true) return 0.2;
    return percent;
  }

  async setCommissionPercent(percent: number): Promise<void> {
    const isNotNumber = typeof percent === 'number' ? false : true;
    const isOutOfRange = percent < 0 || percent > 1;
    const isInvalid = isNotNumber === true || isOutOfRange === true;
    if (isInvalid === true) {
      throw new Error('Процент должен быть от 0 до 1');
    }
    await this.setSetting('commission_percent', percent.toString());
  }

  async getReferralCommissionPercent(): Promise<number> {
    const value = await this.getSetting('referral_commission_percent');
    const percent = parseFloat(value || '0');
    const isRefPercentNaN = Number.isNaN(percent) === true;
    const isRefPercentOutOfRange = percent < 0 || percent > 1;
    const isRefInvalid = isRefPercentNaN === true || isRefPercentOutOfRange === true;
    if (isRefInvalid === true) return 0.25;
    return percent;
  }

  async setReferralCommissionPercent(percent: number): Promise<void> {
    const isNotNumberRef = typeof percent === 'number' ? false : true;
    const isOutOfRangeRef = percent < 0 || percent > 1;
    const isInvalidRef = isNotNumberRef === true || isOutOfRangeRef === true;
    if (isInvalidRef === true) {
      throw new Error('Процент должен быть от 0 до 1');
    }
    await this.setSetting('referral_commission_percent', percent.toString());
  }

  async getOwnerId(): Promise<string | null> {
    const value = await this.getSetting('owner_id');
    return value ? value.trim() : null;
  }

  async getAdminIds(): Promise<string[]> {
    const value = await this.getSetting('admin_ids');
    return value
      ? value
          .split(',')
          .map((id: string) => id.trim())
          .filter(Boolean)
      : [];
  }

  async getOperatorIds(): Promise<string[]> {
    const value = await this.getSetting('operator_ids');
    return value
      ? value
          .split(',')
          .map((id: string) => id.trim())
          .filter(Boolean)
      : [];
  }

  async checkRole(userId: string, role: 'owner' | 'admin' | 'operator'): Promise<boolean> {
    userId = String(userId);
    const isRoleOwner = role === 'owner';
    if (isRoleOwner === true) {
      return (await this.getOwnerId()) === userId;
    }
    const isRoleAdmin = role === 'admin';
    if (isRoleAdmin === true) {
      const admins = await this.getAdminIds();
      const isAdminIncluded = admins.includes(userId) === true;
      return isAdminIncluded;
    }
    const isRoleOperator = role === 'operator';
    if (isRoleOperator === true) {
      const ops = await this.getOperatorIds();
      const isOperatorIncluded = ops.includes(userId) === true;
      if (isOperatorIncluded === true) return true;
      return this.checkRole(userId, 'admin');
    }
    return false;
  }
}
