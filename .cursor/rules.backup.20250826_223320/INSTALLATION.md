# 📦 Установка правил разработки

## ✅ Что установлено

Пакет `@v.ignatov/development-rules` успешно установлен и содержит:

- **security.mdc** - Правила безопасности для Telegram ботов
- **architecture.mdc** - Архитектурные принципы NestJS + Telegraf
- **best-practices.mdc** - Лучшие практики разработки
- **README.md** - Общая документация пакета

## 🚀 Как использовать

### 1. Автоматическое применение
```bash
# Применить правила к проекту
npx @v.ignatov/development-rules apply telegram-bot .

# Или использовать скрипт
./node_modules/@v.ignatov/development-rules/apply-rules.sh telegram-bot .
```

### 2. Ручное копирование
```bash
# Скопировать правила в .cursor/rules/
cp -r node_modules/@v.ignatov/development-rules/telegram-bot/* .cursor/rules/
```

### 3. Обновление правил
```bash
# Обновить пакет
npm update @v.ignatov/development-rules

# Перекопировать правила
cp -r node_modules/@v.ignatov/development-rules/telegram-bot/* .cursor/rules/
```

## 🔧 Интеграция с Cursor AI

Cursor AI автоматически читает правила из `.cursor/rules/` и применяет их к проекту.

## 📚 Документация

- **README.md** - Общий обзор пакета
- **security.mdc** - Безопасность Telegram ботов
- **architecture.mdc** - Архитектура NestJS + Telegraf
- **best-practices.mdc** - Лучшие практики

## 🎯 Следующие шаги

1. Изучите правила в каждом файле
2. Примените их к вашему коду
3. Обновляйте правила при необходимости
4. Делитесь опытом с сообществом

---

**Помни: Хорошо структурированные правила - залог качественной разработки!**
