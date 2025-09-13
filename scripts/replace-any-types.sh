#!/bin/bash
# Скрипт для поиска и замены any типов

echo "🔍 Поиск any типов в проекте..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода ошибок
error() {
    echo -e "${RED}❌ $1${NC}"
}

# Функция для вывода успеха
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Функция для вывода предупреждений
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Функция для вывода информации
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Поиск any типов
echo "📊 Статистика any типов:"
echo ""

# Подсчет any типов по файлам
echo "Файлы с any типами:"
grep -r "any" src/ --include="*.ts" --exclude="*.d.ts" | grep -v "// any" | cut -d: -f1 | sort | uniq -c | sort -nr

echo ""
echo "Общее количество any типов:"
any_count=$(grep -r "any" src/ --include="*.ts" --exclude="*.d.ts" | grep -v "// any" | wc -l)
echo "$any_count"

echo ""
echo "Топ-10 файлов с any типами:"
grep -r "any" src/ --include="*.ts" --exclude="*.d.ts" | grep -v "// any" | cut -d: -f1 | sort | uniq -c | sort -nr | head -10

echo ""
echo "Примеры any типов:"
grep -r "any" src/ --include="*.ts" --exclude="*.d.ts" | grep -v "// any" | head -5

echo ""
echo "🔧 Рекомендации по замене:"
echo ""

# Анализ типов any
echo "1. Параметры функций:"
grep -r "any" src/ --include="*.ts" --exclude="*.d.ts" | grep -v "// any" | grep "function\|=>" | head -3

echo ""
echo "2. Свойства объектов:"
grep -r "any" src/ --include="*.ts" --exclude="*.d.ts" | grep -v "// any" | grep ":" | head -3

echo ""
echo "3. Массивы:"
grep -r "any\[\]" src/ --include="*.ts" --exclude="*.d.ts" | grep -v "// any" | head -3

echo ""
echo "📋 План замены any типов:"
echo ""

# Создание отчета
report_file="ANY_TYPES_REPORT.md"
cat > "$report_file" << EOF
# 📊 Отчет по any типам

## Статистика
- **Общее количество any типов**: $any_count
- **Дата анализа**: $(date)

## Файлы с any типами

EOF

grep -r "any" src/ --include="*.ts" --exclude="*.d.ts" | grep -v "// any" | cut -d: -f1 | sort | uniq -c | sort -nr >> "$report_file"

cat >> "$report_file" << EOF

## Примеры any типов

EOF

grep -r "any" src/ --include="*.ts" --exclude="*.d.ts" | grep -v "// any" | head -10 >> "$report_file"

cat >> "$report_file" << EOF

## Рекомендации

### 1. Замените any на конкретные типы
\`\`\`typescript
// ❌ Плохо
function processData(data: any) {
  return data.someProperty;
}

// ✅ Хорошо
function processData(data: unknown) {
  if (isValidData(data)) {
    return data.someProperty;
  }
}
\`\`\`

### 2. Используйте type guards
\`\`\`typescript
// ❌ Плохо
if (typeof data === 'object' && data !== null) {
  // data все еще any
}

// ✅ Хорошо
if (isTelegramUpdate(data)) {
  // data теперь типизирован как TelegramUpdate
}
\`\`\`

### 3. Валидируйте входные данные
\`\`\`typescript
// ❌ Плохо
function createUser(userData: any) {
  // Прямое использование
}

// ✅ Хорошо
function createUser(userData: unknown) {
  const validation = validateCreateUserData(userData);
  if (!validation.isValid) {
    throw new Error('Invalid user data');
  }
  // userData теперь типизирован
}
\`\`\`

## План действий

1. **Приоритет 1**: Замените any в API контроллерах
2. **Приоритет 2**: Замените any в сервисах
3. **Приоритет 3**: Замените any в утилитах
4. **Приоритет 4**: Замените any в типах

## Полезные команды

\`\`\`bash
# Найти все any типы
grep -r "any" src/ --include="*.ts" | grep -v "// any"

# Найти any в конкретном файле
grep "any" src/path/to/file.ts

# Проверить типы
npm run type-check
\`\`\`
EOF

success "Отчет создан: $report_file"

echo ""
echo "🎯 Следующие шаги:"
echo "1. Изучите отчет: $report_file"
echo "2. Начните замену any типов с приоритетных файлов"
echo "3. Используйте созданные типы из src/types/"
echo "4. Проверяйте типы командой: npm run type-check"
echo ""
echo "📚 Документация по типам: TYPES_DOCUMENTATION.md"
