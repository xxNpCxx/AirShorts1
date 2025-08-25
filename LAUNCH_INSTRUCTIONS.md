# 🚀 Инструкция по запуску AI Генератора Видео

## 🎯 Что у нас есть

✅ **Telegram Bot Token**: `8462345506:AAEjL9aOKB6_J1YbrR-YgkKmRUawBfxoTfY`  
✅ **d-id.com API Key**: `eHhucGN4eEBnbWFpbC5jb20:coOsJoP3VqEWDKyQ7F0bG`  
✅ **PostgreSQL**: `postgresql://paymeeasy_db_user:DO3RcXuC7OjEJJTHcFeIkMStWOMo7Rsq@dpg-d1mht1adbo4c73fbcf10-a/airshorts_db`  
✅ **Redis**: `redis://red-d2erqm2dbo4c738pk8o0:6379`  
✅ **Полный код бота** готов к работе  

## 🚀 Быстрый запуск

### 1. Установка зависимостей
```bash
npm install
```

### 2. Файл .env уже создан ✅
Содержит все необходимые переменные окружения.

### 3. Запуск бота
```bash
npm run start:dev
```

### 4. Настройка webhook
В новом терминале:
```bash
./setup-webhook.sh
```

### 5. Тестирование
Отправьте `/start` вашему боту в Telegram!

## 🌐 Настройка webhook

### Локальная разработка с ngrok
```bash
# Установите ngrok
npm install -g ngrok

# Запустите туннель
ngrok http 3000

# Скопируйте HTTPS URL (например: https://abc123.ngrok.io)
# И используйте setup-webhook.sh для настройки
```

### Production (Render.com)
1. Подключите GitHub репозиторий
2. Настройте переменные окружения
3. Установите webhook на ваш домен

## 🔧 Команды управления

```bash
# Запуск в режиме разработки
npm run start:dev

# Запуск в production
npm run build
npm run start:prod

# Остановка бота
pkill -f "nest start"

# Проверка статуса
ps aux | grep "nest start"
```

## 📱 Тестирование бота

1. **Запустите бота**: `npm run start:dev`
2. **Настройте webhook**: `./setup-webhook.sh`
3. **Отправьте команду**: `/start` в Telegram
4. **Проверьте меню**: Должна появиться кнопка "🎬 Создать видео"
5. **Протестируйте сцену**: Нажмите на кнопку и следуйте инструкциям

## 🆘 Решение проблем

### Бот не отвечает
```bash
# Проверьте логи
tail -f logs/app.log

# Проверьте webhook статус
curl "https://api.telegram.org/bot8462345506:AAEjL9aOKB6_J1YbrR-YgkKmRUawBfxoTfY/getWebhookInfo"
```

### Ошибки подключения к БД
- База данных `airshorts_db` должна быть создана
- Проверьте доступность хоста `dpg-d1mht1adbo4c73fbcf10-a`
- Убедитесь, что порт 5432 открыт

### Ошибки Redis
- Проверьте доступность хоста `red-d2erqm2dbo4c738pk8o0`
- Убедитесь, что порт 6379 открыт

## 📊 Мониторинг

```bash
# Логи приложения
tail -f logs/app.log

# Статус webhook
curl "https://api.telegram.org/bot8462345506:AAEjL9aOKB6_J1YbrR-YgkKmRUawBfxoTfY/getWebhookInfo"

# Проверка здоровья сервиса
curl "http://localhost:3000/health"
```

## 🎉 Готово!

Ваш AI генератор видео готов к работе! Бот будет:

- 📸 Принимать фото с людьми
- 🎵 Обрабатывать голосовые записи
- 📝 Создавать сценарии для видео
- 🎬 Генерировать 3D видео через d-id.com API
- 📱 Оптимизировать контент для YouTube Shorts

---

**🚀 Запускайте и тестируйте!**
