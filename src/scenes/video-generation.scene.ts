import { Ctx, Scene, SceneEnter, On, Action } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { AkoolService, AkoolVideoRequest, AkoolVideoResponse } from '../akool/akool.service';
import { Logger, Inject } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { getBotToken } from 'nestjs-telegraf';
import { AkoolFileUploader } from '../utils/akool-file-uploader';
import {
  TypedContext,
  PhotoContext,
  VoiceContext,
  TextContext,
  SessionData,
  isTypedContext,
} from '../types';

@Scene('video-generation')
export class VideoGenerationScene {
  private readonly logger = new Logger(VideoGenerationScene.name);

  constructor(
    private readonly akoolService: AkoolService,
    @Inject(getBotToken('airshorts1_bot')) private readonly bot: Telegraf
  ) {}

  /**
   * Рассчитывает длительность видео на основе текста
   */
  private calculateVideoDuration(text: string): number {
    // Примерный расчет: 150 слов в минуту
    const wordsPerMinute = 150;
    const wordCount = text.split(/\s+/).length;
    const durationInMinutes = wordCount / wordsPerMinute;

    // Минимум 5 секунд, максимум 60 секунд для YouTube Shorts
    return Math.max(5, Math.min(60, Math.ceil(durationInMinutes * 60)));
  }

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: Context) {
    if (!isTypedContext(ctx)) {
      await ctx.reply('❌ Ошибка: контекст не поддерживает сессии. Начните заново.');
      return;
    }

    const session = ctx.session;

    if (!session) {
      await ctx.reply('❌ Ошибка: сессия не найдена. Начните заново.');
      return;
    }

    await ctx.reply(
      `🎬 **Генерация видео**\n\n` +
        `📸 Фото: ${session.photoFileId ? '✅ Загружено' : '❌ Не загружено'}\n` +
        `🎤 Голос: ${session.voiceFileId ? '✅ Загружен' : '❌ Не загружен'}\n` +
        `📝 Скрипт: ${session.script ? '✅ Написан' : '❌ Не написан'}\n\n` +
        `Отправьте фото, голосовое сообщение или текст для продолжения.`,
      { parse_mode: 'Markdown' }
    );
  }

  @On('photo')
  async onPhoto(@Ctx() ctx: Context) {
    const session = (ctx as any).session as SessionData;

    if (!session) {
      await ctx.reply('❌ Ошибка: сессия не найдена.');
      return;
    }

    try {
      // Получаем фото с наилучшим качеством
      const photo = (ctx.message as any).photo[(ctx.message as any).photo.length - 1];
      (session as any).photoFileId = photo.file_id;

      await ctx.reply(
        '📸 **Фото получено!**\n\n' +
          'Теперь отправьте голосовое сообщение или текст для генерации видео.',
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      this.logger.error('Ошибка при обработке фото:', error);
      await ctx.reply('❌ Ошибка при обработке фото. Попробуйте еще раз.');
    }
  }

  @On('voice')
  async onVoice(@Ctx() ctx: Context) {
    const session = (ctx as any).session as SessionData;

    if (!session) {
      await ctx.reply('❌ Ошибка: сессия не найдена.');
      return;
    }

    try {
      (session as any).voiceFileId = (ctx.message as any).voice.file_id;

      await ctx.reply(
        '🎤 **Голосовое сообщение получено!**\n\n' +
          'Теперь отправьте текст скрипта или нажмите "Генерировать видео" если все готово.',
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      this.logger.error('Ошибка при обработке голоса:', error);
      await ctx.reply('❌ Ошибка при обработке голоса. Попробуйте еще раз.');
    }
  }

  @On('text')
  async onText(@Ctx() ctx: Context) {
    const session = (ctx as any).session as SessionData;

    if (!session) {
      await ctx.reply('❌ Ошибка: сессия не найдена.');
      return;
    }

    const text = (ctx.message as any).text;

    // Проверяем команды (middleware обрабатывает главное меню автоматически)
    if (text === '/start' || text === 'Назад в меню') {
      await (ctx as any).scene.leave();
      await ctx.reply('🏠 Возвращаемся в главное меню...');
      return;
    }

    if (text === 'Генерировать видео') {
      await this.generateVideo(ctx);
      return;
    }

    // Сохраняем текст как скрипт
    (session as any).script = text;
    (session as any).duration = this.calculateVideoDuration(text);

    await ctx.reply(
      `📝 **Скрипт сохранен!**\n\n` +
        `Текст: "${text}"\n` +
        `Предполагаемая длительность: ${session.duration} секунд\n\n` +
        'Теперь нажмите "Генерировать видео" для создания ролика.',
      { parse_mode: 'Markdown' }
    );
  }

  @Action('generate_video')
  async generateVideo(@Ctx() ctx: Context) {
    const session = (ctx as any).session as SessionData;

    if (!session) {
      await ctx.reply('❌ Ошибка: сессия не найдена.');
      return;
    }

    // Проверяем наличие всех необходимых данных
    if (!(session as any).photoFileId) {
      await ctx.reply('❌ Сначала отправьте фото для генерации видео.');
      return;
    }

    if (!(session as any).voiceFileId && !(session as any).script) {
      await ctx.reply('❌ Сначала отправьте голосовое сообщение или текст скрипта.');
      return;
    }

    try {
      await ctx.reply('🎬 **Начинаю генерацию видео...**\n\nЭто может занять несколько минут.', {
        parse_mode: 'Markdown',
      });

      // Скачиваем файлы
      const photoUrl = await this.bot.telegram.getFileLink((session as any).photoFileId);

      let audioUrl: string | undefined;
      if ((session as any).voiceFileId) {
        const audioFileUrl = await this.bot.telegram.getFileLink((session as any).voiceFileId);
        audioUrl = audioFileUrl.href;
      }

      // Генерируем видео через AKOOL
      const result = await this.akoolService.createDigitalTwin({
        photoUrl: photoUrl.href,
        audioUrl: audioUrl || '',
        script: (session as any).script || '',
        platform: 'youtube-shorts',
        duration: (session as any).duration || 30,
        quality: (session as any).quality || '720p',
      });

      if (result.status === 'completed' && result.result_url) {
        await ctx.reply(
          '✅ **Видео успешно создано!**\n\n' +
            `🎬 Ссылка: ${result.result_url}\n` +
            `⏱ Длительность: ${(session as any).duration} секунд\n` +
            `📺 Качество: ${(session as any).quality || '720p'}`,
          { parse_mode: 'Markdown' }
        );
      } else {
        await ctx.reply(
          '❌ **Ошибка при создании видео**\n\n' +
            `Причина: ${result.error || 'Неизвестная ошибка'}`,
          { parse_mode: 'Markdown' }
        );
      }
    } catch (error) {
      this.logger.error('Ошибка при генерации видео:', error);
      await ctx.reply(
        '❌ **Ошибка при генерации видео**\n\n' + 'Попробуйте еще раз или обратитесь в поддержку.',
        { parse_mode: 'Markdown' }
      );
    }
  }

  @Action('back_to_menu')
  async backToMenu(@Ctx() ctx: Context) {
    await (ctx as any).scene.leave();
    await ctx.reply('🏠 Возвращаемся в главное меню...');
  }
}
