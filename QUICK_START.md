# 🚀 Быстрый запуск AI Генератора Видео

## ⚡ 5 минут до работающего бота

### 1. Установка зависимостей
```bash
npm install
```

### 2. Создание .env файла
Создайте файл `.env` в корне проекта:
```env
BOT_TOKEN=8462345506:AAEjL9aOKB6_J1YbrR-YgkKmRUawBfxoTfY
DATABASE_URL=postgresql://paymeeasy_db_user:DO3RcXuC7OjEJJTHcFeIkMStWOMo7Rsq@dpg-d1mht1adbo4c73fbcf10-a/airshorts_db
REDIS_URL=redis://red-d2erqm2dbo4c738pk8o0:6379
DID_API_KEY=eHhucGN4eEBnbWFpbC5jb20:coOsJoP3VqEWDKyQ7F0bG
```

### 3. Запуск бота
```bash
npm run start:dev
```

### 4. Настройка webhook (автоматически)
```bash
./setup-webhook.sh
```

### 5. Тестирование
Отправьте `/start` вашему боту в Telegram!

## 🔧 Альтернативная настройка webhook

### Локальная разработка с ngrok
```bash
# Установите ngrok
npm install -g ngrok

# Запустите туннель
ngrok http 3000

# Скопируйте HTTPS URL и настройте webhook
curl -X POST "https://api.telegram.org/bot8462345506:AAEjL9aOKB6_J1YbrR-YgkKmRUawBfxoTfY/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://YOUR_NGROK_URL/webhook"}'
```

### Production (Render.com)
1. Подключите GitHub репозиторий
2. Настройте переменные окружения
3. Установите webhook на ваш домен

## 🎯 Что получится

- 🤖 **Telegram бот** с красивым интерфейсом
- 🎬 **Генератор видео** через d-id.com API
- 📱 **Оптимизация** для YouTube Shorts
- 🎭 **3D аватары** на основе фото пользователей
- 🗣️ **Персонализированный голос** из записей

## 🆘 Если что-то не работает

1. **Проверьте логи**: `tail -f logs/app.log`
2. **Проверьте webhook**: `curl "https://api.telegram.org/bot8462345506:AAEjL9aOKB6_J1YbrR-YgkKmRUawBfxoTfY/getWebhookInfo"`
3. **Убедитесь, что порт 3000 свободен**
4. **Проверьте переменные окружения**

## 📚 Подробная документация

- **[README.md](README.md)** - Основная информация
- **[DOC.md](DOC.md)** - Детальная документация
- **[WEBHOOK_SETUP.md](WEBHOOK_SETUP.md)** - Настройка webhook

---

**🎉 Готово! Ваш AI генератор видео работает!**
