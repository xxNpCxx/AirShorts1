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
import { BaseScene } from './base-scene';

// Константы для шагов сцены
const SCENE_STEPS = {
  INITIAL: 'initial',
  PHOTO_UPLOADED: 'photo_uploaded',
  VOICE_UPLOADED: 'voice_uploaded',
  SCRIPT_SAVED: 'script_saved',
  READY_TO_GENERATE: 'ready_to_generate',
} as const;

type SceneStep = (typeof SCENE_STEPS)[keyof typeof SCENE_STEPS];

@Scene('video-generation')
export class VideoGenerationScene extends BaseScene {
  constructor(
    private readonly akoolService: AkoolService,
    @Inject(getBotToken('airshorts1_bot')) private readonly bot: Telegraf
  ) {
    super();
  }

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

  /**
   * Устанавливает текущий шаг в сессии
   */
  private setCurrentStep(session: any, step: SceneStep): void {
    session.currentStep = step;
  }

  /**
   * Получает текущий шаг из сессии
   */
  private getCurrentStep(session: any): SceneStep {
    return session.currentStep || SCENE_STEPS.INITIAL;
  }

  /**
   * Создает клавиатуру для навигации по шагам
   */
  private createStepKeyboard(currentStep: SceneStep, canGenerate: boolean = false) {
    const keyboard: any[] = [];

    // Кнопка "Назад" - показываем только если не на начальном шаге
    if (currentStep !== SCENE_STEPS.INITIAL) {
      keyboard.push([{ text: '⬅️ Назад', callback_data: 'step_back' }]);
    }

    // Кнопка "Генерировать видео" - показываем если все готово
    if (canGenerate) {
      keyboard.push([{ text: '🎬 Генерировать видео', callback_data: 'generate_video' }]);
    }

    // Кнопка "Назад в меню" - всегда внизу
    keyboard.push([{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]);

    return {
      inline_keyboard: keyboard,
    };
  }

  /**
   * Обрабатывает навигацию назад по шагам
   */
  private async handleStepBack(ctx: Context, session: any): Promise<void> {
    const currentStep = this.getCurrentStep(session);

    switch (currentStep) {
      case SCENE_STEPS.SCRIPT_SAVED:
        // Возвращаемся к шагу загрузки голоса или фото
        if ((session as any).voiceFileId) {
          this.setCurrentStep(session, SCENE_STEPS.VOICE_UPLOADED);
          await this.showVoiceUploadedState(ctx, session);
        } else {
          this.setCurrentStep(session, SCENE_STEPS.PHOTO_UPLOADED);
          await this.showPhotoUploadedState(ctx, session);
        }
        break;

      case SCENE_STEPS.VOICE_UPLOADED:
        // Возвращаемся к шагу загрузки фото
        this.setCurrentStep(session, SCENE_STEPS.PHOTO_UPLOADED);
        await this.showPhotoUploadedState(ctx, session);
        break;

      case SCENE_STEPS.PHOTO_UPLOADED:
        // Возвращаемся к начальному шагу
        this.setCurrentStep(session, SCENE_STEPS.INITIAL);
        await this.showInitialState(ctx, session);
        break;

      default:
        // Если на начальном шаге, показываем начальное состояние
        await this.showInitialState(ctx, session);
    }
  }

  /**
   * Показывает начальное состояние сцены
   */
  private async showInitialState(ctx: Context, session: any): Promise<void> {
    const hasPhoto = (session as any).photoFileId;
    const hasVoiceOrScript = (session as any).voiceFileId || session.script;
    const canGenerate = hasPhoto && hasVoiceOrScript;

    await ctx.reply(
      `🎬 **Генерация видео**\n\n` +
        `📸 Фото: ${(session as any).photoFileId ? '✅ Загружено' : '❌ Не загружено'}\n` +
        `🎤 Голос: ${(session as any).voiceFileId ? '✅ Загружен' : '❌ Не загружен'}\n` +
        `📝 Скрипт: ${session.script ? '✅ Написан' : '❌ Не написан'}\n\n${
          canGenerate
            ? 'Все готово! Можете генерировать видео.'
            : 'Отправьте фото, голосовое сообщение или текст для продолжения.'
        }`,
      {
        parse_mode: 'Markdown',
        reply_markup: this.createStepKeyboard(SCENE_STEPS.INITIAL, canGenerate),
      }
    );
  }

  /**
   * Показывает состояние после загрузки фото
   */
  private async showPhotoUploadedState(ctx: Context, session: any): Promise<void> {
    await ctx.reply(
      '📸 **Фото получено!**\n\n' +
        'Теперь отправьте голосовое сообщение или текст для генерации видео.',
      {
        parse_mode: 'Markdown',
        reply_markup: this.createStepKeyboard(SCENE_STEPS.PHOTO_UPLOADED),
      }
    );
  }

  /**
   * Показывает состояние после загрузки голоса
   */
  private async showVoiceUploadedState(ctx: Context, session: any): Promise<void> {
    const canGenerate = (session as any).photoFileId && (session as any).voiceFileId;

    await ctx.reply(
      '🎤 **Голосовое сообщение получено!**\n\n' +
        'Теперь отправьте текст скрипта или нажмите "Генерировать видео" если все готово.',
      {
        parse_mode: 'Markdown',
        reply_markup: this.createStepKeyboard(SCENE_STEPS.VOICE_UPLOADED, canGenerate),
      }
    );
  }

  /**
   * Показывает состояние после сохранения скрипта
   */
  private async showScriptSavedState(ctx: Context, session: any, text: string): Promise<void> {
    await ctx.reply(
      `📝 **Скрипт сохранен!**\n\n` +
        `Текст: "${text}"\n` +
        `Предполагаемая длительность: ${session.duration} секунд\n\n` +
        'Теперь нажмите "Генерировать видео" для создания ролика.',
      {
        parse_mode: 'Markdown',
        reply_markup: this.createStepKeyboard(SCENE_STEPS.SCRIPT_SAVED, true),
      }
    );
  }

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: Context) {
    this.logger.debug('🎬 Вход в сцену генерации видео', 'VideoGenerationScene');

    if (!isTypedContext(ctx)) {
      await ctx.reply('❌ Ошибка: контекст не поддерживает сессии. Начните заново.');
      return;
    }

    const session = ctx.session;

    if (!session) {
      await ctx.reply('❌ Ошибка: сессия не найдена. Начните заново.');
      return;
    }

    // Устанавливаем начальный шаг если его нет
    if (!this.getCurrentStep(session)) {
      this.setCurrentStep(session, SCENE_STEPS.INITIAL);
    }

    // Показываем соответствующее состояние
    await this.showInitialState(ctx, session);
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

      // Устанавливаем шаг и показываем состояние
      this.setCurrentStep(session, SCENE_STEPS.PHOTO_UPLOADED);
      await this.showPhotoUploadedState(ctx, session);
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

      // Устанавливаем шаг и показываем состояние
      this.setCurrentStep(session, SCENE_STEPS.VOICE_UPLOADED);
      await this.showVoiceUploadedState(ctx, session);
    } catch (error) {
      this.logger.error('Ошибка при обработке голоса:', error);
      await ctx.reply('❌ Ошибка при обработке голоса. Попробуйте еще раз.');
    }
  }

  @On('text')
  async onText(@Ctx() ctx: Context) {
    const text = (ctx.message as any).text;
    this.logger.debug(`📝 Получено текстовое сообщение в сцене: "${text}"`, 'VideoGenerationScene');

    const session = (ctx as any).session as SessionData;

    if (!session) {
      await ctx.reply('❌ Ошибка: сессия не найдена.');
      return;
    }

    // Логируем сообщения главного меню (обрабатываются в BotUpdate)
    this.logMainMenuMessage(text);

    // Обрабатываем команды выхода из сцены
    if (await this.handleExitCommand(ctx, text)) {
      return;
    }

    if (text === 'Генерировать видео') {
      await this.generateVideo(ctx);
      return;
    }

    // Сохраняем текст как скрипт
    (session as any).script = text;
    (session as any).duration = this.calculateVideoDuration(text);

    // Устанавливаем шаг и показываем состояние
    this.setCurrentStep(session, SCENE_STEPS.SCRIPT_SAVED);
    await this.showScriptSavedState(ctx, session, text);
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

  @Action('step_back')
  async onStepBack(@Ctx() ctx: Context) {
    const session = (ctx as any).session;

    if (!session) {
      await ctx.reply('❌ Ошибка: сессия не найдена.');
      return;
    }

    await ctx.answerCbQuery();
    await this.handleStepBack(ctx, session);
  }

  @Action('back_to_menu')
  async backToMenu(@Ctx() ctx: Context) {
    await (ctx as any).scene.leave();
    await ctx.reply('🏠 Возвращаемся в главное меню...');
  }
}
