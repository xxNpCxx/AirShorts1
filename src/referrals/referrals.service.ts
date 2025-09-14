import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import {
  ReferralsTable,
  ReferralPaymentsTable,
  ReferralStatsTable,
  CreateReferralData,
  CreateReferralPaymentData,
  CreateReferralStatsData,
  ReferralQueryResult,
  ReferralPaymentQueryResult,
  ReferralStatsQueryResult,
  ReferralStats,
  REFERRAL_BONUS_RATES,
} from '../types/database.types';

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  /**
   * Генерирует уникальный реферальный код для пользователя
   */
  async generateReferralCode(userId: number): Promise<string> {
    try {
      const result = await this.pool.query('SELECT generate_referral_code($1) as code', [userId]);
      return result.rows[0].code;
    } catch (error) {
      this.logger.error(`Ошибка генерации реферального кода для пользователя ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Получает или создает реферальный код для пользователя
   */
  async getOrCreateReferralCode(userId: number): Promise<string> {
    try {
      // Сначала проверяем, есть ли уже код у пользователя
      const existingCode = await this.pool.query(
        'SELECT referral_code FROM users WHERE id = $1 AND referral_code IS NOT NULL',
        [userId]
      );

      if (existingCode.rows.length > 0) {
        return existingCode.rows[0].referral_code;
      }

      // Генерируем новый код
      const code = await this.generateReferralCode(userId);

      // Сохраняем код в таблице пользователей
      await this.pool.query('UPDATE users SET referral_code = $1 WHERE id = $2', [code, userId]);

      return code;
    } catch (error) {
      this.logger.error(
        `Ошибка получения/создания реферального кода для пользователя ${userId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Создает реферальную связь
   */
  async createReferral(data: CreateReferralData): Promise<ReferralQueryResult> {
    try {
      const result = await this.pool.query(
        `INSERT INTO referrals (referrer_id, referred_id, referral_code, level)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [data.referrer_id, data.referred_id, data.referral_code, data.level]
      );

      const referral = result.rows[0] as ReferralsTable;

      // Обновляем статистику
      await this.updateReferralStats(data.referrer_id);

      return { referral };
    } catch (error) {
      this.logger.error('Ошибка создания реферала:', error);
      return { referral: null, error: error.message };
    }
  }

  /**
   * Обрабатывает регистрацию по реферальной ссылке
   */
  async processReferralRegistration(
    referrerCode: string,
    newUserId: number
  ): Promise<ReferralQueryResult> {
    try {
      // Находим пользователя по реферальному коду
      const referrerResult = await this.pool.query(
        'SELECT id FROM users WHERE referral_code = $1',
        [referrerCode]
      );

      if (referrerResult.rows.length === 0) {
        return { referral: null, error: 'Реферальный код не найден' };
      }

      const referrerId = referrerResult.rows[0].id;

      // Проверяем, что пользователь не регистрируется сам на себя
      if (referrerId === newUserId) {
        return { referral: null, error: 'Нельзя использовать собственную реферальную ссылку' };
      }

      // Создаем реферальную связь
      const referralData: CreateReferralData = {
        referrer_id: referrerId,
        referred_id: newUserId,
        referral_code: referrerCode,
        level: 1,
      };

      return await this.createReferral(referralData);
    } catch (error) {
      this.logger.error('Ошибка обработки регистрации по реферальной ссылке:', error);
      return { referral: null, error: error.message };
    }
  }

  /**
   * Получает статистику рефералов для пользователя
   */
  async getReferralStats(userId: number): Promise<ReferralStatsQueryResult> {
    try {
      const result = await this.pool.query('SELECT * FROM referral_stats WHERE user_id = $1', [
        userId,
      ]);

      if (result.rows.length === 0) {
        // Создаем пустую статистику, если её нет
        await this.updateReferralStats(userId);
        const newResult = await this.pool.query('SELECT * FROM referral_stats WHERE user_id = $1', [
          userId,
        ]);
        return { referralStats: newResult.rows[0] as ReferralStatsTable };
      }

      return { referralStats: result.rows[0] as ReferralStatsTable };
    } catch (error) {
      this.logger.error(`Ошибка получения статистики рефералов для пользователя ${userId}:`, error);
      return { referralStats: null, error: error.message };
    }
  }

  /**
   * Получает список рефералов пользователя по уровням
   */
  async getUserReferrals(userId: number, level?: number): Promise<ReferralsTable[]> {
    try {
      let query = `
        SELECT r.*, u.username, u.first_name, u.last_name
        FROM referrals r
        JOIN users u ON r.referred_id = u.id
        WHERE r.referrer_id = $1
      `;
      const params = [userId];

      if (level) {
        query += ' AND r.level = $2';
        params.push(level);
      }

      query += ' ORDER BY r.created_at DESC';

      const result = await this.pool.query(query, params);
      return result.rows as ReferralsTable[];
    } catch (error) {
      this.logger.error(`Ошибка получения рефералов пользователя ${userId}:`, error);
      return [];
    }
  }

  /**
   * Получает историю начислений пользователя
   */
  async getUserPayments(userId: number): Promise<ReferralPaymentsTable[]> {
    try {
      const result = await this.pool.query(
        `SELECT rp.*, u.username, u.first_name, u.last_name
         FROM referral_payments rp
         JOIN referrals r ON rp.referral_id = r.id
         JOIN users u ON rp.payer_id = u.id
         WHERE r.referrer_id = $1
         ORDER BY rp.created_at DESC`,
        [userId]
      );

      return result.rows as ReferralPaymentsTable[];
    } catch (error) {
      this.logger.error(`Ошибка получения начислений пользователя ${userId}:`, error);
      return [];
    }
  }

  /**
   * Обрабатывает платеж и начисляет реферальные бонусы
   */
  async processPayment(
    payerUserId: number,
    amount: number,
    paymentReference?: string
  ): Promise<boolean> {
    try {
      await this.pool.query('SELECT process_referral_payment($1, $2, $3)', [
        payerUserId,
        amount,
        paymentReference,
      ]);

      this.logger.log(`Обработан платеж ${amount} для пользователя ${payerUserId}`);
      return true;
    } catch (error) {
      this.logger.error(`Ошибка обработки платежа для пользователя ${payerUserId}:`, error);
      return false;
    }
  }

  /**
   * Обновляет статистику рефералов для пользователя
   */
  async updateReferralStats(userId: number): Promise<void> {
    try {
      await this.pool.query('SELECT update_referral_stats($1)', [userId]);
    } catch (error) {
      this.logger.error(`Ошибка обновления статистики для пользователя ${userId}:`, error);
    }
  }

  /**
   * Получает общую статистику реферальной системы (для админа)
   */
  async getSystemStats(): Promise<ReferralStats> {
    try {
      const result = await this.pool.query(`
        SELECT 
          COUNT(DISTINCT r.referrer_id) as active_referrers,
          COUNT(r.id) as total_referrals,
          COALESCE(SUM(rp.amount), 0) as total_earned,
          json_object_agg(
            r.level, 
            level_counts.count
          ) as referrals_by_level
        FROM referrals r
        LEFT JOIN referral_payments rp ON r.id = rp.referral_id AND rp.status = 'paid'
        LEFT JOIN (
          SELECT level, COUNT(*) as count
          FROM referrals
          GROUP BY level
        ) level_counts ON r.level = level_counts.level
      `);

      const topReferrersResult = await this.pool.query(`
        SELECT 
          u.id as user_id,
          u.username,
          u.first_name,
          rs.total_referrals,
          rs.total_earned
        FROM referral_stats rs
        JOIN users u ON rs.user_id = u.id
        ORDER BY rs.total_earned DESC
        LIMIT 10
      `);

      const stats = result.rows[0];
      return {
        total_referrals: parseInt(stats.total_referrals) || 0,
        active_referrers: parseInt(stats.active_referrers) || 0,
        total_earned: parseFloat(stats.total_earned) || 0,
        referrals_by_level: stats.referrals_by_level || {},
        top_referrers: topReferrersResult.rows,
      };
    } catch (error) {
      this.logger.error('Ошибка получения системной статистики:', error);
      return {
        total_referrals: 0,
        active_referrers: 0,
        total_earned: 0,
        referrals_by_level: {},
        top_referrers: [],
      };
    }
  }

  /**
   * Получает все реферальные начисления (для админа)
   */
  async getAllPayments(limit: number = 100, offset: number = 0): Promise<ReferralPaymentsTable[]> {
    try {
      const result = await this.pool.query(
        `SELECT rp.*, 
                u1.username as referrer_username, u1.first_name as referrer_first_name,
                u2.username as payer_username, u2.first_name as payer_first_name
         FROM referral_payments rp
         JOIN referrals r ON rp.referral_id = r.id
         JOIN users u1 ON r.referrer_id = u1.id
         JOIN users u2 ON rp.payer_id = u2.id
         ORDER BY rp.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return result.rows as ReferralPaymentsTable[];
    } catch (error) {
      this.logger.error('Ошибка получения всех начислений:', error);
      return [];
    }
  }

  /**
   * Создает реферальную ссылку для пользователя
   */
  async createReferralLink(userId: number, botUsername: string): Promise<string> {
    try {
      const code = await this.getOrCreateReferralCode(userId);
      return `https://t.me/${botUsername}?start=ref_${code}`;
    } catch (error) {
      this.logger.error(`Ошибка создания реферальной ссылки для пользователя ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Проверяет, является ли пользователь рефералом
   */
  async isReferral(userId: number): Promise<boolean> {
    try {
      const result = await this.pool.query(
        'SELECT COUNT(*) as count FROM referrals WHERE referred_id = $1',
        [userId]
      );
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      this.logger.error(`Ошибка проверки статуса реферала для пользователя ${userId}:`, error);
      return false;
    }
  }

  /**
   * Получает информацию о реферере пользователя
   */
  async getReferrer(userId: number): Promise<{ referrer_id: number; level: number } | null> {
    try {
      const result = await this.pool.query(
        'SELECT referrer_id, level FROM referrals WHERE referred_id = $1 ORDER BY level ASC LIMIT 1',
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return {
        referrer_id: result.rows[0].referrer_id,
        level: result.rows[0].level,
      };
    } catch (error) {
      this.logger.error(`Ошибка получения реферера для пользователя ${userId}:`, error);
      return null;
    }
  }

  /**
   * Получает статистику рефералов за день
   */
  async getDailyReferralStats(date?: string): Promise<{
    totalReferrals: number;
    totalEarnings: number;
    level1Referrals: number;
    level2Referrals: number;
    level3Referrals: number;
    level1Earnings: number;
    level2Earnings: number;
    level3Earnings: number;
    topReferrers: Array<{
      user_id: number;
      total_referrals: number;
      total_earned: number;
    }>;
  }> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const startOfDay = `${targetDate} 00:00:00`;
      const endOfDay = `${targetDate} 23:59:59`;

      // Получаем общую статистику за день
      const statsResult = await this.pool.query(
        `
        SELECT 
          COUNT(DISTINCT r.id) as total_referrals,
          COALESCE(SUM(rp.amount), 0) as total_earnings,
          COUNT(DISTINCT CASE WHEN r.level = 1 THEN r.id END) as level1_referrals,
          COUNT(DISTINCT CASE WHEN r.level = 2 THEN r.id END) as level2_referrals,
          COUNT(DISTINCT CASE WHEN r.level = 3 THEN r.id END) as level3_referrals,
          COALESCE(SUM(CASE WHEN r.level = 1 THEN rp.amount ELSE 0 END), 0) as level1_earnings,
          COALESCE(SUM(CASE WHEN r.level = 2 THEN rp.amount ELSE 0 END), 0) as level2_earnings,
          COALESCE(SUM(CASE WHEN r.level = 3 THEN rp.amount ELSE 0 END), 0) as level3_earnings
        FROM referrals r
        LEFT JOIN referral_payments rp ON r.id = rp.referral_id 
          AND rp.created_at >= $1 AND rp.created_at <= $2
        WHERE r.created_at >= $1 AND r.created_at <= $2
      `,
        [startOfDay, endOfDay]
      );

      // Получаем топ рефереров за день
      const topReferrersResult = await this.pool.query(
        `
        SELECT 
          r.referrer_id as user_id,
          COUNT(DISTINCT r.id) as total_referrals,
          COALESCE(SUM(rp.amount), 0) as total_earned
        FROM referrals r
        LEFT JOIN referral_payments rp ON r.id = rp.referral_id 
          AND rp.created_at >= $1 AND rp.created_at <= $2
        WHERE r.created_at >= $1 AND r.created_at <= $2
        GROUP BY r.referrer_id
        ORDER BY total_earned DESC, total_referrals DESC
        LIMIT 10
      `,
        [startOfDay, endOfDay]
      );

      const stats = statsResult.rows[0];
      const topReferrers = topReferrersResult.rows;

      return {
        totalReferrals: parseInt(stats.total_referrals) || 0,
        totalEarnings: parseFloat(stats.total_earnings) || 0,
        level1Referrals: parseInt(stats.level1_referrals) || 0,
        level2Referrals: parseInt(stats.level2_referrals) || 0,
        level3Referrals: parseInt(stats.level3_referrals) || 0,
        level1Earnings: parseFloat(stats.level1_earnings) || 0,
        level2Earnings: parseFloat(stats.level2_earnings) || 0,
        level3Earnings: parseFloat(stats.level3_earnings) || 0,
        topReferrers: topReferrers.map(row => ({
          user_id: row.user_id,
          total_referrals: parseInt(row.total_referrals) || 0,
          total_earned: parseFloat(row.total_earned) || 0,
        })),
      };
    } catch (error) {
      this.logger.error(`Ошибка получения дневной статистики рефералов:`, error);
      return {
        totalReferrals: 0,
        totalEarnings: 0,
        level1Referrals: 0,
        level2Referrals: 0,
        level3Referrals: 0,
        level1Earnings: 0,
        level2Earnings: 0,
        level3Earnings: 0,
        topReferrers: [],
      };
    }
  }
}
