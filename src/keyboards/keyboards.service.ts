import { Injectable } from "@nestjs/common";
import { Markup } from "telegraf";

@Injectable()
export class KeyboardsService {
  mainReply() {
    return Markup.keyboard([["🏠 Главное меню"]])
      .resize()
      .persistent();
  }

  mainInline(newsChannel?: string) {
    const rows = [
      [Markup.button.callback("🎬 Создать видео", "create_video")],
      [Markup.button.callback("⚙️ Настройки сервиса", "service_settings")],
      [Markup.button.callback("🆘 Поддержка оператора", "support")],
      [Markup.button.callback("📜 Правила", "rules")],
      [Markup.button.url("📰 Новостной канал", newsChannel || "https://t.me/")],
      [Markup.button.url("⭐️ Отзывы", "https://t.me/review413n_obmen")],
    ];
    return Markup.inlineKeyboard(rows);
  }

  serviceSettings() {
    return Markup.inlineKeyboard([
      [Markup.button.callback("🤖 ИИ-Аватар (D-ID)", "set_service_did")],
      [Markup.button.callback("👤 Цифровой двойник (HeyGen)", "set_service_heygen")],
      [Markup.button.callback("🔙 Назад в меню", "main_menu")],
    ]);
  }
}
