import { Injectable } from '@nestjs/common';
import { Markup } from 'telegraf';

@Injectable()
export class KeyboardsService {
  mainReply(): ReturnType<typeof Markup.keyboard> {
    return Markup.keyboard([['🏠 Главное меню']])
      .resize()
      .persistent();
  }

  mainInline(newsChannel?: string): ReturnType<typeof Markup.inlineKeyboard> {
    const rows = [
      [Markup.button.callback('🎬 Создать видео', 'create_video')],
      [Markup.button.callback('💳 Оплата', 'payment_menu')],
      [Markup.button.callback('💰 Реферальная система', 'referral_system')],
      [Markup.button.callback('🆘 Поддержка оператора', 'support')],
      [Markup.button.callback('📜 Правила', 'rules')],
      [Markup.button.url('📰 Новостной канал', newsChannel || 'https://t.me/')],
      [Markup.button.url('⭐️ Отзывы', 'https://t.me/review413n_obmen')],
    ];
    return Markup.inlineKeyboard(rows);
  }


  referralSystem(): ReturnType<typeof Markup.inlineKeyboard> {
    return Markup.inlineKeyboard([
      [Markup.button.callback('📊 Моя статистика', 'referral_stats')],
      [Markup.button.callback('🔗 Моя реферальная ссылка', 'referral_link')],
      [Markup.button.callback('👥 Мои рефералы', 'referral_list')],
      [Markup.button.callback('💰 История начислений', 'referral_payments')],
      [Markup.button.callback('ℹ️ Как это работает', 'referral_info')],
      [Markup.button.callback('🔙 Назад в меню', 'main_menu')],
    ]);
  }

  referralStats(): ReturnType<typeof Markup.inlineKeyboard> {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Обновить', 'referral_stats')],
      [Markup.button.callback('🔙 Назад к рефералам', 'referral_system')],
    ]);
  }

  referralList(): ReturnType<typeof Markup.inlineKeyboard> {
    return Markup.inlineKeyboard([
      [Markup.button.callback('1️⃣ Уровень 1', 'referral_list_level_1')],
      [Markup.button.callback('2️⃣ Уровень 2', 'referral_list_level_2')],
      [Markup.button.callback('3️⃣ Уровень 3', 'referral_list_level_3')],
      [Markup.button.callback('👥 Все рефералы', 'referral_list_all')],
      [Markup.button.callback('🔙 Назад к рефералам', 'referral_system')],
    ]);
  }

  paymentMenu(): ReturnType<typeof Markup.inlineKeyboard> {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🎬 Полное видео с голосом (75₽)', 'payment_full_video')],
      [Markup.button.callback('🎵 Только аудио (25₽)', 'payment_audio_only')],
      [Markup.button.callback('💳 Кастомная сумма', 'payment_custom')],
      [Markup.button.callback('🔙 Назад в меню', 'main_menu')],
    ]);
  }

  paymentCustom(): ReturnType<typeof Markup.inlineKeyboard> {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🔙 Назад к оплате', 'payment_menu')],
    ]);
  }

  paymentProcessing(): ReturnType<typeof Markup.inlineKeyboard> {
    return Markup.inlineKeyboard([
      [Markup.button.callback('⏳ Обработка...', 'payment_processing', { disabled: true })],
    ]);
  }

  paymentSuccess(): ReturnType<typeof Markup.inlineKeyboard> {
    return Markup.inlineKeyboard([
      [Markup.button.callback('💰 Реферальная система', 'referral_system')],
      [Markup.button.callback('🏠 Главное меню', 'main_menu')],
    ]);
  }

  paymentError(): ReturnType<typeof Markup.inlineKeyboard> {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Попробовать снова', 'payment_retry')],
      [Markup.button.callback('🔙 Назад к оплате', 'payment_menu')],
    ]);
  }

  adminReferralMenu(): ReturnType<typeof Markup.inlineKeyboard> {
    return Markup.inlineKeyboard([
      [Markup.button.callback('📊 Общая статистика', 'admin_referral_stats')],
      [Markup.button.callback('💰 Все начисления', 'admin_referral_payments')],
      [Markup.button.callback('🏆 Топ рефералов', 'admin_referral_top')],
      [Markup.button.callback('⚙️ Настройки', 'admin_referral_settings')],
      [Markup.button.callback('🔙 Назад в меню', 'main_menu')],
    ]);
  }

  adminReferralStats(): ReturnType<typeof Markup.inlineKeyboard> {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Обновить', 'admin_referral_stats')],
      [Markup.button.callback('🔙 Назад к админ-панели', 'admin_referral_menu')],
    ]);
  }

  adminReferralSettings(): ReturnType<typeof Markup.inlineKeyboard> {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🔙 Назад к админ-панели', 'admin_referral_menu')],
    ]);
  }

  adminMainMenu(): ReturnType<typeof Markup.inlineKeyboard> {
    return Markup.inlineKeyboard([
      [Markup.button.callback('💰 Реферальная система', 'admin_referral_menu')],
      [Markup.button.callback('📊 Общая статистика', 'admin_stats')],
      [Markup.button.callback('👥 Пользователи', 'admin_users')],
      [Markup.button.callback('🔙 Главное меню', 'main_menu')],
    ]);
  }
}
