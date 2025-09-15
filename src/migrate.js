#!/usr/bin/env node

/**
 * Скрипт для ручного запуска миграций (JavaScript версия)
 * Использование: node dist/migrate.js
 */

const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./app.module');
const { MigrationsService } = require('./migrations/migrations.service');

async function runMigrations() {
  console.log('🚀 Запуск миграций...');

  try {
    // Создаем временное приложение только для миграций
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['log', 'error', 'warn'],
    });

    // Получаем сервис миграций
    const migrationsService = app.get(MigrationsService);

    // Показываем текущий статус
    const status = await migrationsService.getStatus();
    console.log('📊 Статус миграций:');
    console.log(`   Всего миграций: ${status.total}`);
    console.log(`   Выполнено: ${status.executed}`);
    console.log(`   Ожидает: ${status.pending}`);

    if (status.pending > 0) {
      console.log('⏳ Невыполненные миграции:', status.pendingMigrations.join(', '));
    }

    // Запускаем миграции
    await migrationsService.forceRunMigrations();

    // Показываем финальный статус
    const finalStatus = await migrationsService.getStatus();
    console.log('✅ Финальный статус:');
    console.log(`   Всего миграций: ${finalStatus.total}`);
    console.log(`   Выполнено: ${finalStatus.executed}`);
    console.log(`   Ожидает: ${finalStatus.pending}`);

    await app.close();
    console.log('🎉 Миграции завершены успешно!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при выполнении миграций:', error);
    process.exit(1);
  }
}

// Запускаем только если файл вызван напрямую
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
