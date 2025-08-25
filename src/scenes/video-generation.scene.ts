import { Ctx, Scene, SceneEnter, On, Action } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { DidService } from '../d-id/did.service';
import { Logger } from '@nestjs/common';

interface SessionData {
  photoFileId?: string;
  audioFileId?: string;
  script?: string;
  platform?: 'youtube-shorts';
  duration?: number;
  quality?: '720p' | '1080p';
  textPrompt?: string;
}

@Scene('video-generation')
export class VideoGenerationScene {
  private readonly logger = new Logger(VideoGenerationScene.name);

  constructor(private readonly didService: DidService) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: Context) {
    await ctx.reply(
      '🎬 Добро пожаловать в генератор видео!\n\n' +
      'Для создания видео мне понадобится:\n' +
      '1. 📸 Фото с человеком\n' +
      '2. 🎵 Голосовая запись (до 1 минуты)\n' +
      '3. 📝 Сценарий ролика\n' +
      '4. ⚙️ Настройки видео\n\n' +
      'Начнем с загрузки фото. Отправьте фото с человеком:'
    );
  }

  @On('photo')
  async onPhoto(@Ctx() ctx: any) {
    try {
      const photo = ctx.message?.photo;
      if (!photo || photo.length === 0) {
        await ctx.reply('❌ Не удалось получить фото. Попробуйте еще раз.');
        return;
      }

      const photoFileId = photo[photo.length - 1].file_id;
      (ctx.session as SessionData).photoFileId = photoFileId;

      await ctx.reply(
        '✅ Фото получено! Теперь отправьте голосовую запись (до 1 минуты):'
      );
    } catch (error) {
      this.logger.error('Error processing photo:', error);
      await ctx.reply('❌ Ошибка при обработке фото. Попробуйте еще раз.');
    }
  }

  @On('voice')
  async onVoice(@Ctx() ctx: any) {
    try {
      const voice = ctx.message?.voice;
      if (!voice) {
        await ctx.reply('❌ Не удалось получить голосовую запись. Попробуйте еще раз.');
        return;
      }

      // Проверяем длительность (максимум 60 секунд)
      if (voice.duration > 60) {
        await ctx.reply('❌ Голосовая запись слишком длинная. Максимум 60 секунд.');
        return;
      }

      (ctx.session as SessionData).audioFileId = voice.file_id;

      await ctx.reply(
        '✅ Голосовая запись получена! Теперь отправьте сценарий ролика текстом:'
      );
    } catch (error) {
      this.logger.error('Error processing voice:', error);
      await ctx.reply('❌ Ошибка при обработке голосовой записи. Попробуйте еще раз.');
    }
  }

  @On('text')
  async onText(@Ctx() ctx: any) {
    try {
      const text = ctx.message?.text;
      if (!text) {
        await ctx.reply('❌ Не удалось получить текст. Попробуйте еще раз.');
        return;
      }

      const session = (ctx as any).session as SessionData;

      if (!session.script) {
        // Первый текстовый ввод - это сценарий
        session.script = text;
        await this.showPlatformSelection(ctx);
      } else if (!session.platform) {
        // Второй текстовый ввод - это платформа
        if (text.toLowerCase().includes('youtube') || text.toLowerCase().includes('shorts')) {
          session.platform = 'youtube-shorts';
          await this.showDurationSelection(ctx);
        } else {
          await ctx.reply('❌ Поддерживается только YouTube Shorts. Попробуйте еще раз.');
        }
      } else if (!session.duration) {
        // Третий текстовый ввод - это длительность
        const duration = parseInt(text);
        if (isNaN(duration) || duration < 15 || duration > 60) {
          await ctx.reply('❌ Длительность должна быть от 15 до 60 секунд. Попробуйте еще раз.');
          return;
        }
        session.duration = duration;
        await this.showQualitySelection(ctx);
      } else if (!session.quality) {
        // Четвертый текстовый ввод - это качество
        if (text.toLowerCase().includes('720') || text.toLowerCase().includes('720p')) {
          session.quality = '720p';
        } else if (text.toLowerCase().includes('1080') || text.toLowerCase().includes('1080p')) {
          session.quality = '1080p';
        } else {
          await ctx.reply('❌ Выберите качество: 720p или 1080p');
          return;
        }

        await this.showTextPromptInput(ctx);
      } else if (!session.textPrompt) {
        // Пятый текстовый ввод - это текстовый промпт
        session.textPrompt = text;
        await this.startVideoGeneration(ctx);
      }
    } catch (error) {
      this.logger.error('Error processing text:', error);
      await ctx.reply('❌ Ошибка при обработке текста. Попробуйте еще раз.');
    }
  }

  private async showPlatformSelection(@Ctx() ctx: Context) {
    await ctx.reply(
      '✅ Сценарий получен! Теперь выберите платформу:\n\n' +
      '📱 YouTube Shorts (единственная поддерживаемая платформа)\n\n' +
      'Напишите "YouTube Shorts" или "shorts":'
    );
  }

  private async showDurationSelection(@Ctx() ctx: Context) {
    await ctx.reply(
      '✅ Платформа выбрана! Теперь укажите длительность видео в секундах:\n\n' +
      '📏 От 15 до 60 секунд (рекомендуется 15-30 для Shorts)\n\n' +
      'Введите число секунд:'
    );
  }

  private async showQualitySelection(@Ctx() ctx: Context) {
    await ctx.reply(
      '✅ Длительность выбрана! Теперь выберите качество видео:\n\n' +
      '🎥 720p - быстрее, меньше места\n' +
      '🎥 1080p - лучше качество, больше места\n\n' +
      'Напишите "720p" или "1080p":'
    );
  }

  private async showTextPromptInput(@Ctx() ctx: Context) {
    await ctx.reply(
      '✅ Качество выбрано! Теперь добавьте текстовый промпт для улучшения генерации:\n\n' +
      '💡 Например: "Создай видео в стиле YouTube Shorts с динамичными движениями"\n\n' +
      'Или просто напишите "нет" если промпт не нужен:'
    );
  }

  private async startVideoGeneration(@Ctx() ctx: Context) {
    try {
      const session = (ctx as any).session as SessionData;
      
      await ctx.reply(
        '🚀 Начинаю генерацию видео...\n\n' +
        'Это может занять несколько минут. Пожалуйста, подождите.'
      );

      // Здесь должна быть логика загрузки файлов и генерации видео
      // Пока что используем заглушку
      const request = {
        photoUrl: session.photoFileId || '',
        audioUrl: session.audioFileId || '',
        script: session.script || '',
        platform: session.platform || 'youtube-shorts',
        duration: session.duration || 30,
        quality: session.quality || '720p',
        textPrompt: session.textPrompt,
      };

      const result = await this.didService.generateVideo(request);

      await ctx.reply(
        '✅ Видео успешно создано!\n\n' +
        `🆔 ID: ${result.id}\n` +
        `📊 Статус: ${result.status}\n\n` +
        'Видео будет готово через несколько минут. ' +
        'Вы получите уведомление когда оно будет готово.'
      );

      // Возвращаемся в главное меню
      await (ctx as any).scene.leave();
    } catch (error) {
      this.logger.error('Error starting video generation:', error);
      await ctx.reply(
        '❌ Ошибка при создании видео:\n' +
        (error as any).message + '\n\n' +
        'Попробуйте еще раз или обратитесь к администратору.'
      );
    }
  }

  @Action('cancel')
  async onCancel(@Ctx() ctx: Context) {
    await ctx.reply('❌ Создание видео отменено.');
    await (ctx as any).scene.leave();
  }
}
