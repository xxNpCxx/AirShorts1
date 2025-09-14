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
  const isNull = value === null;
  const isUndefined = value === undefined;
  const isEmptyString = value === '';
  const isMissing = isNull === true || isUndefined === true || isEmptyString === true;
  if (isMissing === true) {
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
  const isRequiredValid = required.isValid === true;
  if (isRequiredValid === false) return required;

  const isStringType = typeof value === 'string';
  if (isStringType === false) {
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

  const isTooShort = value.length < minLength;
  if (isTooShort === true) {
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

  const isMaxDefined = maxLength !== undefined && maxLength !== null;
  const isTooLong = isMaxDefined === true && value.length > (maxLength as number);
  if (isTooLong === true) {
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
  const isRequiredValid = required.isValid === true;
  if (isRequiredValid === false) return required;

  const isNumberType = typeof value === 'number';
  const isValueNaN = Number.isNaN(value as number) === true;
  const isNotValidNumber = isNumberType === false || isValueNaN === true;
  if (isNotValidNumber === true) {
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

  const isMinDefined = min !== undefined;
  const isLessThanMin = isMinDefined === true && (value as number) < (min as number);
  if (isLessThanMin === true) {
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

  const isMaxDefined = max !== undefined;
  const isMoreThanMax = isMaxDefined === true && (value as number) > (max as number);
  if (isMoreThanMax === true) {
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
  const isBooleanType = typeof value === 'boolean';
  if (isBooleanType === false) {
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
  const isRequiredValid = required.isValid === true;
  if (isRequiredValid === false) return required;

  const isAllowed = allowedValues.includes(value as T) === true;
  if (isAllowed === false) {
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
  const isStringValid = stringValidation.isValid === true;
  if (isStringValid === false) return stringValidation;

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
  const isStringValid = stringValidation.isValid === true;
  if (isStringValid === false) return stringValidation;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(value as string) === true;
  if (isEmailValid === false) {
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
  const isStringValid = stringValidation.isValid === true;
  if (isStringValid === false) return stringValidation;

  const isTypeAllowed = allowedTypes.includes(value as string) === true;
  if (isTypeAllowed === false) {
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
  const isNumberValid = numberValidation.isValid === true;
  if (isNumberValid === false) return numberValidation;

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
  const isArrayType = Array.isArray(data) === true;
  if (isArrayType === false) {
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
  (data as unknown[]).forEach((item, index) => {
    const result = itemValidator(item, `${fieldName}[${index}]`);
    const isItemValid = result.isValid === true;
    if (isItemValid === false) {
      errors.push(...result.errors);
    }
  });

  const isNoErrors = errors.length === 0;
  return {
    isValid: isNoErrors,
    errors,
  };
}

// ============================================================================
// УТИЛИТЫ ДЛЯ ОБЪЕДИНЕНИЯ РЕЗУЛЬТАТОВ
// ============================================================================

export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap(result => result.errors);
  const isNoErrors = allErrors.length === 0;
  return {
    isValid: isNoErrors,
    errors: allErrors,
  };
}

export function validateOptional<T>(
  value: unknown,
  fieldName: string,
  validator: (value: unknown, field: string) => ValidationResult
): ValidationResult {
  const isNull = value === null;
  const isUndefined = value === undefined;
  if (isNull === true || isUndefined === true) {
    return { isValid: true, errors: [] };
  }
  return validator(value, fieldName);
}

// ============================================================================
// СПЕЦИАЛЬНЫЕ ВАЛИДАТОРЫ ДЛЯ ПРОЕКТА
// ============================================================================

export function validateTelegramId(value: unknown, fieldName: string): ValidationResult {
  const numberValidation = validateNumber(value, fieldName, 1);
  const isNumberValid = numberValidation.isValid === true;
  if (isNumberValid === false) return numberValidation;

  const isIntegerValue = Number.isInteger(value as number) === true;
  if (isIntegerValue === false) {
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
