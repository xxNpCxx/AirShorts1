import { Injectable } from '@nestjs/common';
import { Scene, SceneEnter, Action, Ctx, On } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { ReferralsService } from '../referrals/referrals.service';
import { ReferralPaymentHook } from '../referrals/referral-payment.hook';
import { KeyboardsService } from '../keyboards/keyboards.service';
import { CustomLoggerService } from '../logger/logger.service';

interface TelegramContext extends Context {}

interface PaymentSession {
  amount: number;
  service: string;
  requestId: string;
  userId: number;
}

@Injectable()
@Scene('payment')
export class PaymentScene {
  constructor(
    private readonly referralsService: ReferralsService,
    private readonly referralPaymentHook: ReferralPaymentHook,
    private readonly keyboardsService: KeyboardsService,
    private readonly logger: CustomLoggerService
  ) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: TelegramContext): Promise<void> {
    await this.showPaymentMenu(ctx);
  }

  @Action('payment_menu')
  async showPaymentMenu(@Ctx() ctx: TelegramContext): Promise<void> {
    try {
      const message = `💳 <b>СИСТЕМА ОПЛАТЫ</b>

🎬 <b>Готовый продукт:</b>
• Полное видео с голосом: 75₽
  └ Создание 3D аватара + синтез речи

🎵 <b>Дополнительные услуги:</b>
• Только аудио: 25₽
  └ Генерация речи по тексту

💰 <b>Реферальная система:</b>
• 10% с покупок ваших рефералов
• 5% с покупок рефералов 2-го уровня
• 2% с покупок рефералов 3-го уровня

💡 <b>Выберите действие:</b>`;

      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: this.keyboardsService.paymentMenu().reply_markup,
      });
    } catch (error) {
      this.logger.error('Ошибка показа меню оплаты:', error);
    }
  }

  @Action('payment_full_video')
  async processFullVideoPayment(@Ctx() ctx: TelegramContext): Promise<void> {
    await this.processPayment(ctx, 'full_video', 75.0);
  }

  @Action('payment_audio_only')
  async processAudioOnlyPayment(@Ctx() ctx: TelegramContext): Promise<void> {
    await this.processPayment(ctx, 'audio_only', 25.0);
  }

  @Action('payment_custom')
  async processCustomPayment(@Ctx() ctx: TelegramContext): Promise<void> {
    try {
      const message = `💳 <b>КАСТОМНАЯ ОПЛАТА</b>

Введите сумму для оплаты (только число):

Пример: 100`;

      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: this.keyboardsService.paymentCustom().reply_markup,
      });

      // Устанавливаем состояние ожидания ввода суммы
      (ctx as any).session = { ...(ctx as any).session, waitingForAmount: true };
    } catch (error) {
      this.logger.error('Ошибка показа кастомной оплаты:', error);
    }
  }

  @On('text')
  async onText(@Ctx() ctx: TelegramContext): Promise<void> {
    const session = (ctx as any).session;
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';

    if (session?.waitingForAmount) {
      await this.handleAmountInput(ctx, text);
      return;
    }

    // Обрабатываем другие текстовые сообщения
    await ctx.reply('Используйте кнопки для навигации по меню оплаты.');
  }

  private async handleAmountInput(@Ctx() ctx: TelegramContext, text: string): Promise<void> {
    try {
      const amount = parseFloat(text);
      
      if (isNaN(amount) || amount <= 0) {
        await ctx.reply('❌ Введите корректную сумму (только положительное число)');
        return;
      }

      if (amount > 10000) {
        await ctx.reply('❌ Сумма не может превышать 10,000₽');
        return;
      }

      // Очищаем состояние ожидания
      (ctx as any).session = { ...(ctx as any).session, waitingForAmount: false };

      await this.processPayment(ctx, 'custom', amount);
    } catch (error) {
      this.logger.error('Ошибка обработки ввода суммы:', error);
      await ctx.reply('❌ Ошибка обработки суммы. Попробуйте еще раз.');
    }
  }

  private async processPayment(
    @Ctx() ctx: TelegramContext,
    service: string,
    amount: number
  ): Promise<void> {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;

      // Получаем ID пользователя из базы данных
      const userResult = await this.getUserFromDatabase(userId);
      if (!userResult) {
        await ctx.reply('❌ Пользователь не найден в базе данных');
        return;
      }

      const requestId = this.generateRequestId();
      
      // Показываем информацию об оплате
      const message = `💳 <b>ОПЛАТА</b>

🎬 <b>Сервис:</b> ${this.getServiceName(service)}
💰 <b>Сумма:</b> ${amount}₽
🆔 <b>ID заказа:</b> ${requestId}

⏳ <b>Обработка платежа...</b>

💡 <i>В реальной системе здесь будет интеграция с платежным провайдером</i>`;

      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: this.keyboardsService.paymentProcessing().reply_markup,
      });

      // Симулируем обработку платежа
      await this.simulatePaymentProcessing(ctx, userResult.id, service, amount, requestId);

    } catch (error) {
      this.logger.error('Ошибка обработки платежа:', error);
      await ctx.reply('❌ Ошибка обработки платежа');
    }
  }

  private async simulatePaymentProcessing(
    @Ctx() ctx: TelegramContext,
    userId: number,
    service: string,
    amount: number,
    requestId: string
  ): Promise<void> {
    try {
      // Симулируем задержку обработки
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Симулируем успешную оплату (в реальной системе здесь будет проверка статуса платежа)
      const paymentSuccess = Math.random() > 0.1; // 90% успешных платежей

      if (paymentSuccess) {
        // Начисляем реферальные бонусы
        await this.referralPaymentHook.onVideoRequestCompleted(
          userId,
          amount,
          requestId,
          service
        );

        const message = `✅ <b>ПЛАТЕЖ УСПЕШНО ОБРАБОТАН</b>

🎬 <b>Сервис:</b> ${this.getServiceName(service)}
💰 <b>Сумма:</b> ${amount}₽
🆔 <b>ID заказа:</b> ${requestId}
⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU')}

🎉 <b>Спасибо за покупку!</b>
💡 <b>Реферальные бонусы начислены автоматически</b>`;

        await ctx.editMessageText(message, {
          parse_mode: 'HTML',
          reply_markup: this.keyboardsService.paymentSuccess().reply_markup,
        });

        // Показываем уведомление о реферальных бонусах
        await this.showReferralBonusNotification(ctx, userId, amount);

      } else {
        const message = `❌ <b>ОШИБКА ОПЛАТЫ</b>

🎬 <b>Сервис:</b> ${this.getServiceName(service)}
💰 <b>Сумма:</b> ${amount}₽
🆔 <b>ID заказа:</b> ${requestId}

⚠️ <b>Платеж не прошел</b>
💡 <b>Попробуйте еще раз или обратитесь в поддержку</b>`;

        await ctx.editMessageText(message, {
          parse_mode: 'HTML',
          reply_markup: this.keyboardsService.paymentError().reply_markup,
        });
      }

    } catch (error) {
      this.logger.error('Ошибка симуляции платежа:', error);
      await ctx.reply('❌ Ошибка обработки платежа');
    }
  }

  private async showReferralBonusNotification(
    @Ctx() ctx: TelegramContext,
    userId: number,
    amount: number
  ): Promise<void> {
    try {
      // Получаем статистику рефералов пользователя
      const statsResult = await this.referralsService.getReferralStats(userId);
      
      if (statsResult.referralStats && statsResult.referralStats.total_referrals > 0) {
        const stats = statsResult.referralStats;
        const message = `🎉 <b>РЕФЕРАЛЬНЫЕ БОНУСЫ НАЧИСЛЕНЫ!</b>

👥 <b>Ваши рефералы:</b> ${stats.total_referrals}
💰 <b>Общий заработок:</b> ${stats.total_earned.toFixed(2)}₽

📊 <b>По уровням:</b>
• 1️⃣ Уровень: ${stats.level_1_referrals} рефералов
• 2️⃣ Уровень: ${stats.level_2_referrals} рефералов
• 3️⃣ Уровень: ${stats.level_3_referrals} рефералов

💡 <b>Продолжайте приглашать друзей для увеличения дохода!</b>`;

        await ctx.reply(message, {
          parse_mode: 'HTML',
          reply_markup: this.keyboardsService.referralSystem().reply_markup,
        });
      }

    } catch (error) {
      this.logger.error('Ошибка показа уведомления о реферальных бонусах:', error);
    }
  }

  @Action('payment_back')
  async backToMainMenu(@Ctx() ctx: TelegramContext): Promise<void> {
    try {
      await (ctx as any).scene.leave();
      // Здесь должен быть вызов главного меню
      // await this.menuService.sendMainMenu(ctx);
    } catch (error) {
      this.logger.error('Ошибка возврата в главное меню:', error);
    }
  }

  @Action('payment_retry')
  async retryPayment(@Ctx() ctx: TelegramContext): Promise<void> {
    await this.showPaymentMenu(ctx);
  }

  private getServiceName(service: string): string {
    const names: Record<string, string> = {
      'full_video': 'Полное видео с голосом (AKOOL + ElevenLabs)',
      'audio_only': 'Только аудио (ElevenLabs)',
      'custom': 'Кастомная оплата',
    };
    return names[service] || service;
  }

  private generateRequestId(): string {
    return `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Получает пользователя из базы данных по telegram_id
   */
  private async getUserFromDatabase(telegramId: number): Promise<{ id: number } | null> {
    try {
      // Здесь должен быть запрос к базе данных
      // Пока возвращаем заглушку
      return { id: telegramId };
    } catch (error) {
      this.logger.error('Ошибка получения пользователя из базы данных:', error);
      return null;
    }
  }
}
