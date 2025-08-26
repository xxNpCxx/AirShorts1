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
      [Markup.button.callback("🆘 Поддержка оператора", "support")],
      [Markup.button.callback("📜 Правила", "rules")],
      [Markup.button.url("📰 Новостной канал", newsChannel || "https://t.me/")],
      [Markup.button.url("⭐️ Отзывы", "https://t.me/review413n_obmen")],
    ];
    return Markup.inlineKeyboard(rows);
  }
}
