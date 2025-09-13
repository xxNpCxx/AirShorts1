# 🛡️ Система контроля качества

Этот документ описывает настроенную систему проверок качества кода в проекте.

## 🔧 Настроенные инструменты

### 1. **TypeScript** - Проверка типов
- **Команда**: `npm run type-check`
- **Описание**: Быстрая проверка типов без генерации файлов
- **Настройка**: `tsconfig.json`

### 2. **ESLint** - Линтинг кода
- **Команда**: `npm run lint` (с автоисправлением)
- **Проверка**: `npm run lint:check`
- **Настройка**: `eslint.config.cjs`
- **Правила**: TypeScript, Prettier, NestJS-специфичные

### 3. **Prettier** - Форматирование кода
- **Команда**: `npm run format` (с автоисправлением)
- **Проверка**: `npm run format:check`
- **Настройка**: `.prettierrc`, `.prettierignore`

### 4. **Husky** - Git hooks
- **Pre-commit**: Автоматическая проверка перед коммитом
- **Commit-msg**: Проверка формата сообщений коммитов
- **Настройка**: `.husky/` директория

### 5. **Lint-staged** - Проверка измененных файлов
- **Описание**: Запускает проверки только для измененных файлов
- **Настройка**: `package.json` → `lint-staged`

### 6. **Commitlint** - Проверка сообщений коммитов
- **Стандарт**: Conventional Commits
- **Настройка**: `commitlint.config.js`

### 7. **npm audit** - Проверка безопасности
- **Команда**: `npm run audit`
- **Исправление**: `npm run audit:fix`

## 🚀 Команды для проверки

### Быстрые проверки
```bash
# Проверка типов
npm run type-check

# Проверка линтинга
npm run lint:check

# Проверка форматирования
npm run format:check

# Сборка проекта
npm run build
```

### Полная проверка
```bash
# Все проверки сразу
npm run validate

# Проверка безопасности
npm run security

# Полная проверка перед деплоем
npm run pre-deploy
```

### Автоисправление
```bash
# Исправить линтинг
npm run lint

# Исправить форматирование
npm run format

# Исправить уязвимости
npm run audit:fix
```

## 🔄 Автоматические проверки

### Pre-commit hook
При каждом коммите автоматически запускается:
1. ✅ Проверка TypeScript
2. ✅ Линтинг и форматирование измененных файлов
3. ✅ Проверка безопасности (только высокий уровень)

### Commit-msg hook
Проверяет формат сообщений коммитов:
```
feat: add new feature
fix: resolve bug
docs: update documentation
style: format code
refactor: improve code structure
test: add tests
chore: update dependencies
```

## 📋 Уровни проверок

### 🟢 Уровень 1: Базовые проверки (всегда включены)
- TypeScript компиляция
- Базовый линтинг
- Форматирование кода

### 🟡 Уровень 2: Расширенные проверки (warnings)
- Строгие TypeScript правила
- Предупреждения о `any` типах
- Проверка неиспользуемых переменных

### 🔴 Уровень 3: Строгие проверки (errors)
- Критические ошибки TypeScript
- Ошибки линтинга
- Нарушения форматирования

## 🛠️ Настройка для разработки

### VS Code настройки
Создайте `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### Игнорирование файлов
- **ESLint**: `eslint.config.cjs` → `ignores`
- **Prettier**: `.prettierignore`
- **TypeScript**: `tsconfig.json` → `exclude`

## 🚨 Устранение проблем

### TypeScript ошибки
```bash
# Проверить конкретный файл
npx tsc --noEmit src/path/to/file.ts

# Подробный вывод
npx tsc --noEmit --pretty
```

### ESLint ошибки
```bash
# Проверить конкретный файл
npx eslint src/path/to/file.ts

# Автоисправление
npx eslint src/path/to/file.ts --fix
```

### Prettier ошибки
```bash
# Проверить форматирование
npx prettier --check src/**/*.ts

# Автоисправление
npx prettier --write src/**/*.ts
```

## 📊 Мониторинг качества

### Метрики
- Количество TypeScript ошибок: 0
- Количество ESLint предупреждений: ~46 (mostly `any` types)
- Покрытие форматированием: 100%
- Время сборки: ~2-3 секунды

### Рекомендации по улучшению
1. Постепенно заменять `any` типы на конкретные
2. Добавить unit тесты
3. Настроить CI/CD с автоматическими проверками
4. Добавить проверку покрытия кода

## 🔧 Кастомизация

### Изменение правил ESLint
Отредактируйте `eslint.config.cjs`:
```javascript
rules: {
  '@typescript-eslint/no-explicit-any': 'error', // Изменить с 'warn' на 'error'
  // Добавить новые правила
}
```

### Изменение настроек Prettier
Отредактируйте `.prettierrc`:
```json
{
  "printWidth": 120,  // Изменить ширину строки
  "tabWidth": 4       // Изменить размер табуляции
}
```

### Добавление новых проверок
1. Установите пакет: `npm install --save-dev package-name`
2. Добавьте в `package.json` → `scripts`
3. Обновите `.husky/pre-commit` или `lint-staged`

## 📚 Полезные ссылки

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Husky Documentation](https://typicode.github.io/husky/)
