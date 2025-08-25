# 🚀 Деплой AI Генератора Видео на Render.com

## ✅ Что исправлено

- **Конфликт зависимостей** - обновлен `reflect-metadata` до версии `^0.2.2`
- **Добавлен `.npmrc`** - автоматически использует `--legacy-peer-deps`
- **Обновлен `render.yaml`** - правильная конфигурация для деплоя
- **Добавлен `postinstall` скрипт** - автоматическая сборка после установки

## 🌐 Настройка на Render.com

### 1. Создание нового сервиса

1. **Войдите в [Render.com](https://render.com)**
2. **Нажмите "New +" → "Web Service"**
3. **Подключите GitHub репозиторий**: `https://github.com/xxNpCxx/AirShorts1`
4. **Выберите ветку**: `main`

### 2. Настройка сервиса

- **Name**: `airshorts-ai-video-generator`
- **Environment**: `Node`
- **Region**: Выберите ближайший к вам
- **Branch**: `main`
- **Root Directory**: Оставьте пустым

### 3. Команды

- **Build Command**: `npm ci --legacy-peer-deps && npm run build`
- **Start Command**: `npm run start:prod`

### 4. Переменные окружения

Добавьте следующие переменные:

```env
NODE_ENV=production
PORT=3000
BOT_TOKEN=8462345506:AAEjL9aOKB6_J1YbrR-YgkKmRUawBfxoTfY
DATABASE_URL=postgresql://paymeeasy_db_user:DO3RcXuC7OjEJJTHcFeIkMStWOMo7Rsq@dpg-d1mht1adbo4c73fbcf10-a/airshorts_db
REDIS_URL=redis://red-d2erqm2dbo4c738pk8o0:6379
DID_API_KEY=eHhucGN4eEBnbWFpbC5jb20:coOsJoP3VqEWDKyQ7F0bG
WEBHOOK_URL=https://your-app-name.onrender.com
DEBUG=false
```

### 5. Дополнительные настройки

- **Health Check Path**: `/health`
- **Auto-Deploy**: ✅ Включено
- **Plan**: Starter (достаточно для начала)

## 🔧 Автоматическая настройка

Если вы используете `render.yaml`, Render.com автоматически настроит:

- ✅ Имя сервиса
- ✅ Команды сборки и запуска
- ✅ Переменные окружения
- ✅ Health check
- ✅ Auto-deploy

## 📱 После деплоя

### 1. Проверьте статус
- Сервис должен быть в статусе "Live"
- Health check должен проходить успешно

### 2. Настройте webhook
```bash
curl -X POST "https://api.telegram.org/bot8462345506:AAEjL9aOKB6_J1YbrR-YgkKmRUawBfxoTfY/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-app-name.onrender.com/webhook"}'
```

### 3. Протестируйте бота
- Отправьте `/start` вашему боту
- Проверьте кнопку "🎬 Создать видео"

## 🆘 Решение проблем

### Ошибка сборки
- Проверьте логи в Render.com
- Убедитесь, что все переменные окружения настроены
- Проверьте, что репозиторий доступен

### Ошибка запуска
- Проверьте логи приложения
- Убедитесь, что порт 3000 свободен
- Проверьте подключение к базе данных и Redis

### Health check не проходит
- Проверьте, что приложение запустилось
- Убедитесь, что endpoint `/health` работает
- Проверьте логи на ошибки

## 📊 Мониторинг

### Логи
- **Build Logs**: Логи сборки
- **Runtime Logs**: Логи работы приложения
- **Health Check Logs**: Логи проверки здоровья

### Метрики
- **Response Time**: Время ответа
- **Error Rate**: Частота ошибок
- **Uptime**: Время работы

## 🎉 Готово!

После успешного деплоя ваш AI генератор видео будет доступен по адресу:
`https://your-app-name.onrender.com`

---

**🚀 Удачного деплоя!**
