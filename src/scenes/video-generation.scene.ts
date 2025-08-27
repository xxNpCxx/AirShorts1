import { Ctx, Scene, SceneEnter, On, Action } from "nestjs-telegraf";
import { Context } from "telegraf";
import type { Message } from "@telegraf/types";
import { DidService } from "../d-id/did.service";
import { Logger } from "@nestjs/common";

interface SessionData {
  photoFileId?: string;
  audioFileId?: string;
  script?: string;
  platform?: "youtube-shorts";
  duration?: number;
  quality?: "720p" | "1080p";
  textPrompt?: string;
}

// Типы для разных контекстов
type PhotoContext = Context & {
  message: Message.PhotoMessage;
  session?: SessionData;
};

type VoiceContext = Context & {
  message: Message.VoiceMessage;
  session?: SessionData;
};

type TextContext = Context & {
  message: Message.TextMessage;
  session?: SessionData;
};

@Scene("video-generation")
export class VideoGenerationScene {
  private readonly logger = new Logger(VideoGenerationScene.name);

  constructor(private readonly didService: DidService) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: Context) {
    await ctx.reply(
      "🎬 Добро пожаловать в генератор видео!\n\n" +
        "Для создания видео мне понадобится:\n" +
        "1. 📸 Фото с человеком\n" +
        "2. 🎵 Голосовая запись (до 1 минуты)\n" +
        "3. 📝 Сценарий ролика\n" +
        "4. ⚙️ Настройки видео\n\n" +
        "📸 **Требования к фото:**\n" +
        "• Один человек в кадре (лицо хорошо видно)\n" +
        "• Размер: до 10 МБ\n" +
        "• Формат: JPG, PNG, WebP\n" +
        "• Разрешение: минимум 512x512 пикселей\n" +
        "• Хорошее освещение, четкость\n" +
        "• Лицо смотрит прямо в камеру\n" +
        "• ⚠️ ВАЖНО: отправьте как ФОТО, а не как файл!\n\n" +
        "💡 **Рекомендации:**\n" +
        "• Портретная ориентация (9:16)\n" +
        "• Лицо занимает 30-50% кадра\n" +
        "• Нейтральное выражение лица\n" +
        "• Минимум фона и отвлекающих элементов\n\n" +
        "Отправьте фото:",
    );
  }

  @On("photo")
  async onPhoto(@Ctx() ctx: PhotoContext) {
    try {
      const photo = ctx.message?.photo;
      if (!photo || photo.length === 0) {
        await ctx.reply("❌ Не удалось получить фото. Попробуйте еще раз.");
        return;
      }

      // Берем фото наилучшего качества (последнее в массиве)
      const bestPhoto = photo[photo.length - 1];
      const photoFileId = bestPhoto.file_id;

      // Валидация размера фото
      if (bestPhoto.file_size && bestPhoto.file_size > 10 * 1024 * 1024) { // 10 МБ
        await ctx.reply(
          "❌ Фото слишком большое! Максимальный размер: 10 МБ\n\n" +
          "💡 Попробуйте:\n" +
          "• Сжать фото в настройках камеры\n" +
          "• Использовать другое фото\n" +
          "• Отправить как файл и выбрать сжатие"
        );
        return;
      }

      // Валидация разрешения
      if (bestPhoto.width && bestPhoto.height) {
        if (bestPhoto.width < 512 || bestPhoto.height < 512) {
          await ctx.reply(
            "❌ Разрешение фото слишком низкое!\n" +
            `Текущее: ${bestPhoto.width}x${bestPhoto.height}\n` +
            "Минимум: 512x512 пикселей\n\n" +
            "Отправьте фото лучшего качества."
          );
          return;
        }

        // Проверка соотношения сторон (рекомендация)
        const aspectRatio = bestPhoto.height / bestPhoto.width;
        if (aspectRatio < 1.5) {
          await ctx.reply(
            "⚠️ Фото принято, но рекомендуется портретная ориентация!\n\n" +
            `Текущее соотношение: ${bestPhoto.width}x${bestPhoto.height}\n` +
            "Рекомендуется: 9:16 (например, 1080x1920)\n\n" +
            "Для лучшего результата используйте вертикальное фото."
          );
        }
      }

      // Получаем информацию о файле для дополнительной валидации
      try {
        const file = await ctx.telegram.getFile(photoFileId);
        if (file.file_path) {
          const fileExtension = file.file_path.split('.').pop()?.toLowerCase();
          const allowedFormats = ['jpg', 'jpeg', 'png', 'webp'];
          
          if (!fileExtension || !allowedFormats.includes(fileExtension)) {
            await ctx.reply(
              "❌ Неподдерживаемый формат файла!\n\n" +
              `Обнаружен: ${fileExtension || 'неизвестный'}\n` +
              "Поддерживаются: JPG, PNG, WebP\n\n" +
              "Отправьте фото в поддерживаемом формате."
            );
            return;
          }
        }
      } catch (fileError) {
        this.logger.warn("Could not validate file format:", fileError);
        // Продолжаем, так как это не критичная ошибка
      }

      // Сохраняем ID фото в сессии
      (ctx.session as SessionData).photoFileId = photoFileId;

      await ctx.reply(
        "✅ Фото принято и прошло валидацию!\n\n" +
        `📊 Информация:\n` +
        `• Разрешение: ${bestPhoto.width || '?'}x${bestPhoto.height || '?'}\n` +
        `• Размер: ${bestPhoto.file_size ? Math.round(bestPhoto.file_size / 1024) + ' КБ' : 'неизвестен'}\n\n` +
        "🎵 Теперь отправьте голосовую запись (до 1 минуты):"
      );
    } catch (error) {
      this.logger.error("Error processing photo:", error);
      await ctx.reply("❌ Ошибка при обработке фото. Попробуйте еще раз.");
    }
  }

  @On("document")
  async onDocument(@Ctx() ctx: Context) {
    try {
      const message = ctx.message;
      if (message && "document" in message && message.document) {
        const document = message.document;
        
        // Проверяем, является ли документ изображением
        const isImage = document.mime_type && (
          document.mime_type.startsWith("image/") ||
          ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(document.mime_type)
        );
        
        if (isImage) {
          await ctx.reply(
            "📸 Обнаружено изображение, отправленное как файл!\n\n" +
            "❌ Пожалуйста, отправьте фото как изображение, а не как документ.\n\n" +
            "💡 Как правильно отправить:\n" +
            "• Нажмите на значок 📎 (скрепка)\n" +
            "• Выберите 'Фото или видео'\n" +
            "• Выберите фото из галереи\n" +
            "• НЕ нажимайте 'Отправить как файл'\n\n" +
            "🔄 Попробуйте отправить фото заново:"
          );
        } else {
          await ctx.reply(
            "❌ Документы не поддерживаются.\n\n" +
            "📸 Пожалуйста, отправьте фото с человеком."
          );
        }
      }
    } catch (error) {
      this.logger.error("Error processing document:", error);
      await ctx.reply("❌ Ошибка при обработке файла. Отправьте фото как изображение.");
    }
  }

  @On("video")
  async onVideo(@Ctx() ctx: Context) {
    await ctx.reply(
      "🎥 Видео не поддерживается.\n\n" +
      "📸 Пожалуйста, отправьте фото с человеком (как изображение)."
    );
  }

  @On("audio")
  async onAudio(@Ctx() ctx: Context) {
    await ctx.reply(
      "🎵 Обычные аудиофайлы не поддерживаются.\n\n" +
      "🎤 Пожалуйста, отправьте голосовое сообщение (удерживайте кнопку микрофона)."
    );
  }

  @On("voice")
  async onVoice(@Ctx() ctx: VoiceContext) {
    try {
      const voice = ctx.message?.voice;
      if (!voice) {
        await ctx.reply(
          "❌ Не удалось получить голосовую запись. Попробуйте еще раз.",
        );
        return;
      }

      // Проверяем длительность (максимум 60 секунд)
      if (voice.duration > 60) {
        await ctx.reply(
          "❌ Голосовая запись слишком длинная. Максимум 60 секунд.",
        );
        return;
      }

      (ctx.session as SessionData).audioFileId = voice.file_id;

      await ctx.reply(
        "✅ Голосовая запись получена! Теперь отправьте сценарий ролика текстом:",
      );
    } catch (error) {
      this.logger.error("Error processing voice:", error);
      await ctx.reply(
        "❌ Ошибка при обработке голосовой записи. Попробуйте еще раз.",
      );
    }
  }

  @On("text")
  async onText(@Ctx() ctx: TextContext) {
    try {
      const text = ctx.message?.text;
      if (!text) {
        await ctx.reply("❌ Не удалось получить текст. Попробуйте еще раз.");
        return;
      }

      const session = ctx.session as SessionData;

      if (!session.script) {
        // Первый текстовый ввод - это сценарий
        session.script = text;
        await this.showPlatformSelection(ctx);
      } else if (!session.duration) {
        // Второй текстовый ввод - это длительность (платформа выбирается через inline кнопки)
        const duration = parseInt(text);
        if (isNaN(duration) || duration < 15 || duration > 60) {
          await ctx.reply(
            "❌ Длительность должна быть от 15 до 60 секунд. Попробуйте еще раз.",
          );
          return;
        }
        session.duration = duration;
        await this.showQualitySelection(ctx);
      } else if (!session.quality) {
        // Третий текстовый ввод - это качество
        if (
          text.toLowerCase().includes("720") ||
          text.toLowerCase().includes("720p")
        ) {
          session.quality = "720p";
        } else if (
          text.toLowerCase().includes("1080") ||
          text.toLowerCase().includes("1080p")
        ) {
          session.quality = "720p";
        } else {
          await ctx.reply("❌ Выберите качество: 720p или 1080p");
          return;
        }

        await this.showTextPromptInput(ctx);
      } else if (!session.textPrompt) {
        // Четвертый текстовый ввод - это текстовый промпт
        session.textPrompt = text;
        await this.startVideoGeneration(ctx);
      }
    } catch (error) {
      this.logger.error("Error processing text:", error);
      await ctx.reply("❌ Ошибка при обработке текста. Попробуйте еще раз.");
    }
  }

  private async showPlatformSelection(@Ctx() ctx: Context) {
    await ctx.reply(
      "✅ Сценарий получен! Теперь выберите платформу:",
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "📱 Короткие вертикальные видео", callback_data: "platform_youtube_shorts" }
            ],
            [
              { text: "📺 Социальные сети (скоро)", callback_data: "platform_tiktok" }
            ],
            [
              { text: "📸 Истории и рилс (скоро)", callback_data: "platform_instagram_reels" }
            ],
            [
              { text: "❌ Отмена", callback_data: "cancel_video_generation" }
            ]
          ]
        }
      }
    );
  }

  private async showDurationSelection(@Ctx() ctx: Context) {
    await ctx.reply(
      "✅ Платформа выбрана! Теперь укажите длительность видео в секундах:\n\n" +
        "📏 От 15 до 60 секунд (рекомендуется 15-30 для Shorts)\n\n" +
        "Введите число секунд:",
    );
  }

  private async showQualitySelection(@Ctx() ctx: Context) {
    await ctx.reply(
      "✅ Длительность выбрана! Теперь выберите качество видео:\n\n" +
        "🎥 720p - быстрее, меньше места\n" +
        "🎥 1080p - лучше качество, больше места\n\n" +
        'Напишите "720p" или "1080p":',
    );
  }

  private async showTextPromptInput(@Ctx() ctx: Context) {
    await ctx.reply(
      "✅ Качество выбрано! Теперь добавьте текстовый промпт для улучшения генерации:\n\n" +
        '💡 Например: "Создай видео с динамичными движениями и яркими переходами"\n\n' +
        'Или просто напишите "нет" если промпт не нужен:',
    );
  }

  private async startVideoGeneration(@Ctx() ctx: Context) {
    try {
      const session = (ctx as unknown as { session: SessionData }).session;

      await ctx.reply(
        "🚀 Начинаю генерацию видео...\n\n" +
          "Это может занять несколько минут. Пожалуйста, подождите.",
      );

      // Получаем URL файлов из Telegram
      let photoUrl = "";
      let audioUrl = "";

      if (session.photoFileId) {
        try {
          const photoFile = await ctx.telegram.getFile(session.photoFileId);
          if (photoFile.file_path) {
            photoUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${photoFile.file_path}`;
          }
        } catch (error) {
          this.logger.error("Error getting photo URL:", error);
          await ctx.reply("❌ Ошибка получения фото. Попробуйте загрузить фото заново.");
          return;
        }
      }

      if (session.audioFileId) {
        try {
          const audioFile = await ctx.telegram.getFile(session.audioFileId);
          if (audioFile.file_path) {
            audioUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${audioFile.file_path}`;
          }
        } catch (error) {
          this.logger.error("Error getting audio URL:", error);
          await ctx.reply("❌ Ошибка получения аудио. Попробуйте загрузить аудио заново.");
          return;
        }
      }

      const request = {
        photoUrl: photoUrl,
        audioUrl: audioUrl,
        script: session.script || "",
        platform: session.platform || "youtube-shorts",
        duration: session.duration || 30,
        quality: session.quality || "720p",
        textPrompt: session.textPrompt,
      };

      this.logger.log(`Starting D-ID generation with photoUrl: ${photoUrl ? 'PROVIDED' : 'MISSING'}, audioUrl: ${audioUrl ? 'PROVIDED' : 'MISSING'}`);
      
      const result = await this.didService.generateVideo(request);

      await ctx.reply(
        "✅ Видео успешно создано!\n\n" +
          `🆔 ID: ${result.id}\n` +
          `📊 Статус: ${result.status}\n\n` +
          "Видео будет готово через несколько минут. " +
          "Вы получите уведомление когда оно будет готово.",
      );

      // Возвращаемся в главное меню
      await (ctx as { scene?: { leave: () => Promise<void> } }).scene?.leave();
    } catch (error) {
      this.logger.error("Error starting video generation:", error);
      await ctx.reply(
        `❌ Ошибка при создании видео:\n${(error as Error).message}\n\n` +
          `Попробуйте еще раз или обратитесь к администратору.`,
      );
    }
  }

  @Action("platform_youtube_shorts")
  async onYouTubeShortsSelected(@Ctx() ctx: Context) {
    try {
      await ctx.answerCbQuery();
      const session = (ctx as unknown as { session: SessionData }).session;
      session.platform = "youtube-shorts";
      
      await ctx.editMessageText(
        "✅ Платформа выбрана: Короткие вертикальные видео"
      );
      
      await this.showDurationSelection(ctx);
    } catch (error) {
      this.logger.error("Error selecting YouTube Shorts:", error);
      await ctx.answerCbQuery("❌ Ошибка выбора платформы");
    }
  }

  @Action("platform_tiktok")
  async onTikTokSelected(@Ctx() ctx: Context) {
    try {
      await ctx.answerCbQuery("❌ Эта платформа пока не поддерживается");
    } catch (error) {
      this.logger.error("Error selecting TikTok:", error);
    }
  }

  @Action("platform_instagram_reels")
  async onInstagramReelsSelected(@Ctx() ctx: Context) {
    try {
      await ctx.answerCbQuery("❌ Эта платформа пока не поддерживается");
    } catch (error) {
      this.logger.error("Error selecting Instagram Reels:", error);
    }
  }

  @Action("cancel_video_generation")
  async onCancelVideoGeneration(@Ctx() ctx: Context) {
    try {
      await ctx.answerCbQuery();
      await ctx.editMessageText("❌ Создание видео отменено.");
      await (ctx as { scene?: { leave: () => Promise<void> } }).scene?.leave();
    } catch (error) {
      this.logger.error("Error canceling video generation:", error);
      await ctx.answerCbQuery("❌ Ошибка отмены");
    }
  }

  @Action("cancel")
  async onCancel(@Ctx() ctx: Context) {
    await ctx.reply("❌ Создание видео отменено.");
    await (ctx as { scene?: { leave: () => Promise<void> } }).scene?.leave();
  }
}
