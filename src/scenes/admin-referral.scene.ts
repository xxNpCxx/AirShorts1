import { Injectable } from '@nestjs/common';
import { Scene, SceneEnter, Action, Ctx, On } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { ReferralsService } from '../referrals/referrals.service';
import { KeyboardsService } from '../keyboards/keyboards.service';
import { CustomLoggerService } from '../logger/logger.service';

interface TelegramContext extends Context {}

@Injectable()
@Scene('admin-referral')
export class AdminReferralScene {
  constructor(
    private readonly referralsService: ReferralsService,
    private readonly keyboardsService: KeyboardsService,
    private readonly logger: CustomLoggerService
  ) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: TelegramContext): Promise<void> {
    await this.showAdminMenu(ctx);
  }

  @Action('admin_referral_menu')
  async showAdminMenu(@Ctx() ctx: TelegramContext): Promise<void> {
    try {
      const message = `👑 <b>АДМИН-ПАНЕЛЬ РЕФЕРАЛЬНОЙ СИСТЕМЫ</b>

🔧 <b>Управление реферальной системой</b>

📊 <b>Доступные действия:</b>
• Общая статистика
• Все начисления
• Топ рефералов
• Настройки системы

💡 <b>Выберите действие:</b>`;

      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: this.keyboardsService.adminReferralMenu().reply_markup,
      });
    } catch (error) {
      this.logger.error('Ошибка показа админ-меню рефералов:', error);
    }
  }

  @Action('admin_referral_stats')
  async showSystemStats(@Ctx() ctx: TelegramContext): Promise<void> {
    try {
      const stats = await this.referralsService.getSystemStats();
      
      const message = `📊 <b>ОБЩАЯ СТАТИСТИКА РЕФЕРАЛЬНОЙ СИСТЕМЫ</b>

👥 <b>Активные рефереры:</b> ${stats.active_referrers}
📈 <b>Всего рефералов:</b> ${stats.total_referrals}
💰 <b>Общий заработок:</b> ${stats.total_earned.toFixed(2)}₽

📊 <b>По уровням:</b>
• 1️⃣ Уровень: ${stats.referrals_by_level[1] || 0} рефералов
• 2️⃣ Уровень: ${stats.referrals_by_level[2] || 0} рефералов
• 3️⃣ Уровень: ${stats.referrals_by_level[3] || 0} рефералов

🔄 <b>Последнее обновление:</b> ${new Date().toLocaleString('ru-RU')}`;

      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: this.keyboardsService.adminReferralStats().reply_markup,
      });
    } catch (error) {
      this.logger.error('Ошибка показа системной статистики:', error);
      await ctx.reply('❌ Ошибка получения статистики');
    }
  }

  @Action('admin_referral_payments')
  async showAllPayments(@Ctx() ctx: TelegramContext): Promise<void> {
    try {
      const payments = await this.referralsService.getAllPayments(20, 0);
      
      let message = `💰 <b>ВСЕ РЕФЕРАЛЬНЫЕ НАЧИСЛЕНИЯ</b>\n\n`;
      
      if (payments.length === 0) {
        message += '😔 Пока нет начислений';
      } else {
        payments.forEach((payment, index) => {
          const referrerName = (payment as any).referrer_first_name + 
            ((payment as any).referrer_username ? ` (@${(payment as any).referrer_username})` : '');
          const payerName = (payment as any).payer_first_name + 
            ((payment as any).payer_username ? ` (@${(payment as any).payer_username})` : '');
          const date = new Date(payment.created_at).toLocaleString('ru-RU');
          const status = payment.status === 'paid' ? '✅' : payment.status === 'pending' ? '⏳' : '❌';
          
          message += `${index + 1}. ${status} ${payment.amount.toFixed(2)}₽\n`;
          message += `   👤 Реферер: ${referrerName}\n`;
          message += `   💳 Плательщик: ${payerName}\n`;
          message += `   📊 Уровень ${payment.level} (${payment.bonus_value}%)\n`;
          message += `   📅 ${date}\n\n`;
        });

        if (payments.length >= 20) {
          message += `... и еще начислений (показаны первые 20)`;
        }
      }

      message += `\n🔙 <b>Назад к админ-панели</b>`;

      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: this.keyboardsService.adminReferralMenu().reply_markup,
      });
    } catch (error) {
      this.logger.error('Ошибка показа всех начислений:', error);
      await ctx.reply('❌ Ошибка получения начислений');
    }
  }

  @Action('admin_referral_top')
  async showTopReferrers(@Ctx() ctx: TelegramContext): Promise<void> {
    try {
      const stats = await this.referralsService.getSystemStats();
      
      let message = `🏆 <b>ТОП РЕФЕРАЛОВ</b>\n\n`;
      
      if (stats.top_referrers.length === 0) {
        message += '😔 Пока нет рефералов';
      } else {
        stats.top_referrers.forEach((referrer, index) => {
          const name = referrer.first_name + (referrer.username ? ` (@${referrer.username})` : '');
          message += `${index + 1}. ${name}\n`;
          message += `   👥 Рефералов: ${referrer.total_referrals}\n`;
          message += `   💰 Заработал: ${referrer.total_earned.toFixed(2)}₽\n\n`;
        });
      }

      message += `🔙 <b>Назад к админ-панели</b>`;

      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: this.keyboardsService.adminReferralMenu().reply_markup,
      });
    } catch (error) {
      this.logger.error('Ошибка показа топа рефералов:', error);
      await ctx.reply('❌ Ошибка получения топа рефералов');
    }
  }

  @Action('admin_referral_settings')
  async showSettings(@Ctx() ctx: TelegramContext): Promise<void> {
    try {
      const message = `⚙️ <b>НАСТРОЙКИ РЕФЕРАЛЬНОЙ СИСТЕМЫ</b>

💰 <b>Текущие проценты:</b>
• 1️⃣ Уровень: 10%
• 2️⃣ Уровень: 5%
• 3️⃣ Уровень: 2%

🔧 <b>Доступные действия:</b>
• Изменить проценты
• Включить/выключить систему
• Экспорт данных
• Очистка данных

⚠️ <b>Внимание:</b> Изменение настроек может повлиять на работу системы

💡 <b>Функция в разработке</b>`;

      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: this.keyboardsService.adminReferralSettings().reply_markup,
      });
    } catch (error) {
      this.logger.error('Ошибка показа настроек:', error);
    }
  }

  @Action('admin_referral_daily')
  async showDailyStats(@Ctx() ctx: TelegramContext): Promise<void> {
    try {
      const stats = await this.referralsService.getDailyReferralStats();
      const today = new Date().toLocaleDateString('ru-RU');

      let message = `📅 <b>СТАТИСТИКА ЗА ДЕНЬ</b>\n`;
      message += `📆 Дата: ${today}\n\n`;
      
      message += `📊 <b>Общая статистика:</b>\n`;
      message += `• Всего рефералов: ${stats.totalReferrals}\n`;
      message += `• Общий доход: ${stats.totalEarnings.toFixed(2)}₽\n\n`;
      
      message += `🎯 <b>По уровням:</b>\n`;
      message += `• 1-й уровень: ${stats.level1Referrals} рефералов (${stats.level1Earnings.toFixed(2)}₽)\n`;
      message += `• 2-й уровень: ${stats.level2Referrals} рефералов (${stats.level2Earnings.toFixed(2)}₽)\n`;
      message += `• 3-й уровень: ${stats.level3Referrals} рефералов (${stats.level3Earnings.toFixed(2)}₽)\n\n`;

      if (stats.topReferrers.length > 0) {
        message += `🏆 <b>Топ рефереров за день:</b>\n`;
        stats.topReferrers.forEach((referrer, index) => {
          message += `${index + 1}. ID ${referrer.user_id}: ${referrer.total_referrals} рефералов (${referrer.total_earned.toFixed(2)}₽)\n`;
        });
      } else {
        message += `🏆 <b>Топ рефереров за день:</b>\n`;
        message += `• Пока нет активности\n`;
      }

      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: this.keyboardsService.adminReferralDaily().reply_markup,
      });
    } catch (error) {
      this.logger.error('Ошибка показа дневной статистики:', error);
      await ctx.editMessageText(
        '❌ Ошибка загрузки статистики за день. Попробуйте позже.',
        {
          reply_markup: this.keyboardsService.adminReferralMenu().reply_markup,
        }
      );
    }
  }

  @Action('admin_referral_back')
  async backToMainMenu(@Ctx() ctx: TelegramContext): Promise<void> {
    try {
      await (ctx as any).scene.leave();
      // Здесь должен быть вызов главного меню
      // await this.menuService.sendMainMenu(ctx);
    } catch (error) {
      this.logger.error('Ошибка возврата в главное меню:', error);
    }
  }
}
