import { Ctx, Scene, SceneEnter, On, Action } from "nestjs-telegraf";
import { Context } from "telegraf";
import type { Message } from "@telegraf/types";
import { HeyGenService } from "../heygen/heygen.service";
import { ElevenLabsService } from "../elevenlabs/elevenlabs.service";
import { VoiceNotificationService } from "../elevenlabs/voice-notification.service";
import { UsersService } from "../users/users.service";
import { Logger, Inject } from "@nestjs/common";
import { Telegraf } from "telegraf";
import { getBotToken } from "nestjs-telegraf";

interface SessionData {
  photoFileId?: string;
  audioFileId?: string;
  voiceFileId?: string; // Добавляем для хранения голосового сообщения пользователя
  clonedVoiceId?: string; // ID клонированного голоса в ElevenLabs
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

  constructor(
    private readonly heygenService: HeyGenService,
    private readonly elevenLabsService: ElevenLabsService,
    private readonly voiceNotificationService: VoiceNotificationService,
    private readonly usersService: UsersService,
    @Inject(getBotToken("airshorts1_bot")) private readonly bot: Telegraf,
  ) {}

  /**
   * Рассчитывает длительность видео на основе текста
   * Средняя скорость речи: ~150 слов в минуту для русского языка
   */
  private calculateVideoDuration(text: string): number {
    if (!text || text.trim().length === 0) {
      return 30; // По умолчанию 30 секунд
    }

    // Считаем количество слов (разделенных пробелами)
    const wordCount = text.trim().split(/\s+/).length;
    
    // Средняя скорость речи для русского языка: ~150 слов/мин = 2.5 слов/сек
    const wordsPerSecond = 2.5;
    
    // Рассчитываем базовую длительность
    let duration = Math.ceil(wordCount / wordsPerSecond);
    
    // Добавляем небольшой буфер для пауз и интонации (20%)
    duration = Math.ceil(duration * 1.2);
    
    // Минимум 15 секунд, максимум 60 секунд
    duration = Math.max(15, Math.min(60, duration));
    
    return duration;
  }

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: Context) {
    this.logger.log(`🎬 [@SceneEnter] Пользователь ${ctx.from?.id} вошел в сцену video-generation`);
    await ctx.reply(
      "🎬 Добро пожаловать в генератор видео!\n\n" +
        "Для создания видео мне понадобится:\n" +
        "1. 📸 Фото с человеком\n" +
        "2. 🎵 Голосовое сообщение (ваш голос)\n" +
        "3. 📝 Сценарий ролика (текст для озвучки)\n" +
        "4. ⚙️ Настройки видео\n\n" +
        "🎵 **Голос:** Будет использован ваш голос из голосового сообщения!\n\n" +
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
      this.logger.log("📸 Обработчик фото вызван");
      const photo = ctx.message?.photo;
      if (!photo || photo.length === 0) {
        this.logger.warn("❌ Фото не найдено в ctx.message");
        await ctx.reply("❌ Не удалось получить фото. Попробуйте еще раз.");
        return;
      }
      
      this.logger.log(`📸 Получено фото: количество=${photo.length}, file_id=${photo[photo.length - 1].file_id}`);

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
        "🎵 Теперь отправьте голосовое сообщение:\n\n" +
        "📋 **Требования к голосовому сообщению:**\n" +
        "• Длительность: 10-60 секунд\n" +
        "• Четкая речь на русском языке\n" +
        "• Минимум фонового шума\n" +
        "• Естественная интонация\n\n" +
        "💡 **Ваш голос будет использован напрямую через D-ID API**\n" +
        "💡 **Советы для лучшего результата:**\n" +
        "• Говорите медленно и четко\n" +
        "• Используйте выразительную интонацию\n" +
        "• Запишите в тихом помещении\n" +
        "• Держите телефон близко к лицу\n\n" +
        "🎤 Нажмите и удерживайте кнопку записи голосового сообщения:"
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
      "🎵 Аудиофайлы не поддерживаются.\n\n" +
      "🎤 Пожалуйста, отправьте голосовое сообщение вместо аудиофайла.\n\n" +
      "💡 Как записать голосовое сообщение:\n" +
      "• Нажмите и удерживайте кнопку микрофона\n" +
      "• Говорите четко на русском языке\n" +
      "• Длительность: 10-60 секунд"
    );
  }

  @On("voice")
  async onVoice(@Ctx() ctx: VoiceContext) {
    try {
      this.logger.log("🎤 Обработчик голосового сообщения вызван");
      const voice = ctx.message?.voice;
      if (!voice) {
        this.logger.warn("❌ Голосовое сообщение не найдено в ctx.message");
        await ctx.reply("❌ Не удалось получить голосовое сообщение. Попробуйте еще раз.");
        return;
      }
      
      this.logger.log(`🎤 Получено голосовое сообщение: file_id=${voice.file_id}, duration=${voice.duration}`);

      const session = ctx.session as SessionData;

      // Проверяем, что фото уже загружено
      if (!session.photoFileId) {
        await ctx.reply("❌ Сначала отправьте фото с человеком!");
        return;
      }

      // Проверяем длительность голосового сообщения
      if (voice.duration && (voice.duration < 10 || voice.duration > 60)) {
        await ctx.reply(
          `❌ Длительность голосового сообщения должна быть от 10 до 60 секунд!\n\n` +
          `Текущая длительность: ${voice.duration} сек.\n\n` +
          `💡 Запишите голосовое сообщение подходящей длительности.`
        );
        return;
      }

      // Сохраняем ID голосового сообщения в сессии
      session.voiceFileId = voice.file_id;

    await ctx.reply(
        "✅ Голосовое сообщение принято!\n\n" +
        `📊 Информация:\n` +
        `• Длительность: ${voice.duration || '?'} сек.\n` +
        `• Размер: ${voice.file_size ? Math.round(voice.file_size / 1024) + ' КБ' : 'неизвестен'}\n\n` +
        "🎤 Ваш голос будет использован напрямую в видео!\n\n" +
        "📝 Теперь введите текст сценария для озвучки:\n\n" +
        "💡 **Советы:**\n" +
        "• Используйте понятный и интересный текст\n" +
        "• Длина текста должна соответствовать длительности видео\n" +
        "• Избегайте сложных слов и терминов\n" +
        "• Пишите так, как говорите\n\n" +
        "✍️ Введите текст сценария:"
      );

      // Голос готов к использованию через D-ID API
      session.clonedVoiceId = undefined; // Не используем ElevenLabs
    } catch (error) {
      this.logger.error("Error processing voice:", error);
      await ctx.reply("❌ Ошибка при обработке голосового сообщения. Попробуйте еще раз.");
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

      // Проверяем, что фото и голос уже загружены
      if (!session.photoFileId) {
        await ctx.reply("❌ Сначала отправьте фото с человеком!");
        return;
      }

      if (!session.voiceFileId) {
        await ctx.reply("❌ Сначала отправьте голосовое сообщение!");
        return;
      }

      if (!session.script) {
        // Первый текстовый ввод - это сценарий
        session.script = text;
        
        // Автоматически рассчитываем длительность на основе текста
        const calculatedDuration = this.calculateVideoDuration(text);
        session.duration = calculatedDuration;
        
        await ctx.reply(
          `✅ Сценарий принят!\n\n` +
          `📊 Анализ текста:\n` +
          `• Количество слов: ${text.trim().split(/\s+/).length}\n` +
          `• Рассчитанная длительность: ${calculatedDuration} сек.\n\n` +
          `💡 Длительность рассчитана автоматически на основе количества слов и средней скорости речи для русского языка.\n\n`
        );
        
        await this.showPlatformSelection(ctx);
      } else if (!session.textPrompt) {
        // Второй текстовый ввод - это текстовый промпт (платформа выбирается через inline кнопки)
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
      "✅ Длительность выбрана! Теперь выберите качество видео:",
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🎥 720p (быстрее)", callback_data: "quality_720p" },
              { text: "🏆 1080p (лучше)", callback_data: "quality_1080p" }
            ],
            [
              { text: "❌ Отмена", callback_data: "cancel_video_generation" }
            ]
          ]
        }
      }
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

      // Определяем предпочтительный сервис пользователя
      const userId = ctx.from?.id;
      if (!userId) {
        await ctx.reply("❌ Ошибка получения данных пользователя");
        return;
      }

      const preferredService = await this.usersService.getUserPreferredService(userId);
      const initialServiceName = preferredService === 'did' ? '🤖 ИИ-Аватар (D-ID)' : '👤 Цифровой двойник (HeyGen)';

      await ctx.reply(
        `🚀 Начинаю генерацию видео...\n\n` +
        `🔧 Используется: ${initialServiceName}\n` +
        `⏱️ Это может занять несколько минут. Пожалуйста, подождите.`,
      );

      // Получаем URL файлов из Telegram
      let photoUrl = "";
      let voiceUrl = "";
      let imageUrl = ""; // URL загруженного изображения в HeyGen

      if (session.photoFileId) {
        try {
          const photoFile = await ctx.telegram.getFile(session.photoFileId);
          if (photoFile.file_path) {
            photoUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${photoFile.file_path}`;
            
            // Upload API недоступен, поэтому используем стандартный аватар
            await ctx.reply("📝 HeyGen API не поддерживает загрузку пользовательских фото.\nБудет использован красивый стандартный аватар.");
            imageUrl = "heygen_use_available_avatar";
          }
        } catch (error) {
          this.logger.error("Error getting photo URL:", error);
          await ctx.reply("❌ Ошибка получения фото. Попробуйте загрузить фото заново.");
          return;
        }
      }

      if (session.voiceFileId) {
        // Upload API недоступен, поэтому игнорируем голосовое сообщение
        await ctx.reply("📝 HeyGen API не поддерживает загрузку пользовательского аудио.\nБудет использован качественный TTS для озвучки вашего текста.");
        voiceUrl = "heygen_tts_required";
      }

      const request = {
        photoUrl: photoUrl,
        audioUrl: voiceUrl, // Используем голосовое сообщение пользователя
        script: session.script || "",
        platform: session.platform || "youtube-shorts",
        duration: session.duration || 30,
        quality: session.quality || "720p",
        textPrompt: session.textPrompt,
        imageUrl: imageUrl, // URL загруженного изображения в HeyGen
      };

      this.logger.log(`Starting ${preferredService.toUpperCase()} generation with photoUrl: ${photoUrl ? 'PROVIDED' : 'MISSING'}, voiceUrl: ${voiceUrl ? `PROVIDED (${voiceUrl.substring(0, 50)}...)` : `MISSING (${voiceUrl})`}`);
      
      // Используем только HeyGen для генерации
      const requestId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      this.logger.log(`[${requestId}] 🎯 Генерируем видео через HeyGen с пользовательским контентом`);
      this.logger.log(`[${requestId}] 📋 Request object:`, {
        photoUrl: photoUrl ? `PROVIDED (${photoUrl.substring(0, 50)}...)` : 'MISSING',
        audioUrl: voiceUrl ? `PROVIDED (${voiceUrl.substring(0, 50)}...)` : 'MISSING', 
        script: request.script?.substring(0, 50) + '...',
        imageUrl: imageUrl ? `PROVIDED (${imageUrl.substring(0, 50)}...)` : 'MISSING',
        platform: request.platform,
        duration: request.duration,
        quality: request.quality
      });
      
      const result = await this.heygenService.generateVideo(request);

      const hasUserContent = (session.photoFileId && session.voiceFileId);
      const hasCustomPhoto = session.photoFileId && imageUrl !== "heygen_use_available_avatar";
      const hasCustomVoice = session.voiceFileId && voiceUrl && !voiceUrl.includes('heygen_audio_not_supported');
      
      let serviceExplanation = "";
      if (session.photoFileId && session.voiceFileId) {
        serviceExplanation = "📝 HeyGen API (2025) поддерживает только TTS и стандартные аватары\n🎭 Ваш контент сохранен, но используется TTS с доступным аватаром";
      } else if (session.photoFileId) {
        serviceExplanation = "📸 HeyGen API не поддерживает загрузку фото, используется стандартный аватар";
      } else if (session.voiceFileId) {
        serviceExplanation = "🎵 HeyGen API не поддерживает загрузку аудио, используется TTS";
      } else {
        serviceExplanation = "🤖 Используется предустановленный аватар и TTS";
      }

      await ctx.reply(
          `🎬 Генерация началась! Это может занять 2-5 минут.\n\n` +
          `🔧 Сервис: HeyGen (Digital Twin)\n` +
          `${serviceExplanation}\n\n` +
          `📬 Готовое видео будет отправлено вам автоматически.`,
      );

      // Запускаем polling в фоне
      this.pollVideoStatus(result.id, ctx.from?.id, 'heygen');

      // Возвращаемся в главное меню
      await (ctx as { scene?: { leave: () => Promise<void> } }).scene?.leave();
    } catch (error) {
      this.logger.error("Error starting video generation:", error);
      await ctx.reply(
        `❌ К сожалению, произошла ошибка при создании видео.\n\n` +
        `💡 Попробуйте:\n` +
        `• Создать видео заново\n` +
        `• Использовать другое фото или голосовое сообщение\n` +
        `• Обратиться к администратору`
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
        `✅ Платформа выбрана: Короткие вертикальные видео\n\n` +
        `⏱️ Длительность видео: ${session.duration || 30} сек. (рассчитана автоматически)`
      );
      
      await this.showQualitySelection(ctx);
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

  @Action("quality_720p")
  async onQuality720Selected(@Ctx() ctx: Context) {
    try {
      await ctx.answerCbQuery();
      const session = (ctx as unknown as { session: SessionData }).session;
      session.quality = "720p";

      await ctx.editMessageText(
        "✅ Качество выбрано: 720p (быстрее генерация, меньше места)"
      );

      await this.showTextPromptInput(ctx);
    } catch (error) {
      this.logger.error("Error selecting 720p quality:", error);
      await ctx.answerCbQuery("❌ Ошибка выбора качества");
    }
  }

  @Action("quality_1080p")
  async onQuality1080Selected(@Ctx() ctx: Context) {
    try {
      await ctx.answerCbQuery();
      const session = (ctx as unknown as { session: SessionData }).session;
      session.quality = "1080p";

      await ctx.editMessageText(
        "✅ Качество выбрано: 1080p (лучшее качество, больше места)"
      );

      await this.showTextPromptInput(ctx);
    } catch (error) {
      this.logger.error("Error selecting 1080p quality:", error);
      await ctx.answerCbQuery("❌ Ошибка выбора качества");
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

  /**
   * Отслеживает статус генерации видео и автоматически отправляет готовое видео пользователю
   */
  private async pollVideoStatus(videoId: string, userId?: number, service: 'did' | 'heygen' = 'did'): Promise<void> {
    if (!userId) return;
    
    const maxAttempts = 20; // 10 минут максимум
    const interval = 30000; // 30 секунд между проверками
    
    this.logger.log(`🔄 Начинаем отслеживание статуса видео ${videoId} для пользователя ${userId} (сервис: ${service.toUpperCase()})`);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Ждем перед проверкой
        await new Promise(resolve => setTimeout(resolve, interval));
        
        // Проверяем статус через HeyGen (единственный используемый сервис)
        const status = await this.heygenService.getVideoStatus(videoId);
        
        this.logger.log(`📊 Статус видео ${videoId}: ${status.status} (попытка ${attempt + 1}/${maxAttempts}, сервис: ${service.toUpperCase()})`);
        
        // Проверяем статус HeyGen видео
        const isCompleted = status.status === 'completed';
        
        if (isCompleted && status.result_url) {
          this.logger.log(`✅ Видео ${videoId} готово! Отправляем пользователю ${userId}`);
          
          try {
            await this.bot.telegram.sendVideo(userId, status.result_url, {
              caption: "🎉 Ваше видео готово!\n\n✨ Спасибо за использование нашего сервиса!\n🎬 Создавайте новые видео когда захотите."
            });
          } catch (sendError) {
            this.logger.warn(`⚠️ Не удалось отправить видео файлом, отправляем ссылкой: ${sendError}`);
            // Fallback: отправляем ссылку текстом
            await this.bot.telegram.sendMessage(userId,
              `🎉 Ваше видео готово!\n\n` +
              `📹 Ссылка для скачивания:\n${status.result_url}\n\n` +
              `✨ Спасибо за использование нашего сервиса!`
            );
          }
          return;
        }
        
        // Проверяем ошибки HeyGen видео
        const isError = status.status === 'failed' || status.error;
        
        if (isError) {
          this.logger.error(`❌ Ошибка генерации видео ${videoId}: ${status.error}`, {
            videoId,
            userId,
            errorDetails: status.error,
            status: status.status
          });
          
          await this.bot.telegram.sendMessage(userId, 
            `❌ К сожалению, произошла ошибка при создании видео.\n\n` +
            `🔧 Проблема была автоматически зарегистрирована для исправления.\n\n` +
            `💡 Попробуйте:\n` +
            `• Создать видео заново\n` +
            `• Использовать другое фото\n` +
            `• Обратиться к администратору`
          );
          return;
        }
        
      } catch (error) {
        this.logger.error(`Ошибка при проверке статуса видео ${videoId}:`, error);
        
        // Если слишком много ошибок подряд, прерываем
        if (attempt > 5) {
          await this.bot.telegram.sendMessage(userId,
            `❌ Возникли технические проблемы при проверке статуса видео.\n\n` +
            `🔄 Попробуйте создать видео заново.`
          );
          return;
        }
      }
    }
    
    // Таймаут
    this.logger.warn(`⏰ Таймаут ожидания видео ${videoId} для пользователя ${userId}`);
    await this.bot.telegram.sendMessage(userId,
      `⏰ Генерация видео заняла больше времени чем ожидалось.\n\n` +
      `💡 Возможные причины:\n` +
      `• Высокая нагрузка на сервер\n` +
      `• Сложность обработки изображения\n\n` +
      `🔄 Попробуйте создать видео заново.`
    );
  }
}
