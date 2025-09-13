/**
 * Утилиты для валидации данных
 */

import {
  ValidationResult,
  ValidationError,
  ServiceType,
  ProcessStatus,
  UserRole,
  VideoQuality,
  VideoOrientation,
  SUPPORTED_IMAGE_TYPES,
  SUPPORTED_AUDIO_TYPES,
  SUPPORTED_VIDEO_TYPES,
  MAX_FILE_SIZE,
  VIDEO_DURATION_LIMITS,
} from '../types';

// ============================================================================
// ОСНОВНЫЕ ВАЛИДАТОРЫ
// ============================================================================

export function validateRequired(value: unknown, fieldName: string): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return {
      isValid: false,
      errors: [
        {
          field: fieldName,
          message: `${fieldName} is required`,
          value,
        },
      ],
    };
  }
  return { isValid: true, errors: [] };
}

export function validateString(
  value: unknown,
  fieldName: string,
  minLength = 0,
  maxLength?: number
): ValidationResult {
  const required = validateRequired(value, fieldName);
  if (!required.isValid) return required;

  if (typeof value !== 'string') {
    return {
      isValid: false,
      errors: [
        {
          field: fieldName,
          message: `${fieldName} must be a string`,
          value,
        },
      ],
    };
  }

  if (value.length < minLength) {
    return {
      isValid: false,
      errors: [
        {
          field: fieldName,
          message: `${fieldName} must be at least ${minLength} characters long`,
          value,
        },
      ],
    };
  }

  if (maxLength && value.length > maxLength) {
    return {
      isValid: false,
      errors: [
        {
          field: fieldName,
          message: `${fieldName} must be no more than ${maxLength} characters long`,
          value,
        },
      ],
    };
  }

  return { isValid: true, errors: [] };
}

export function validateNumber(
  value: unknown,
  fieldName: string,
  min?: number,
  max?: number
): ValidationResult {
  const required = validateRequired(value, fieldName);
  if (!required.isValid) return required;

  if (typeof value !== 'number' || isNaN(value)) {
    return {
      isValid: false,
      errors: [
        {
          field: fieldName,
          message: `${fieldName} must be a number`,
          value,
        },
      ],
    };
  }

  if (min !== undefined && value < min) {
    return {
      isValid: false,
      errors: [
        {
          field: fieldName,
          message: `${fieldName} must be at least ${min}`,
          value,
        },
      ],
    };
  }

  if (max !== undefined && value > max) {
    return {
      isValid: false,
      errors: [
        {
          field: fieldName,
          message: `${fieldName} must be no more than ${max}`,
          value,
        },
      ],
    };
  }

  return { isValid: true, errors: [] };
}

export function validateBoolean(value: unknown, fieldName: string): ValidationResult {
  if (typeof value !== 'boolean') {
    return {
      isValid: false,
      errors: [
        {
          field: fieldName,
          message: `${fieldName} must be a boolean`,
          value,
        },
      ],
    };
  }
  return { isValid: true, errors: [] };
}

export function validateEnum<T extends string>(
  value: unknown,
  fieldName: string,
  allowedValues: readonly T[]
): ValidationResult {
  const required = validateRequired(value, fieldName);
  if (!required.isValid) return required;

  if (!allowedValues.includes(value as T)) {
    return {
      isValid: false,
      errors: [
        {
          field: fieldName,
          message: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
          value,
        },
      ],
    };
  }

  return { isValid: true, errors: [] };
}

export function validateUrl(value: unknown, fieldName: string): ValidationResult {
  const stringValidation = validateString(value, fieldName);
  if (!stringValidation.isValid) return stringValidation;

  try {
    new globalThis.URL(value as string);
    return { isValid: true, errors: [] };
  } catch {
    return {
      isValid: false,
      errors: [
        {
          field: fieldName,
          message: `${fieldName} must be a valid URL`,
          value,
        },
      ],
    };
  }
}

export function validateEmail(value: unknown, fieldName: string): ValidationResult {
  const stringValidation = validateString(value, fieldName);
  if (!stringValidation.isValid) return stringValidation;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value as string)) {
    return {
      isValid: false,
      errors: [
        {
          field: fieldName,
          message: `${fieldName} must be a valid email address`,
          value,
        },
      ],
    };
  }

  return { isValid: true, errors: [] };
}

// ============================================================================
// СПЕЦИАЛИЗИРОВАННЫЕ ВАЛИДАТОРЫ
// ============================================================================

export function validateServiceType(value: unknown, fieldName: string): ValidationResult {
  return validateEnum(value, fieldName, ['heygen', 'd-id', 'akool', 'elevenlabs']);
}

export function validateProcessStatus(value: unknown, fieldName: string): ValidationResult {
  return validateEnum(value, fieldName, [
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled',
  ]);
}

export function validateUserRole(value: unknown, fieldName: string): ValidationResult {
  return validateEnum(value, fieldName, ['owner', 'admin', 'operator']);
}

export function validateVideoQuality(value: unknown, fieldName: string): ValidationResult {
  return validateEnum(value, fieldName, ['720p', '1080p']);
}

export function validateVideoOrientation(value: unknown, fieldName: string): ValidationResult {
  return validateEnum(value, fieldName, ['portrait', 'landscape']);
}

export function validateFileType(
  value: unknown,
  fieldName: string,
  allowedTypes: readonly string[]
): ValidationResult {
  const stringValidation = validateString(value, fieldName);
  if (!stringValidation.isValid) return stringValidation;

  if (!allowedTypes.includes(value as string)) {
    return {
      isValid: false,
      errors: [
        {
          field: fieldName,
          message: `${fieldName} must be one of: ${allowedTypes.join(', ')}`,
          value,
        },
      ],
    };
  }

  return { isValid: true, errors: [] };
}

export function validateImageType(value: unknown, fieldName: string): ValidationResult {
  return validateFileType(value, fieldName, SUPPORTED_IMAGE_TYPES);
}

export function validateAudioType(value: unknown, fieldName: string): ValidationResult {
  return validateFileType(value, fieldName, SUPPORTED_AUDIO_TYPES);
}

export function validateVideoType(value: unknown, fieldName: string): ValidationResult {
  return validateFileType(value, fieldName, SUPPORTED_VIDEO_TYPES);
}

export function validateFileSize(
  value: unknown,
  fieldName: string,
  maxSize: number
): ValidationResult {
  const numberValidation = validateNumber(value, fieldName, 0, maxSize);
  if (!numberValidation.isValid) return numberValidation;

  return { isValid: true, errors: [] };
}

export function validateImageSize(value: unknown, fieldName: string): ValidationResult {
  return validateFileSize(value, fieldName, MAX_FILE_SIZE.IMAGE);
}

export function validateAudioSize(value: unknown, fieldName: string): ValidationResult {
  return validateFileSize(value, fieldName, MAX_FILE_SIZE.AUDIO);
}

export function validateVideoSize(value: unknown, fieldName: string): ValidationResult {
  return validateFileSize(value, fieldName, MAX_FILE_SIZE.VIDEO);
}

export function validateVideoDuration(value: unknown, fieldName: string): ValidationResult {
  return validateNumber(value, fieldName, VIDEO_DURATION_LIMITS.MIN, VIDEO_DURATION_LIMITS.MAX);
}

// ============================================================================
// КОМПЛЕКСНЫЕ ВАЛИДАТОРЫ
// ============================================================================

export function validateObject(
  data: unknown,
  fieldName: string,
  validators: Record<string, (value: unknown, field: string) => ValidationResult>
): ValidationResult {
  if (typeof data !== 'object' || data === null) {
    return {
      isValid: false,
      errors: [
        {
          field: fieldName,
          message: `${fieldName} must be an object`,
          value: data,
        },
      ],
    };
  }

  const errors: ValidationError[] = [];
  const obj = data as Record<string, unknown>;

  for (const [key, validator] of Object.entries(validators)) {
    const result = validator(obj[key], key);
    if (!result.isValid) {
      errors.push(...result.errors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateArray<T>(
  data: unknown,
  fieldName: string,
  itemValidator: (value: unknown, field: string) => ValidationResult
): ValidationResult {
  if (!Array.isArray(data)) {
    return {
      isValid: false,
      errors: [
        {
          field: fieldName,
          message: `${fieldName} must be an array`,
          value: data,
        },
      ],
    };
  }

  const errors: ValidationError[] = [];
  data.forEach((item, index) => {
    const result = itemValidator(item, `${fieldName}[${index}]`);
    if (!result.isValid) {
      errors.push(...result.errors);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// УТИЛИТЫ ДЛЯ ОБЪЕДИНЕНИЯ РЕЗУЛЬТАТОВ
// ============================================================================

export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap(result => result.errors);
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

export function validateOptional<T>(
  value: unknown,
  fieldName: string,
  validator: (value: unknown, field: string) => ValidationResult
): ValidationResult {
  if (value === null || value === undefined) {
    return { isValid: true, errors: [] };
  }
  return validator(value, fieldName);
}

// ============================================================================
// СПЕЦИАЛЬНЫЕ ВАЛИДАТОРЫ ДЛЯ ПРОЕКТА
// ============================================================================

export function validateTelegramId(value: unknown, fieldName: string): ValidationResult {
  const numberValidation = validateNumber(value, fieldName, 1);
  if (!numberValidation.isValid) return numberValidation;

  if (!Number.isInteger(value as number)) {
    return {
      isValid: false,
      errors: [
        {
          field: fieldName,
          message: `${fieldName} must be an integer`,
          value,
        },
      ],
    };
  }

  return { isValid: true, errors: [] };
}

export function validateScript(value: unknown, fieldName: string): ValidationResult {
  return validateString(value, fieldName, 10, 1000);
}

export function validateVideoTitle(value: unknown, fieldName: string): ValidationResult {
  return validateString(value, fieldName, 1, 100);
}

export function validateVoiceId(value: unknown, fieldName: string): ValidationResult {
  return validateString(value, fieldName, 1, 50);
}

export function validateRequestId(value: unknown, fieldName: string): ValidationResult {
  return validateString(value, fieldName, 1, 100);
}

// ============================================================================
// КОНСТАНТЫ ДЛЯ ВАЛИДАЦИИ
// ============================================================================

export const VALIDATION_LIMITS = {
  USERNAME_MIN: 1,
  USERNAME_MAX: 32,
  FIRST_NAME_MIN: 1,
  FIRST_NAME_MAX: 64,
  LAST_NAME_MAX: 64,
  SCRIPT_MIN: 10,
  SCRIPT_MAX: 1000,
  VIDEO_TITLE_MIN: 1,
  VIDEO_TITLE_MAX: 100,
  VOICE_ID_MIN: 1,
  VOICE_ID_MAX: 50,
  REQUEST_ID_MIN: 1,
  REQUEST_ID_MAX: 100,
} as const;
