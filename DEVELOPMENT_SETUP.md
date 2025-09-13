# 🚀 Настройка для разработки

Этот документ описывает, как настроить проект для локальной разработки.

## 📋 Предварительные требования

- **Node.js**: v22.19.0 (рекомендуется) или v22.17.1+
- **npm**: v10.0.0+
- **Git**: последняя версия

## 🔧 Установка

### 1. Клонирование репозитория
```bash
git clone https://github.com/xxNpCxx/AirShorts1.git
cd AirShorts1
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Настройка окружения
```bash
# Скопируйте файл с переменными окружения
cp .env.example .env

# Отредактируйте .env файл с вашими настройками
nano .env
```

### 4. Настройка Git Hooks (Husky)
```bash
# Автоматическая настройка (рекомендуется)
npm run setup-husky

# Или ручная настройка
npx husky install
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

## 🛠️ Команды разработки

### Основные команды
```bash
# Запуск в режиме разработки
npm run start:dev

# Запуск в режиме отладки
npm run start:debug

# Сборка проекта
npm run build

# Запуск собранного проекта
npm run start:prod
```

### Проверки качества кода
```bash
# Проверка TypeScript
npm run type-check

# Проверка линтинга
npm run lint:check

# Автоисправление линтинга
npm run lint

# Проверка форматирования
npm run format:check

# Автоисправление форматирования
npm run format

# Полная проверка
npm run validate
```

### Проверка безопасности
```bash
# Проверка уязвимостей
npm run security

# Исправление уязвимостей
npm run audit:fix
```

### База данных
```bash
# Запуск миграций
npm run migrate
```

## 🔄 Git Workflow

### Формат коммитов
Используйте [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Примеры корректных коммитов
git commit -m "feat: add new feature"
git commit -m "fix: resolve authentication bug"
git commit -m "docs: update README"
git commit -m "style: format code with prettier"
git commit -m "refactor: improve code structure"
git commit -m "test: add unit tests"
git commit -m "chore: update dependencies"
```

### Автоматические проверки
При каждом коммите автоматически запускаются:
- ✅ TypeScript проверка
- ✅ ESLint линтинг
- ✅ Prettier форматирование
- ✅ Проверка безопасности

## 🐛 Устранение проблем

### Husky не работает
```bash
# Переустановите husky
npm run setup-husky

# Проверьте права доступа
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### TypeScript ошибки
```bash
# Проверьте конкретный файл
npx tsc --noEmit src/path/to/file.ts

# Очистите кэш TypeScript
rm -rf dist/
npm run build
```

### ESLint ошибки
```bash
# Автоисправление
npm run lint

# Проверка конкретного файла
npx eslint src/path/to/file.ts --fix
```

### Prettier ошибки
```bash
# Автоисправление
npm run format

# Проверка конкретного файла
npx prettier --write src/path/to/file.ts
```

## 🔧 Настройка IDE

### VS Code
Создайте `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### Рекомендуемые расширения
- **ESLint** - проверка кода
- **Prettier** - форматирование
- **TypeScript Importer** - автодополнение импортов
- **GitLens** - работа с Git

## 📊 Мониторинг качества

### Текущие метрики
- **TypeScript ошибки**: 0
- **ESLint предупреждения**: ~46 (в основном `any` типы)
- **Покрытие форматированием**: 100%
- **Время сборки**: ~2-3 секунды

### Цели по улучшению
1. Уменьшить количество `any` типов до 0
2. Добавить unit тесты
3. Настроить покрытие кода
4. Добавить интеграционные тесты

## 🚀 Деплой

### Локальная проверка перед деплоем
```bash
# Полная проверка
npm run pre-deploy
```

### Render.com
Проект автоматически деплоится при push в main ветку.

## 📚 Полезные ссылки

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Husky Documentation](https://typicode.github.io/husky/)

## ❓ Часто задаваемые вопросы

### Q: Почему коммит блокируется?
A: Проверьте вывод ошибок в терминале. Обычно это TypeScript ошибки или проблемы с линтингом.

### Q: Как отключить проверки временно?
A: Используйте `git commit --no-verify`, но это не рекомендуется.

### Q: Как исправить все ошибки форматирования сразу?
A: Запустите `npm run format` - это исправит все файлы автоматически.

### Q: Husky не работает на Windows
A: Убедитесь, что Git Bash используется как терминал, или запустите `npm run setup-husky`.
