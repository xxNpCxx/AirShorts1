import { Injectable, Logger } from '@nestjs/common';
import { ReferralsService } from './referrals.service';

/**
 * Хук для начисления реферальных бонусов при завершении видео-запросов
 */
@Injectable()
export class ReferralPaymentHook {
  private readonly logger = new Logger(ReferralPaymentHook.name);

  constructor(private readonly referralsService: ReferralsService) {}

  /**
   * Обрабатывает завершение видео-запроса и начисляет реферальные бонусы
   */
  async onVideoRequestCompleted(
    userId: number,
    amount: number,
    requestId: string,
    service: string
  ): Promise<void> {
    try {
      this.logger.log(
        `🎬 Обработка завершения видео-запроса: пользователь ${userId}, сумма ${amount}, сервис ${service}`
      );

      // Начисляем реферальные бонусы
      const success = await this.referralsService.processPayment(
        userId,
        amount,
        `${service}_${requestId}`
      );

      if (success) {
        this.logger.log(
          `✅ Реферальные бонусы успешно начислены для пользователя ${userId}`
        );
      } else {
        this.logger.warn(
          `⚠️ Не удалось начислить реферальные бонусы для пользователя ${userId}`
        );
      }
    } catch (error) {
      this.logger.error(
        `❌ Ошибка начисления реферальных бонусов для пользователя ${userId}:`,
        error
      );
    }
  }

  /**
   * Обрабатывает отмену видео-запроса (откат реферальных бонусов)
   */
  async onVideoRequestCancelled(
    userId: number,
    amount: number,
    requestId: string,
    service: string
  ): Promise<void> {
    try {
      this.logger.log(
        `❌ Обработка отмены видео-запроса: пользователь ${userId}, сумма ${amount}, сервис ${service}`
      );

      // Здесь можно добавить логику отмены реферальных бонусов
      // Пока просто логируем
      this.logger.log(
        `ℹ️ Отмена реферальных бонусов для пользователя ${userId} (функция в разработке)`
      );
    } catch (error) {
      this.logger.error(
        `❌ Ошибка отмены реферальных бонусов для пользователя ${userId}:`,
        error
      );
    }
  }

  /**
   * Получает стоимость продукта по типу
   */
  getProductPrice(productType: string): number {
    // Цены на готовые продукты
    const prices: Record<string, number> = {
      'full_video': 75.0,  // 75 рублей за полное видео с голосом
      'audio_only': 25.0,  // 25 рублей за только аудио
    };

    return prices[productType] || 75.0; // По умолчанию 75 рублей
  }
}
