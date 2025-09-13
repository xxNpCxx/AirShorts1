/**
 * Типы для Telegraf контекста с сессиями и сценами
 */

import { Context } from 'telegraf';

// ============================================================================
// СЕССИЯ
// ============================================================================

export interface SessionData {
  photoFileId?: string;
  voiceFileId?: string;
  script?: string;
  platform?: 'youtube-shorts';
  duration?: number;
  quality?: '720p' | '1080p';
}

// ============================================================================
// ТИПИЗИРОВАННЫЕ КОНТЕКСТЫ
// ============================================================================

export interface SceneContext {
  scene: {
    enter: (sceneName: string) => Promise<void>;
    leave: () => Promise<void>;
    current?: { id: string };
  };
}

export interface SessionContext {
  session?: SessionData;
}

export type TypedContext = Context & SceneContext & SessionContext;

// ============================================================================
// ТИПЫ ДЛЯ РАЗНЫХ КОНТЕКСТОВ
// ============================================================================

export type PhotoContext = TypedContext & {
  message: {
    photo: Array<{ file_id: string; file_unique_id: string; width: number; height: number; file_size?: number }>;
  };
};

export type VoiceContext = TypedContext & {
  message: {
    voice: {
      file_id: string;
      file_unique_id: string;
      duration: number;
      mime_type?: string;
      file_size?: number;
    };
  };
};

export type TextContext = TypedContext & {
  message: {
    text: string;
  };
};

// ============================================================================
// ТИПЫ ДЛЯ ОБРАБОТКИ ОШИБОК
// ============================================================================

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: unknown;
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof Error && 'code' in error;
}

// ============================================================================
// ВАЛИДАЦИЯ
// ============================================================================

export function hasSession(ctx: Context): ctx is TypedContext {
  return 'session' in ctx;
}

export function hasScene(ctx: Context): ctx is TypedContext {
  return 'scene' in ctx;
}

export function isTypedContext(ctx: Context): ctx is TypedContext {
  return hasSession(ctx) && hasScene(ctx);
}
