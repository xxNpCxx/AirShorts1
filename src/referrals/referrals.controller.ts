import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { CustomLoggerService } from '../logger/logger.service';

interface ReferralStatsResponse {
  total_referrals: number;
  level_1_referrals: number;
  level_2_referrals: number;
  level_3_referrals: number;
  total_earned: number;
  referral_link?: string;
}

interface ReferralListResponse {
  referrals: Array<{
    id: number;
    referred_id: number;
    username?: string;
    first_name: string;
    last_name?: string;
    level: number;
    created_at: Date;
  }>;
}

interface PaymentListResponse {
  payments: Array<{
    id: number;
    amount: number;
    bonus_type: string;
    bonus_value: number;
    level: number;
    status: string;
    payer_username?: string;
    payer_first_name: string;
    created_at: Date;
    paid_at?: Date;
  }>;
}

@Controller('referrals')
export class ReferralsController {
  constructor(
    private readonly referralsService: ReferralsService,
    private readonly logger: CustomLoggerService
  ) {}

  /**
   * Получает статистику рефералов для пользователя
   */
  @Get('stats/:userId')
  async getReferralStats(@Param('userId') userId: number): Promise<ReferralStatsResponse> {
    try {
      const statsResult = await this.referralsService.getReferralStats(userId);
      const isReferralStatsMissing =
        statsResult.referralStats === undefined || statsResult.referralStats === null;
      if (isReferralStatsMissing === true) {
        return {
          total_referrals: 0,
          level_1_referrals: 0,
          level_2_referrals: 0,
          level_3_referrals: 0,
          total_earned: 0,
        };
      }

      const stats = statsResult.referralStats;
      return {
        total_referrals: stats.total_referrals,
        level_1_referrals: stats.level_1_referrals,
        level_2_referrals: stats.level_2_referrals,
        level_3_referrals: stats.level_3_referrals,
        total_earned: parseFloat(stats.total_earned.toString()),
      };
    } catch (error) {
      this.logger.error(`Ошибка получения статистики рефералов для пользователя ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Получает реферальную ссылку для пользователя
   */
  @Get('link/:userId')
  async getReferralLink(
    @Param('userId') userId: number,
    @Query('botUsername') botUsername: string
  ): Promise<{ referral_link: string }> {
    try {
      const link = await this.referralsService.createReferralLink(userId, botUsername);
      return { referral_link: link };
    } catch (error) {
      this.logger.error(`Ошибка получения реферальной ссылки для пользователя ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Получает список рефералов пользователя
   */
  @Get('list/:userId')
  async getUserReferrals(
    @Param('userId') userId: number,
    @Query('level') level?: number
  ): Promise<ReferralListResponse> {
    try {
      const referrals = await this.referralsService.getUserReferrals(userId, level);

      return {
        referrals: referrals.map(ref => ({
          id: ref.id,
          referred_id: ref.referred_id,
          username: (ref as any).username,
          first_name: (ref as any).first_name,
          last_name: (ref as any).last_name,
          level: ref.level,
          created_at: ref.created_at,
        })),
      };
    } catch (error) {
      this.logger.error(`Ошибка получения списка рефералов для пользователя ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Получает историю начислений пользователя
   */
  @Get('payments/:userId')
  async getUserPayments(@Param('userId') userId: number): Promise<PaymentListResponse> {
    try {
      const payments = await this.referralsService.getUserPayments(userId);

      return {
        payments: payments.map(payment => ({
          id: payment.id,
          amount: parseFloat(payment.amount.toString()),
          bonus_type: payment.bonus_type,
          bonus_value: parseFloat(payment.bonus_value.toString()),
          level: payment.level,
          status: payment.status,
          payer_username: (payment as any).username,
          payer_first_name: (payment as any).first_name,
          created_at: payment.created_at,
          paid_at: payment.paid_at,
        })),
      };
    } catch (error) {
      this.logger.error(`Ошибка получения начислений для пользователя ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Обрабатывает регистрацию по реферальной ссылке
   */
  @Post('register')
  async processReferralRegistration(
    @Body() body: { referrerCode: string; newUserId: number }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.referralsService.processReferralRegistration(
        body.referrerCode,
        body.newUserId
      );

      const isReferralCreated = result.referral !== undefined && result.referral !== null;
      if (isReferralCreated === true) {
        return {
          success: true,
          message: 'Реферальная связь успешно создана',
        };
      } else {
        return {
          success: false,
          message: result.error || 'Ошибка создания реферальной связи',
        };
      }
    } catch (error) {
      this.logger.error('Ошибка обработки регистрации по реферальной ссылке:', error);
      return {
        success: false,
        message: 'Внутренняя ошибка сервера',
      };
    }
  }

  /**
   * Обрабатывает платеж и начисляет реферальные бонусы
   */
  @Post('process-payment')
  async processPayment(
    @Body() body: { payerUserId: number; amount: number; paymentReference?: string }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const success = await this.referralsService.processPayment(
        body.payerUserId,
        body.amount,
        body.paymentReference
      );

      const isPaymentSuccessful = success === true;
      if (isPaymentSuccessful === true) {
        return {
          success: true,
          message: 'Платеж успешно обработан, реферальные бонусы начислены',
        };
      } else {
        return {
          success: false,
          message: 'Ошибка обработки платежа',
        };
      }
    } catch (error) {
      this.logger.error('Ошибка обработки платежа:', error);
      return {
        success: false,
        message: 'Внутренняя ошибка сервера',
      };
    }
  }

  /**
   * Получает общую статистику реферальной системы (для админа)
   */
  @Get('admin/stats')
  async getSystemStats(): Promise<{
    total_referrals: number;
    active_referrers: number;
    total_earned: number;
    referrals_by_level: Record<number, number>;
    top_referrers: Array<{
      user_id: number;
      username?: string;
      first_name: string;
      total_referrals: number;
      total_earned: number;
    }>;
  }> {
    try {
      return await this.referralsService.getSystemStats();
    } catch (error) {
      this.logger.error('Ошибка получения системной статистики:', error);
      throw error;
    }
  }

  /**
   * Получает все реферальные начисления (для админа)
   */
  @Get('admin/payments')
  async getAllPayments(
    @Query('limit') limit: number = 100,
    @Query('offset') offset: number = 0
  ): Promise<{
    payments: Array<{
      id: number;
      amount: number;
      bonus_type: string;
      bonus_value: number;
      level: number;
      status: string;
      referrer_username?: string;
      referrer_first_name: string;
      payer_username?: string;
      payer_first_name: string;
      created_at: Date;
      paid_at?: Date;
    }>;
  }> {
    try {
      const payments = await this.referralsService.getAllPayments(limit, offset);

      return {
        payments: payments.map(payment => ({
          id: payment.id,
          amount: parseFloat(payment.amount.toString()),
          bonus_type: payment.bonus_type,
          bonus_value: parseFloat(payment.bonus_value.toString()),
          level: payment.level,
          status: payment.status,
          referrer_username: (payment as any).referrer_username,
          referrer_first_name: (payment as any).referrer_first_name,
          payer_username: (payment as any).payer_username,
          payer_first_name: (payment as any).payer_first_name,
          created_at: payment.created_at,
          paid_at: payment.paid_at,
        })),
      };
    } catch (error) {
      this.logger.error('Ошибка получения всех начислений:', error);
      throw error;
    }
  }

  /**
   * Проверяет, является ли пользователь рефералом
   */
  @Get('check/:userId')
  async checkReferralStatus(@Param('userId') userId: number): Promise<{
    is_referral: boolean;
    referrer_info?: { referrer_id: number; level: number };
  }> {
    try {
      const isReferral = await this.referralsService.isReferral(userId);
      let referrerInfo = null;

      const isUserReferral = isReferral === true;
      if (isUserReferral === true) {
        referrerInfo = await this.referralsService.getReferrer(userId);
      }

      return {
        is_referral: isReferral,
        referrer_info: referrerInfo,
      };
    } catch (error) {
      this.logger.error(`Ошибка проверки статуса реферала для пользователя ${userId}:`, error);
      throw error;
    }
  }
}
