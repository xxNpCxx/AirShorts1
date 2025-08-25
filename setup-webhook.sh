#!/bin/bash

# 🚀 Скрипт настройки Webhook для Telegram Bot
# Автор: AI Assistant
# Дата: 2024

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Данные бота
BOT_TOKEN="8462345506:AAEjL9aOKB6_J1YbrR-YgkKmRUawBfxoTfY"
WEBHOOK_URL=""

echo -e "${BLUE}🤖 Настройка Webhook для Telegram Bot${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Проверка наличия curl
if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl не установлен. Установите curl и попробуйте снова.${NC}"
    exit 1
fi

# Проверка текущего статуса webhook
echo -e "${YELLOW}📡 Проверяю текущий статус webhook...${NC}"
WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")

if echo "$WEBHOOK_INFO" | grep -q '"ok":true'; then
    CURRENT_URL=$(echo "$WEBHOOK_INFO" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✅ Webhook уже настроен: ${CURRENT_URL}${NC}"
    
    read -p "Хотите изменить webhook? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}👋 Webhook оставлен без изменений.${NC}"
        exit 0
    fi
fi

# Запрос URL для webhook
echo ""
echo -e "${YELLOW}🌐 Введите URL для webhook:${NC}"
echo -e "${BLUE}Примеры:${NC}"
echo -e "  - https://your-domain.com/webhook"
echo -e "  - https://abc123.ngrok.io/webhook"
echo -e "  - https://your-app.onrender.com/webhook"
echo ""
read -p "URL: " WEBHOOK_URL

if [ -z "$WEBHOOK_URL" ]; then
    echo -e "${RED}❌ URL не может быть пустым.${NC}"
    exit 1
fi

# Проверка формата URL
if [[ ! "$WEBHOOK_URL" =~ ^https:// ]]; then
    echo -e "${RED}❌ URL должен начинаться с https://${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔄 Устанавливаю webhook...${NC}"

# Установка webhook
RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"${WEBHOOK_URL}\"}")

if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo -e "${GREEN}✅ Webhook успешно установлен!${NC}"
    echo -e "${GREEN}📡 URL: ${WEBHOOK_URL}${NC}"
else
    echo -e "${RED}❌ Ошибка установки webhook:${NC}"
    echo "$RESPONSE"
    exit 1
fi

# Проверка статуса
echo ""
echo -e "${YELLOW}🔍 Проверяю статус webhook...${NC}"
sleep 2

WEBHOOK_STATUS=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")

if echo "$WEBHOOK_STATUS" | grep -q '"ok":true'; then
    echo -e "${GREEN}✅ Webhook работает корректно!${NC}"
    
    # Показываем детали
    echo ""
    echo -e "${BLUE}📊 Детали webhook:${NC}"
    echo "$WEBHOOK_STATUS" | python3 -m json.tool 2>/dev/null || echo "$WEBHOOK_STATUS"
else
    echo -e "${RED}❌ Проблема с webhook:${NC}"
    echo "$WEBHOOK_STATUS"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Настройка завершена!${NC}"
echo -e "${BLUE}Теперь запустите бота командой: npm run start:dev${NC}"
echo -e "${BLUE}И отправьте /start в Telegram${NC}"
