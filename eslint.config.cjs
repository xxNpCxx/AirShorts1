const js = require('@eslint/js');
const typescript = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const prettier = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
      globals: {
        // Node.js globals
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        // Jest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        // Node.js globals
        AbortController: 'readonly',
        AbortSignal: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      prettier: prettier,
    },
    rules: {
      // TypeScript правила
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off', // Отключаем для упрощения
      '@typescript-eslint/explicit-module-boundary-types': 'off', // Отключаем для упрощения
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'off', // Отключаем, так как TypeScript сам проверяет использование
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/prefer-readonly': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      
      // Общие правила
      'no-unused-vars': 'off', // Отключаем базовое правило, так как TypeScript сам проверяет
      'no-console': 'off', // Разрешаем console для разработки
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'no-empty': 'warn',
      
      // NestJS специфичные правила
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/ban-types': 'off',
      
      // Prettier
      'prettier/prettier': 'error',
    },
  },
  {
    ignores: [
      'dist/**/*', 
      'node_modules/**/*', 
      '.eslintrc.js', 
      '.eslintignore',
      'coverage/**/*',
      '*.js',
      '*.d.ts',
      '.env*',
      '.env.example',
      '.env.local',
      '.env.development.local',
      '.env.test.local',
      '.env.production.local',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      'lerna-debug.log*',
      '.pnp.*'
    ],
  },
  prettierConfig,
];
