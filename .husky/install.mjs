// Husky install script для совместимости с разными окружениями
import { existsSync } from 'fs';
import { execSync } from 'child_process';

const isCI = process.env.CI === 'true';
const isProduction = process.env.NODE_ENV === 'production';

if (isCI || isProduction) {
  console.log('⚠️  Пропускаем установку Husky в CI/Production окружении');
  process.exit(0);
}

if (!existsSync('.git')) {
  console.log('⚠️  Пропускаем установку Husky: не найден .git репозиторий');
  process.exit(0);
}

try {
  execSync('husky install', { stdio: 'inherit' });
  console.log('✅ Husky установлен успешно');
} catch (error) {
  console.log('⚠️  Husky не установлен, пропускаем...');
  process.exit(0);
}
