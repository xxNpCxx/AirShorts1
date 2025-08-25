#!/bin/bash

# 🗄️ Скрипт создания базы данных для AI Генератора Видео
# Автор: AI Assistant
# Дата: 2024

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Данные подключения
DB_HOST="dpg-d1mht1adbo4c73fbcf10-a"
DB_USER="paymeeasy_db_user"
DB_PASSWORD="DO3RcXuC7OjEJJTHcFeIkMStWOMo7Rsq"
DB_NAME="airshorts_db"
DB_PORT="5432"

echo -e "${BLUE}🗄️ Создание базы данных для AI Генератора Видео${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Проверка наличия psql
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ psql не установлен. Установите PostgreSQL client и попробуйте снова.${NC}"
    echo -e "${YELLOW}💡 Для macOS: brew install postgresql${NC}"
    echo -e "${YELLOW}💡 Для Ubuntu: sudo apt-get install postgresql-client${NC}"
    exit 1
fi

echo -e "${YELLOW}🔍 Проверяю подключение к PostgreSQL...${NC}"

# Проверка подключения к существующей базе данных
if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "paymeeasy_db" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Подключение к PostgreSQL успешно!${NC}"
else
    echo -e "${RED}❌ Не удалось подключиться к PostgreSQL.${NC}"
    echo -e "${YELLOW}Проверьте:${NC}"
    echo -e "  - Правильность хоста: $DB_HOST"
    echo -e "  - Правильность пользователя: $DB_USER"
    echo -e "  - Правильность пароля: $DB_PASSWORD"
    echo -e "  - Доступность порта: $DB_PORT"
    exit 1
fi

echo ""
echo -e "${YELLOW}🗄️ Создаю базу данных '$DB_NAME'...${NC}"

# Создание новой базы данных
if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "paymeeasy_db" -c "CREATE DATABASE \"$DB_NAME\";" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ База данных '$DB_NAME' успешно создана!${NC}"
else
    echo -e "${YELLOW}⚠️ База данных '$DB_NAME' уже существует или произошла ошибка.${NC}"
    
    # Проверяем, существует ли база данных
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ База данных '$DB_NAME' уже существует и доступна.${NC}"
    else
        echo -e "${RED}❌ Ошибка при создании базы данных.${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${YELLOW}🔍 Проверяю подключение к новой базе данных...${NC}"

# Проверка подключения к новой базе данных
if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Подключение к базе данных '$DB_NAME' успешно!${NC}"
else
    echo -e "${RED}❌ Не удалось подключиться к базе данных '$DB_NAME'.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📊 Информация о базе данных:${NC}"
echo -e "${BLUE}  Хост: ${DB_HOST}${NC}"
echo -e "${BLUE}  Порт: ${DB_PORT}${NC}"
echo -e "${BLUE}  Пользователь: ${DB_USER}${NC}"
echo -e "${BLUE}  База данных: ${DB_NAME}${NC}"
echo -e "${BLUE}  URL: postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}${NC}"

echo ""
echo -e "${GREEN}🎉 База данных готова к использованию!${NC}"
echo -e "${BLUE}Теперь вы можете:${NC}"
echo -e "  1. Запустить миграции: npm run migrate"
echo -e "  2. Запустить бота: npm run start:dev"
echo -e "  3. Настроить webhook: ./setup-webhook.sh"
