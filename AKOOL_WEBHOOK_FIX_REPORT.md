# 🔧 Отчет об исправлении ошибки расшифровки Akool webhook

## 📋 Проблема

В логах сервиса Akool наблюдались повторяющиеся ошибки расшифровки AES:

```
ERROR [AkoolWebhookController] ❌ Ошибка AES расшифровки:
Error: error:1C800064:Provider routines::bad decrypt
```

## 🔍 Анализ проблемы

### 1. Изучение логов
- Подпись webhook проверялась успешно ✅
- Ошибка возникала при расшифровке данных ❌
- Ключи: `AKOOL_CLIENT_ID` (24 символа), `AKOOL_CLIENT_SECRET` (32 символа)

### 2. Сравнение с официальной документацией
Изучена [официальная документация Akool](https://docs.akool.com/ai-tools-suite/webhook):
- Алгоритм: AES-192-CBC с PKCS#7 padding
- Ключ: clientSecret (UTF-8)
- IV: clientId (UTF-8)
- Рекомендуется использовать `crypto-js` библиотеку

### 3. Выявление корневой причины
**Проблема**: Использование нативного `crypto` модуля Node.js вместо `crypto-js`

**Причина**: 
- Нативный `crypto` модуль Node.js имеет другую реализацию AES
- `crypto-js` библиотека совместима с официальным примером Akool
- Различия в обработке ключей и IV

## ✅ Решение

### 1. Установка зависимости
```bash
npm install crypto-js
```

### 2. Исправление алгоритма расшифровки

**Было** (нативный crypto):
```typescript
const crypto = require('crypto');
const decipher = crypto.createDecipheriv('aes-192-cbc', key, iv);
```

**Стало** (crypto-js):
```typescript
const CryptoJS = require('crypto-js');
const decrypted = CryptoJS.AES.decrypt(dataEncrypt, key, {
  iv: iv,
  mode: CryptoJS.mode.CBC,
  padding: CryptoJS.pad.Pkcs7
});
```

### 3. Обновленный код

```typescript
private decryptAES(dataEncrypt: string, clientId: string, clientSecret: string): string {
  try {
    const CryptoJS = require('crypto-js');

    // Получаем ключи из переменных окружения
    const actualClientId = this.configService.get<string>('AKOOL_CLIENT_ID');
    const actualClientSecret = this.configService.get<string>('AKOOL_CLIENT_SECRET');

    // Создаем ключ и IV согласно документации
    const aesKey = actualClientSecret;
    const key = CryptoJS.enc.Utf8.parse(aesKey);
    const iv = CryptoJS.enc.Utf8.parse(actualClientId);

    // Расшифровываем AES-192-CBC с PKCS#7 padding используя crypto-js
    const decrypted = CryptoJS.AES.decrypt(dataEncrypt, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    const result = decrypted.toString(CryptoJS.enc.Utf8);
    return result;
  } catch (error) {
    this.logger.error('❌ Ошибка AES расшифровки:', error);
    throw error;
  }
}
```

## 🧪 Тестирование

### 1. Тестовые данные из логов
```json
{
  "signature": "9a0403251957a130fad76ea64236e02c3c521e70",
  "dataEncrypt": "dOiIGl2CZPmj6UKlO9yzmWPW4Tb+T93rLqKQj6ES7xP7k4H5OhvVugbymXZ0kGW8v+Bfa0oJKI0RlPkC7P7ow8MGfv8ow1idyPVOpDA0ncWuZmgMLazug/Vm1yEHrDhdr77Sz4hk9O0Oezc5VHKB6/Me5xwehJZjyVSCKTe/+2lqV7ezzDhi6LmMy7sCkVwt4rOFvq8Yafi64CnCcZLzpA==",
  "timestamp": 1757785623798,
  "nonce": "9047"
}
```

### 2. Результат тестирования
✅ **Подпись валидна**
✅ **Расшифровка успешна**
✅ **JSON парсинг успешен**

### 3. Расшифрованные данные
```json
{
  "_id": "68c5ac7ff0eec691e90065c8",
  "status": 3,
  "type": "talking photo",
  "url": "https://d2qf6ukcym4kn9.cloudfront.net/1757785499654-8067.mp4",
  "deduction_credit": 30
}
```

## 📊 Результаты

### До исправления
- ❌ Ошибка `ERR_OSSL_BAD_DECRYPT`
- ❌ Невозможность расшифровки webhook данных
- ❌ Потеря данных о статусе видео

### После исправления
- ✅ Успешная расшифровка webhook данных
- ✅ Корректная обработка статуса видео
- ✅ Получение URL готового видео
- ✅ Соответствие официальной документации Akool

## 🎯 Ключевые изменения

1. **Замена библиотеки**: `crypto` → `crypto-js`
2. **Совместимость**: Соответствие официальному примеру Akool
3. **Надежность**: Использование проверенной библиотеки
4. **Документация**: Ссылка на официальную документацию

## 📝 Рекомендации

1. **Мониторинг**: Отслеживать логи на предмет новых ошибок
2. **Тестирование**: Регулярно тестировать с реальными webhook данными
3. **Документация**: Обновить документацию с учетом изменений
4. **Зависимости**: Следить за обновлениями `crypto-js`

## 🔗 Ссылки

- [Официальная документация Akool webhook](https://docs.akool.com/ai-tools-suite/webhook)
- [crypto-js библиотека](https://github.com/brix/crypto-js)
- [GitHub Akool](https://github.com/AKOOL-Official)

---

**Дата исправления**: 13 сентября 2025  
**Статус**: ✅ Решено  
**Тестирование**: ✅ Пройдено
