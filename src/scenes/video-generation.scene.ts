import { Ctx, Scene, SceneEnter, On, Action } from "nestjs-telegraf";
import { Context } from "telegraf";
import type { Message } from "telegraf/types";
import { HeyGenService } from "../heygen/heygen.service";
import { ProcessManagerService } from "../heygen/process-manager.service";
import { AkoolService } from "../akool/akool.service";
// import { MockHeyGenService, MockProcessManagerService } from "../heygen/mock-heygen.service";
import { Logger, Inject } from "@nestjs/common";
import { Telegraf } from "telegraf";
import { getBotToken } from "nestjs-telegraf";

interface SessionData {
  photoFileId?: string;
  voiceFileId?: string;
  script?: string;
  platform?: "youtube-shorts";
  duration?: number;
  quality?: "720p" | "1080p";
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
    private readonly processManager: ProcessManagerService,
    private readonly akoolService: AkoolService,
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
    
    // Добавляем небольшой буфер для пауз и интонации (25% для русского языка)
    duration = Math.ceil(duration * 1.25);
    
    // Минимум 15 секунд, максимум 60 секунд
    duration = Math.max(15, Math.min(60, duration));
    
    return duration;
  }

  /**
   * Создает цифровой двойник с AKOOL
   */
  private async createDigitalTwinWithAkool(@Ctx() ctx: Context) {
    const requestId = `akool_digital_twin_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      const session = (ctx as any).session as SessionData;
      const userId = ctx.from?.id;
      
      this.logger.log(`🎬 [AKOOL_DIGITAL_TWIN_CREATE] Starting AKOOL Digital Twin creation`, {
        requestId,
        userId,
        hasPhoto: !!session.photoFileId,
        hasVoice: !!session.voiceFileId,
        hasScript: !!session.script,
        scriptLength: session.script?.length || 0,
        quality: session.quality,
        timestamp: new Date().toISOString()
      });
      
      if (!session.photoFileId || !session.voiceFileId || !session.script) {
        this.logger.warn(`⚠️ [AKOOL_DIGITAL_TWIN_CREATE] Missing required data`, {
          requestId,
          userId,
          hasPhoto: !!session.photoFileId,
          hasVoice: !!session.voiceFileId,
          hasScript: !!session.script,
          timestamp: new Date().toISOString()
        });
        await ctx.reply("❌ Не все данные получены. Пожалуйста, загрузите фото, голосовое сообщение и введите текст.");
        return;
      }

      this.logger.log(`📁 [AKOOL_DIGITAL_TWIN_CREATE] Getting file URLs from Telegram`, {
        requestId,
        userId,
        photoFileId: session.photoFileId,
        voiceFileId: session.voiceFileId,
        timestamp: new Date().toISOString()
      });

      // Получаем URL файлов из Telegram
      const photoFile = await ctx.telegram.getFile(session.photoFileId);
      const voiceFile = await ctx.telegram.getFile(session.voiceFileId);
      
      this.logger.log(`📁 [AKOOL_DIGITAL_TWIN_CREATE] Telegram file info received`, {
        requestId,
        userId,
        photoFile: {
          fileId: photoFile.file_id,
          filePath: photoFile.file_path,
          fileSize: photoFile.file_size
        },
        voiceFile: {
          fileId: voiceFile.file_id,
          filePath: voiceFile.file_path,
          fileSize: voiceFile.file_size
        },
        timestamp: new Date().toISOString()
      });
      
      if (!photoFile.file_path || !voiceFile.file_path) {
        this.logger.error(`❌ [AKOOL_DIGITAL_TWIN_CREATE] Missing file paths`, {
          requestId,
          userId,
          photoFilePath: photoFile.file_path,
          voiceFilePath: voiceFile.file_path,
          timestamp: new Date().toISOString()
        });
        await ctx.reply("❌ Ошибка получения файлов. Попробуйте загрузить файлы заново.");
        return;
      }

      const photoUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${photoFile.file_path}`;
      const audioUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${voiceFile.file_path}`;

      this.logger.log(`🔗 [AKOOL_DIGITAL_TWIN_CREATE] File URLs generated`, {
        requestId,
        userId,
        photoUrl: photoUrl.substring(0, 100) + '...',
        audioUrl: audioUrl.substring(0, 100) + '...',
        timestamp: new Date().toISOString()
      });

      // Создаем цифровой двойник с AKOOL
      this.logger.log(`🎭 [AKOOL_DIGITAL_TWIN_CREATE] Creating digital twin with AKOOL...`, {
        requestId,
        userId,
        timestamp: new Date().toISOString()
      });

      const result = await this.akoolService.createDigitalTwinWithVoiceClone(
        photoUrl,
        session.script,
        audioUrl,
        `user_${userId}_voice_${Date.now()}`,
        `${process.env.WEBHOOK_URL}/akool/webhook`,
        userId
      );

      this.logger.log(`✅ [AKOOL_DIGITAL_TWIN_CREATE] Digital twin created successfully`, {
        requestId,
        userId,
        resultId: result.id,
        status: result.status,
        resultUrl: result.result_url,
        timestamp: new Date().toISOString()
      });

      await ctx.reply(
        `🎬 Создание цифрового двойника запущено!\n\n` +
        `📋 ID процесса: ${result.id}\n` +
        `📸 Фото: ✅ Загружено\n` +
        `🎵 Голос: ✅ Загружен\n` +
        `📝 Текст: ${session.script.length} символов\n` +
        `🎥 Качество: ${session.quality || '720p'}\n\n` +
        `⏳ Обработка займет 2-5 минут. Вы получите уведомление когда видео будет готово!`
      );

      this.logger.log(`📤 [AKOOL_DIGITAL_TWIN_CREATE] User notification sent`, {
        requestId,
        userId,
        resultId: result.id,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.logger.error(`❌ [AKOOL_DIGITAL_TWIN_CREATE] Error creating Digital Twin`, {
        requestId,
        userId: ctx.from?.id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      await ctx.reply("❌ Ошибка при создании цифрового двойника. Попробуйте еще раз.");
    }
  }

  /**
   * Создает цифровой двойник с Photo Avatar и Voice Clone
   */
  private async createDigitalTwin(@Ctx() ctx: Context) {
    const requestId = `digital_twin_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      const session = (ctx as any).session as SessionData;
      const userId = ctx.from?.id;
      
      this.logger.log(`🎬 [DIGITAL_TWIN_CREATE] Starting Digital Twin creation`, {
        requestId,
        userId,
        hasPhoto: !!session.photoFileId,
        hasVoice: !!session.voiceFileId,
        hasScript: !!session.script,
        scriptLength: session.script?.length || 0,
        quality: session.quality,
        timestamp: new Date().toISOString()
      });
      
      if (!session.photoFileId || !session.voiceFileId || !session.script) {
        this.logger.warn(`⚠️ [DIGITAL_TWIN_CREATE] Missing required data`, {
          requestId,
          userId,
          hasPhoto: !!session.photoFileId,
          hasVoice: !!session.voiceFileId,
          hasScript: !!session.script,
          timestamp: new Date().toISOString()
        });
        await ctx.reply("❌ Не все данные получены. Пожалуйста, загрузите фото, голосовое сообщение и введите текст.");
        return;
      }

      this.logger.log(`📁 [DIGITAL_TWIN_CREATE] Getting file URLs from Telegram`, {
        requestId,
        userId,
        photoFileId: session.photoFileId,
        voiceFileId: session.voiceFileId,
        timestamp: new Date().toISOString()
      });

      // Получаем URL файлов из Telegram
      const photoFile = await ctx.telegram.getFile(session.photoFileId);
      const voiceFile = await ctx.telegram.getFile(session.voiceFileId);
      
      this.logger.log(`📁 [DIGITAL_TWIN_CREATE] Telegram file info received`, {
        requestId,
        userId,
        photoFile: {
          fileId: photoFile.file_id,
          filePath: photoFile.file_path,
          fileSize: photoFile.file_size
        },
        voiceFile: {
          fileId: voiceFile.file_id,
          filePath: voiceFile.file_path,
          fileSize: voiceFile.file_size
        },
        timestamp: new Date().toISOString()
      });
      
      if (!photoFile.file_path || !voiceFile.file_path) {
        this.logger.error(`❌ [DIGITAL_TWIN_CREATE] Missing file paths`, {
          requestId,
          userId,
          photoFilePath: photoFile.file_path,
          voiceFilePath: voiceFile.file_path,
          timestamp: new Date().toISOString()
        });
        await ctx.reply("❌ Ошибка получения файлов. Попробуйте загрузить файлы заново.");
        return;
      }

      const photoUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${photoFile.file_path}`;
      const audioUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${voiceFile.file_path}`;

      this.logger.log(`🔗 [DIGITAL_TWIN_CREATE] File URLs generated`, {
        requestId,
        userId,
        photoUrl: photoUrl.substring(0, 100) + '...',
        audioUrl: audioUrl.substring(0, 100) + '...',
        timestamp: new Date().toISOString()
      });

      // Создаем процесс создания цифрового двойника
      const digitalTwinProcess = await this.processManager.createDigitalTwinProcess(
        ctx.from!.id,
        photoUrl,
        audioUrl,
        session.script,
        `Digital Twin Video ${new Date().toISOString()}`,
        session.quality || "720p",
        session.voiceFileId
      );

      this.logger.log(`✅ [DIGITAL_TWIN_CREATE] Process created successfully`, {
        requestId,
        userId,
        processId: digitalTwinProcess.id,
        status: digitalTwinProcess.status,
        timestamp: new Date().toISOString()
      });

      // Запускаем первый шаг процесса - создание Photo Avatar
      this.logger.log(`🚀 [DIGITAL_TWIN_CREATE] Starting first step execution`, {
        requestId,
        userId,
        processId: digitalTwinProcess.id,
        timestamp: new Date().toISOString()
      });
      
      await this.processManager.executeNextStep(digitalTwinProcess.id);

      await ctx.reply(
        `🎬 Создание цифрового двойника запущено!\n\n` +
        `📋 ID процесса: ${digitalTwinProcess.id}\n` +
        `📸 Фото: ✅ Загружено\n` +
        `🎵 Голос: ✅ Загружен\n` +
        `📝 Текст: ${session.script.length} символов\n` +
        `🎥 Качество: ${digitalTwinProcess.quality}\n\n` +
        `⏳ Обработка займет 2-5 минут. Вы получите уведомление когда видео будет готово!`
      );

      this.logger.log(`📤 [DIGITAL_TWIN_CREATE] User notification sent`, {
        requestId,
        userId,
        processId: digitalTwinProcess.id,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.logger.error(`❌ [DIGITAL_TWIN_CREATE] Error creating Digital Twin`, {
        requestId,
        userId: ctx.from?.id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      await ctx.reply("❌ Ошибка при создании цифрового двойника. Попробуйте еще раз.");
    }
  }

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: Context) {
    this.logger.log(`🎬 [@SceneEnter] Пользователь ${ctx.from?.id} вошел в сцену video-generation`);
    await ctx.reply(
      "🎬 Добро пожаловать в генератор видео!\n\n" +
        "Для создания цифрового двойника с AKOOL мне понадобится:\n" +
        "1. 📸 Фото с человеком\n" +
        "2. 🎵 Голосовое сообщение (ваш голос)\n" +
        "3. 📝 Сценарий ролика (текст для озвучки)\n\n" +
        "🎵 **Голос:** Будет использован ваш голос из голосового сообщения!\n" +
        "🤖 **Технология:** AKOOL для создания реалистичного цифрового двойника\n\n" +
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
        "💡 **Ваш голос будет использован для озвучки видео**\n" +
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
        "🎤 Ваш голос будет использован для создания цифрового двойника!\n\n" +
        "📝 Теперь введите текст сценария для озвучки:\n\n" +
        "💡 **Советы:**\n" +
        "• Используйте понятный и интересный текст\n" +
        "• Длина текста должна соответствовать длительности видео\n" +
        "• Избегайте сложных слов и терминов\n" +
        "• Пишите так, как говорите\n\n" +
        "✍️ Введите текст сценария:"
      );

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

      // ПРИОРИТЕТ: Проверяем сообщения главного меню ПЕРЕД обработкой текста
      const { MainMenuHandler } = await import("../utils/main-menu-handler");
      if (MainMenuHandler.isMainMenuMessage(text)) {
        await MainMenuHandler.handleMainMenuRequest(ctx, "VideoGenerationScene");
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
        
        this.logger.log(`📝 [TEXT_INPUT] Script received`, {
          userId: ctx.from?.id,
          scriptLength: text.length,
          wordCount: text.trim().split(/\s+/).length,
          calculatedDuration,
          timestamp: new Date().toISOString()
        });
        
        await ctx.reply(
          `✅ Сценарий принят!\n\n` +
          `📊 Анализ текста:\n` +
          `• Количество слов: ${text.trim().split(/\s+/).length}\n` +
          `• Рассчитанная длительность: ${calculatedDuration} сек.\n\n` +
          `💡 Длительность рассчитана автоматически на основе количества слов и средней скорости речи для русского языка.\n\n`
        );
        
        await this.showQualitySelection(ctx);
      } else {
        // Все данные уже получены, но пользователь отправил еще текст
        await ctx.reply(
          "❌ Все необходимые данные уже получены!\n\n" +
          "📋 Текущий статус:\n" +
          `• Фото: ✅ Загружено\n` +
          `• Голос: ✅ Загружен\n` +
          `• Сценарий: ✅ "${session.script}"\n\n` +
          "🎬 Используйте кнопки ниже для выбора качества."
        );
      }
    } catch (error) {
      this.logger.error("Error processing text:", error);
      await ctx.reply("❌ Ошибка при обработке текста. Попробуйте еще раз.");
    }
  }

  private async showQualitySelection(@Ctx() ctx: Context) {
    await ctx.reply(
      "🎥 Выберите качество видео:",
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

  @Action("quality_720p")
  async onQuality720Selected(@Ctx() ctx: Context) {
    try {
      await ctx.answerCbQuery();
      const session = (ctx as unknown as { session: SessionData }).session;
      session.quality = "720p";

      await ctx.editMessageText(
        "✅ Качество выбрано: 720p (быстрее генерация, меньше места)"
      );

      // Проверяем, все ли данные собраны, и запускаем процесс
      await this.checkDataCompletenessAndStart(ctx);
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

      // Проверяем, все ли данные собраны, и запускаем процесс
      await this.checkDataCompletenessAndStart(ctx);
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
   * Проверяет полноту собранных данных и запускает процесс создания цифрового двойника
   */
  private async checkDataCompletenessAndStart(@Ctx() ctx: Context) {
    const session = (ctx as unknown as { session: SessionData }).session;
    
    // Проверяем, все ли данные собраны
    const hasPhoto = !!session.photoFileId;
    const hasVoice = !!session.voiceFileId;
    const hasScript = !!session.script;
    const hasQuality = !!session.quality;

    this.logger.log(`🔍 [DATA_CHECK] Checking data completeness`, {
      userId: ctx.from?.id,
      hasPhoto,
      hasVoice,
      hasScript,
      hasQuality,
      timestamp: new Date().toISOString()
    });

    if (!hasPhoto || !hasVoice || !hasScript || !hasQuality) {
      const missingData = [];
      if (!hasPhoto) missingData.push("📸 Фото");
      if (!hasVoice) missingData.push("🎵 Голосовое сообщение");
      if (!hasScript) missingData.push("📝 Текст сценария");
      if (!hasQuality) missingData.push("🎥 Качество видео");

      await ctx.reply(
        `❌ Не все данные собраны!\n\n` +
        `📋 Отсутствует:\n${missingData.map(item => `• ${item}`).join('\n')}\n\n` +
        `Пожалуйста, загрузите все необходимые данные.`
      );
      return;
    }

    // Все данные собраны, запускаем процесс
    this.logger.log(`✅ [DATA_CHECK] All data collected, starting process`, {
      userId: ctx.from?.id,
      photoFileId: session.photoFileId,
      voiceFileId: session.voiceFileId,
      scriptLength: session.script?.length,
      quality: session.quality,
      timestamp: new Date().toISOString()
    });

    await ctx.reply("🎬 Запускаю создание цифрового двойника...");
    await this.createDigitalTwinWithAkool(ctx);
  }
}