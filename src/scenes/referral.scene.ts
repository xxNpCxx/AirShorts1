import { Injectable } from '@nestjs/common';
import { Scene, SceneEnter, Action, Ctx, On } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { ReferralsService } from '../referrals/referrals.service';
import { KeyboardsService } from '../keyboards/keyboards.service';
import { CustomLoggerService } from '../logger/logger.service';

interface TelegramContext extends Context {}

@Injectable()
@Scene('referral')
export class ReferralScene {
  constructor(
    private readonly referralsService: ReferralsService,
    private readonly keyboardsService: KeyboardsService,
    private readonly logger: CustomLoggerService
  ) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: TelegramContext): Promise<void> {
    await this.showReferralMenu(ctx);
  }

  @Action('referral_system')
  async showReferralMenu(@Ctx() ctx: TelegramContext): Promise<void> {
    try {
      const userId = ctx.from?.id;
      const isUserIdMissing = userId === undefined || userId === null;
      if (isUserIdMissing === true) return;

      const message = `💰 <b>РЕФЕРАЛЬНАЯ СИСТЕМА</b>

🎯 <b>Как это работает:</b>
• Приглашайте друзей по своей реферальной ссылке
• Получайте бонусы с их покупок
• Трехуровневая система начислений

📊 <b>Ваша статистика:</b>
• Уровень 1: 10% с покупок прямых рефералов
• Уровень 2: 5% с покупок рефералов ваших рефералов  
• Уровень 3: 2% с покупок рефералов 3-го уровня

💡 <b>Выберите действие:</b>`;

      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: this.keyboardsService.referralSystem().reply_markup,
      });
    } catch (error) {
      this.logger.error('Ошибка показа меню реферальной системы:', error);
    }
  }

  @Action('referral_stats')
  async showReferralStats(@Ctx() ctx: TelegramContext): Promise<void> {
    try {
      const userId = ctx.from?.id;
      const isUserIdMissingForStats = userId === undefined || userId === null;
      if (isUserIdMissingForStats === true) return;

      // Получаем ID пользователя из базы данных
      const userResult = await this.getUserFromDatabase(userId);
      const isUserResultMissing = userResult === undefined || userResult === null;
      if (isUserResultMissing === true) {
        await ctx.answerCbQuery('❌ Пользователь не найден в базе данных');
        return;
      }

      const statsResult = await this.referralsService.getReferralStats(userResult.id);

      const isStatsMissing =
        statsResult.referralStats === undefined || statsResult.referralStats === null;
      if (isStatsMissing === true) {
        await ctx.answerCbQuery('❌ Ошибка получения статистики');
        return;
      }

      const stats = statsResult.referralStats;
      const message = `📊 <b>ВАША СТАТИСТИКА РЕФЕРАЛОВ</b>

👥 <b>Общее количество рефералов:</b> ${stats.total_referrals}

📈 <b>По уровням:</b>
• 1️⃣ Уровень: ${stats.level_1_referrals} рефералов
• 2️⃣ Уровень: ${stats.level_2_referrals} рефералов  
• 3️⃣ Уровень: ${stats.level_3_referrals} рефералов

💰 <b>Общий заработок:</b> ${stats.total_earned.toFixed(2)} ₽

🔄 <b>Последнее обновление:</b> ${new Date(stats.last_updated).toLocaleString('ru-RU')}`;

      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: this.keyboardsService.referralStats().reply_markup,
      });
    } catch (error) {
      this.logger.error('Ошибка показа статистики рефералов:', error);
      await ctx.answerCbQuery('❌ Ошибка получения статистики');
    }
  }

  @Action('referral_link')
  async showReferralLink(@Ctx() ctx: TelegramContext): Promise<void> {
    try {
      const userId = ctx.from?.id;
      const isUserIdMissingForLink = userId === undefined || userId === null;
      if (isUserIdMissingForLink === true) return;

      // Получаем ID пользователя из базы данных
      const userResult = await this.getUserFromDatabase(userId);
      const isUserResultMissingForLink = userResult === undefined || userResult === null;
      if (isUserResultMissingForLink === true) {
        await ctx.answerCbQuery('❌ Пользователь не найден в базе данных');
        return;
      }

      // Получаем username бота из контекста
      const botUsername = ctx.botInfo?.username || 'your_bot';
      const referralLink = await this.referralsService.createReferralLink(
        userResult.id,
        botUsername
      );

      const message = `🔗 <b>ВАША РЕФЕРАЛЬНАЯ ССЫЛКА</b>

${referralLink}

📋 <b>Как использовать:</b>
1. Поделитесь этой ссылкой с друзьями
2. Когда они перейдут по ссылке и зарегистрируются
3. Вы будете получать бонусы с их покупок

💡 <b>Совет:</b> Чем больше людей пригласите, тем больше заработаете!`;

      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: this.keyboardsService.referralSystem().reply_markup,
      });
    } catch (error) {
      this.logger.error('Ошибка показа реферальной ссылки:', error);
      await ctx.answerCbQuery('❌ Ошибка получения ссылки');
    }
  }

  @Action('referral_list')
  async showReferralListMenu(@Ctx() ctx: TelegramContext): Promise<void> {
    try {
      const message = `👥 <b>МОИ РЕФЕРАЛЫ</b>

Выберите уровень для просмотра списка ваших рефералов:

• 1️⃣ <b>Уровень 1</b> - прямые рефералы (10% бонус)
• 2️⃣ <b>Уровень 2</b> - рефералы ваших рефералов (5% бонус)  
• 3️⃣ <b>Уровень 3</b> - рефералы 3-го уровня (2% бонус)
• 👥 <b>Все рефералы</b> - полный список`;

      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: this.keyboardsService.referralList().reply_markup,
      });
    } catch (error) {
      this.logger.error('Ошибка показа меню списка рефералов:', error);
    }
  }

  @Action(/referral_list_level_(\d+)/)
  async showReferralListByLevel(@Ctx() ctx: TelegramContext): Promise<void> {
    try {
      const userId = ctx.from?.id;
      const isUserIdMissingForLevel = userId === undefined || userId === null;
      if (isUserIdMissingForLevel === true) return;

      const match = (ctx.callbackQuery as any)?.data?.match(/referral_list_level_(\d+)/);
      const isNoMatch = match === undefined || match === null;
      if (isNoMatch === true) return;

      const level = parseInt(match[1]);

      // Получаем ID пользователя из базы данных
      const userResult = await this.getUserFromDatabase(userId);
      const isUserResultMissingForLevel = userResult === undefined || userResult === null;
      if (isUserResultMissingForLevel === true) {
        await ctx.answerCbQuery('❌ Пользователь не найден в базе данных');
        return;
      }

      const referrals = await this.referralsService.getUserReferrals(userResult.id, level);

      let message = `👥 <b>РЕФЕРАЛЫ ${level}-ГО УРОВНЯ</b>\n\n`;

      if (referrals.length === 0) {
        message += '😔 Пока нет рефералов на этом уровне';
      } else {
        referrals.forEach((ref, index) => {
          const name =
            (ref as any).first_name + ((ref as any).last_name ? ` ${(ref as any).last_name}` : '');
          const username = (ref as any).username ? ` (@${(ref as any).username})` : '';
          const date = new Date(ref.created_at).toLocaleDateString('ru-RU');
          message += `${index + 1}. ${name}${username}\n   📅 ${date}\n\n`;
        });
      }

      message += `\n🔙 <b>Назад к выбору уровня</b>`;

      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: this.keyboardsService.referralList().reply_markup,
      });
    } catch (error) {
      this.logger.error('Ошибка показа списка рефералов по уровню:', error);
      await ctx.answerCbQuery('❌ Ошибка получения списка');
    }
  }

  @Action('referral_list_all')
  async showAllReferrals(@Ctx() ctx: TelegramContext): Promise<void> {
    try {
      const userId = ctx.from?.id;
      const isUserIdMissingForAll = userId === undefined || userId === null;
      if (isUserIdMissingForAll === true) return;

      // Получаем ID пользователя из базы данных
      const userResult = await this.getUserFromDatabase(userId);
      const isUserResultMissingForAll = userResult === undefined || userResult === null;
      if (isUserResultMissingForAll === true) {
        await ctx.answerCbQuery('❌ Пользователь не найден в базе данных');
        return;
      }

      const referrals = await this.referralsService.getUserReferrals(userResult.id);

      let message = `👥 <b>ВСЕ МОИ РЕФЕРАЛЫ</b>\n\n`;

      if (referrals.length === 0) {
        message += '😔 Пока нет рефералов';
      } else {
        // Группируем по уровням
        const byLevel = referrals.reduce(
          (acc, ref) => {
            const isLevelGroupMissing = acc[ref.level] === undefined || acc[ref.level] === null;
            if (isLevelGroupMissing === true) acc[ref.level] = [];
            acc[ref.level].push(ref);
            return acc;
          },
          {} as Record<number, any[]>
        );

        for (const level of [1, 2, 3]) {
          if (byLevel[level]) {
            message += `\n${level}️⃣ <b>Уровень ${level}:</b>\n`;
            byLevel[level].forEach((ref, index) => {
              const name = ref.first_name + (ref.last_name ? ` ${ref.last_name}` : '');
              const username = ref.username ? ` (@${ref.username})` : '';
              const date = new Date(ref.created_at).toLocaleDateString('ru-RU');
              message += `${index + 1}. ${name}${username} - ${date}\n`;
            });
          }
        }
      }

      message += `\n🔙 <b>Назад к выбору уровня</b>`;

      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: this.keyboardsService.referralList().reply_markup,
      });
    } catch (error) {
      this.logger.error('Ошибка показа всех рефералов:', error);
      await ctx.answerCbQuery('❌ Ошибка получения списка');
    }
  }

  @Action('referral_payments')
  async showReferralPayments(@Ctx() ctx: TelegramContext): Promise<void> {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;

      // Получаем ID пользователя из базы данных
      const userResult = await this.getUserFromDatabase(userId);
      if (!userResult) {
        await ctx.answerCbQuery('❌ Пользователь не найден в базе данных');
        return;
      }

      const payments = await this.referralsService.getUserPayments(userResult.id);

      let message = `💰 <b>ИСТОРИЯ НАЧИСЛЕНИЙ</b>\n\n`;

      if (payments.length === 0) {
        message += '😔 Пока нет начислений';
      } else {
        payments.slice(0, 10).forEach((payment, index) => {
          const payerName =
            (payment as any).first_name +
            ((payment as any).last_name ? ` ${(payment as any).last_name}` : '');
          const payerUsername = (payment as any).username ? ` (@${(payment as any).username})` : '';
          const date = new Date(payment.created_at).toLocaleDateString('ru-RU');
          const status =
            payment.status === 'paid' ? '✅' : payment.status === 'pending' ? '⏳' : '❌';

          message += `${index + 1}. ${status} ${payment.amount.toFixed(2)} ₽\n`;
          message += `   👤 ${payerName}${payerUsername}\n`;
          message += `   📊 Уровень ${payment.level} (${payment.bonus_value}%)\n`;
          message += `   📅 ${date}\n\n`;
        });

        if (payments.length > 10) {
          message += `... и еще ${payments.length - 10} начислений`;
        }
      }

      message += `\n🔙 <b>Назад к реферальной системе</b>`;

      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: this.keyboardsService.referralSystem().reply_markup,
      });
    } catch (error) {
      this.logger.error('Ошибка показа истории начислений:', error);
      await ctx.answerCbQuery('❌ Ошибка получения истории');
    }
  }

  @Action('referral_info')
  async showReferralInfo(@Ctx() ctx: TelegramContext): Promise<void> {
    try {
      const message = `ℹ️ <b>КАК РАБОТАЕТ РЕФЕРАЛЬНАЯ СИСТЕМА</b>

🎯 <b>Основные принципы:</b>
• Приглашайте друзей по своей реферальной ссылке
• Получайте бонусы с их покупок
• Трехуровневая система начислений

📊 <b>Уровни и проценты:</b>
• 1️⃣ <b>Уровень 1:</b> 10% с покупок прямых рефералов
• 2️⃣ <b>Уровень 2:</b> 5% с покупок рефералов ваших рефералов
• 3️⃣ <b>Уровень 3:</b> 2% с покупок рефералов 3-го уровня

💰 <b>Как получить бонусы:</b>
1. Поделитесь своей реферальной ссылкой
2. Друг переходит по ссылке и регистрируется
3. Когда друг совершает покупку
4. Вы автоматически получаете бонус

⏰ <b>Когда начисляются бонусы:</b>
• Только после успешной оплаты
• Начисления происходят автоматически
• Статистика обновляется в реальном времени

💡 <b>Советы:</b>
• Чем больше людей пригласите, тем больше заработаете
• Рефералы ваших рефералов тоже приносят доход
• Система работает на 3 уровня вглубь`;

      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: this.keyboardsService.referralSystem().reply_markup,
      });
    } catch (error) {
      this.logger.error('Ошибка показа информации о реферальной системе:', error);
    }
  }

  @Action('main_menu')
  async backToMainMenu(@Ctx() ctx: TelegramContext): Promise<void> {
    try {
      await (ctx as any).scene.leave();
      // Здесь должен быть вызов главного меню
      // await this.menuService.sendMainMenu(ctx);
    } catch (error) {
      this.logger.error('Ошибка возврата в главное меню:', error);
    }
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
