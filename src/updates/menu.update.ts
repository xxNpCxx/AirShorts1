import { Action, Ctx, Hears, Update } from 'nestjs-telegraf';
import { Markup } from 'telegraf';

type TelegramContext = {
  answerCbQuery: () => Promise<void>;
  reply: (text: string, options?: { parse_mode?: string; reply_markup?: unknown }) => Promise<void>;
};

@Update()
export class MenuUpdate {
  @Action('support')
  async supportAction(@Ctx() ctx: TelegramContext) {
    await ctx.answerCbQuery();
    return this.support(ctx);
  }

  @Hears('🆘 Поддержка оператора')
  async support(@Ctx() ctx: TelegramContext) {
    const username = (process.env.OPERATOR_USERNAME || '').replace('@', '');
    const url = username ? `https://t.me/${username}` : 'https://t.me/';
    await ctx.reply(
      'Связь с оператором:',
      Markup.inlineKeyboard([Markup.button.url('Написать оператору', url)])
    );
  }

  @Action('rules')
  async rulesAction(@Ctx() ctx: TelegramContext) {
    await ctx.answerCbQuery();
    return this.rules(ctx);
  }

  @Hears('📜 Правила')
  async rules(@Ctx() ctx: TelegramContext) {
    await ctx.reply(
      `📌 Правила пользования обменным сервисом

🔒 1. Безопасность и законность
Запрещено использовать услуги обменника для незаконных переводов или мошеннических действий.
При подозрении в нарушении закона, клиент обязан предоставить удостоверяющие личность документы.

⚖️ 2. Право на отказ
Администрация обменника вправе отказать в выполнении заявки без объяснения причин. Это правило действует в отношении любого клиента.

🚫 3. Строгие запреты
Запрещается:
• переводы по номеру 900
• оплата через банкоматы и терминалы
• разбивка суммы на 2 и более перевода без согласования

🛡 4. Антифрод-система
Для борьбы с противоправной деятельностью используется автоматизированная система анализа транзакций и поведения пользователей, блокирующая подозрительные операции.

⚠️ 5. Отправка криптовалют
Мы используем сторонние ресурсы для отправки BTC, LTC. Не рекомендуем пополнять биржевые аккаунты — возможна блокировка из-за высокого AML.
Рекомендуемые кошельки: Electrum, Exodus, Ledger, Trust Wallet и др.
Обменник не несёт ответственности за последствия отправки на биржи.

📵 6. Контакт с получателем ЗАПРЕЩЁН
Категорически запрещено звонить или писать получателю перевода.
За нарушение — пожизненный бан во всех наших ботах.

🔔 Соблюдение правил — гарантия вашей безопасности и стабильной работы обменника.
📲 При вопросах — обращайтесь к оператору.`,
      { parse_mode: 'Markdown' }
    );
  }
}
