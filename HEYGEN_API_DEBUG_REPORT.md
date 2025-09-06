# Отчет по отладке HeyGen API - Ошибка загрузки ассетов

## 🚨 Проблема
При попытке загрузки ассетов (изображений/аудио) в HeyGen API возникает ошибка:
```json
{
  "code": 40001,
  "message": "asset data must be provided"
}
```

## 🔧 Проведенные тесты

### 1. ✅ Проверка Endpoints
**Тестировали:** Разные варианты endpoints для загрузки
- `https://upload.heygen.com/v1/asset` ✅ (отвечает, но с ошибкой 40001)
- `https://api.heygen.com/v1/asset` ❌ (404 Not Found)
- `https://upload.heygen.com/v1/upload` ❌ (404 Not Found)
- `https://api.heygen.com/v1/upload` ❌ (404 Not Found)
- `https://upload.heygen.com/v2/asset` ❌ (404 Not Found)
- `https://api.heygen.com/v2/asset` ❌ (404 Not Found)

**Вывод:** Правильный endpoint - `https://upload.heygen.com/v1/asset`

### 2. ✅ Проверка FormData вариантов
**Тестировали:** Разные способы формирования FormData
- С `knownLength` ✅ (формируется правильно)
- Без `knownLength` ✅ (формируется правильно)
- С дополнительными полями (`type`) ✅ (формируется правильно)
- Без дополнительных полей ✅ (формируется правильно)

**Вывод:** FormData формируется корректно во всех вариантах

### 3. ✅ Проверка имен полей для файла
**Тестировали:** Разные имена полей в FormData
- `'file'` ❌ (ошибка 40001)
- `'asset'` ❌ (ошибка 40001)
- `'data'` ❌ (ошибка 40001)
- `'image'` ❌ (ошибка 40001)
- `'upload'` ❌ (ошибка 40001)

**Вывод:** Все имена полей дают одинаковую ошибку

### 4. ✅ Проверка заголовков
**Тестировали:** Разные варианты заголовков
- `X-Api-Key` ✅ (не 401, значит ключ валидный)
- `X-API-KEY` ❌ (ошибка 40001)
- `Authorization: Bearer` ❌ (ошибка 40001)
- `Authorization: Basic` ❌ (ошибка 401 - неверный формат)
- `X-Api-Key + Content-Type` ❌ (ошибка 40001)

**Вывод:** `X-Api-Key` - правильный заголовок, API ключ валидный

### 5. ✅ Проверка размера файла
**Тестировали:** Файлы разных размеров
- 0.1KB (169 байт) ❌ (ошибка 40001)
- 0.5KB (512 байт) ❌ (ошибка 40001)
- 1KB (1024 байт) ❌ (ошибка 40001)
- 5KB (5120 байт) ❌ (ошибка 40001)
- 10KB (10240 байт) ❌ (ошибка 40001)
- 50KB (51200 байт) ❌ (ошибка 40001)
- 100KB (102400 байт) ❌ (ошибка 40001)

**Вывод:** Размер файла не влияет на ошибку

### 6. ✅ Проверка через curl
**Команда:**
```bash
curl -X POST "https://upload.heygen.com/v1/asset" \
  -H "X-Api-Key: MTdhNzdmMDU5YWMzNDU1N2JjZjA3YjVlNDgyYjAxNTItMTc1NzA0MTk3Mg==" \
  -F "file=@test-image.jpg" \
  -v
```

**Результат:** ❌ Та же ошибка 40001
**Вывод:** Проблема не в коде JavaScript/Node.js

### 7. ✅ Проверка fetch vs axios
**Тестировали:** Разные HTTP клиенты
- Axios ❌ (ошибка 40001)
- Fetch (встроенный Node.js) ❌ (ошибка 40001)

**Вывод:** Проблема не в выборе HTTP клиента

### 8. ✅ Проверка валидности API ключа
**Тестировали:** Другие операции с тем же API ключом
```bash
curl -X GET "https://api.heygen.com/v1/avatar.list" \
  -H "X-API-KEY: MTdhNzdmMDU5YWMzNDU1N2JjZjA3YjVlNDgyYjAxNTItMTc1NzA0MTk3Mg=="
```

**Результат:** ✅ 403 Forbidden (не 401 Unauthorized)
**Вывод:** API ключ валидный, но нет прав на операцию

## 📋 Текущая реализация в проекте

### Код загрузки ассетов:
```typescript
// Используется FormData с правильными параметрами
const formData = new FormData();
formData.append('file', imageBuffer, {
  filename: 'user_photo.jpg',
  contentType: 'image/jpeg',
  knownLength: imageBuffer.length
});

// Отправка через fetch
const response = await fetch('https://upload.heygen.com/v1/asset', {
  method: 'POST',
  headers: {
    'X-Api-Key': this.apiKey,
    ...formData.getHeaders()
  },
  body: formData
});
```

### Логи показывают:
```
📤 [HEYGEN_UPLOAD] FormData prepared for HeyGen API
📋 FormData headers: {
  'content-type': 'multipart/form-data; boundary=--------------------------...'
}
❌ Asset upload failed: 400 - {"code":40001,"message":"asset data must be provided"}
```

## 🔍 Анализ проблемы

### Что работает:
1. ✅ API ключ валидный (403, а не 401)
2. ✅ Endpoint правильный (`https://upload.heygen.com/v1/asset`)
3. ✅ FormData формируется корректно (curl показывает правильные заголовки)
4. ✅ Заголовки правильные (`X-Api-Key`)
5. ✅ Все HTTP клиенты дают одинаковую ошибку

### Что не работает:
1. ❌ Все попытки загрузки дают ошибку 40001
2. ❌ Даже curl с правильным multipart/form-data не работает
3. ❌ Проблема воспроизводится на всех размерах файлов
4. ❌ Проблема воспроизводится со всеми именами полей

## 🤔 Гипотезы

### Возможные причины:
1. **API изменился** - HeyGen изменил требования к формату данных
2. **Документация устарела** - текущая документация не соответствует реальному API
3. **Проблема на стороне HeyGen** - временные проблемы с их сервисом
4. **Новые обязательные поля** - API требует дополнительные параметры
5. **Изменение формата данных** - возможно, нужен другой Content-Type или структура

## 📚 Используемая документация

- **Endpoint:** `POST https://upload.heygen.com/v1/asset`
- **Заголовки:** `X-Api-Key: {API_KEY}`
- **Content-Type:** `multipart/form-data`
- **Поле файла:** `file`
- **Источник:** https://docs.heygen.com/reference/upload-asset

## 🆘 Запрос помощи

**Вопрос для ChatGPT:**
Почему HeyGen API возвращает ошибку `40001: "asset data must be provided"` при загрузке ассетов, несмотря на то, что:
1. FormData формируется правильно с полем `file`
2. Заголовки корректные (`X-Api-Key`, `multipart/form-data`)
3. API ключ валидный (403, а не 401)
4. Даже curl с правильным multipart/form-data дает ту же ошибку
5. Все тесты показывают одинаковую ошибку независимо от параметров

Возможно, HeyGen изменил API или документация устарела? Какие могут быть причины этой ошибки?

## 📊 Статистика тестов

- **Всего тестов:** 8 категорий
- **Успешных:** 0
- **Неудачных:** 8
- **Время тестирования:** ~2 часа
- **Методы:** Node.js, curl, разные HTTP клиенты
- **Файлы:** Сгенерированные JPEG, разные размеры

## 🎯 Следующие шаги

1. Обратиться в поддержку HeyGen
2. Проверить актуальную документацию API
3. Найти примеры рабочего кода от других разработчиков
4. Рассмотреть альтернативные способы загрузки файлов
