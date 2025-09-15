#!/usr/bin/env node

/**
 * Простой скрипт для выполнения миграций без NestJS
 * Используется на Render.com для автоматического выполнения миграций
 */

const { Pool } = require('pg');
const { readFileSync, readdirSync } = require('fs');
const { join } = require('path');
const crypto = require('crypto');

class SimpleMigrationRunner {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  /**
   * Создает таблицу для отслеживания выполненных миграций
   */
  async createMigrationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        checksum VARCHAR(64)
      );
    `;
    
    await this.pool.query(query);
    console.log('✅ Таблица migrations создана/проверена');
  }

  /**
   * Получает список уже выполненных миграций
   */
  async getExecutedMigrations() {
    const result = await this.pool.query('SELECT filename FROM migrations ORDER BY id');
    return result.rows.map(row => row.filename);
  }

  /**
   * Получает список всех файлов миграций
   */
  getMigrationFiles() {
    const migrationsDir = join(process.cwd(), 'migrations');
    const files = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Сортируем по имени файла
    
    return files;
  }

  /**
   * Вычисляет контрольную сумму файла
   */
  calculateChecksum(content) {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Выполняет миграцию
   */
  async executeMigration(filename) {
    const filePath = join(process.cwd(), 'migrations', filename);
    const content = readFileSync(filePath, 'utf8');
    const checksum = this.calculateChecksum(content);

    console.log(`🔄 Выполняем миграцию: ${filename}`);

    try {
      // Выполняем SQL из файла
      await this.pool.query(content);
      
      // Записываем информацию о выполненной миграции
      await this.pool.query(
        'INSERT INTO migrations (filename, checksum) VALUES ($1, $2) ON CONFLICT (filename) DO NOTHING',
        [filename, checksum]
      );

      console.log(`✅ Миграция ${filename} выполнена успешно`);
    } catch (error) {
      console.error(`❌ Ошибка выполнения миграции ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Запускает все невыполненные миграции
   */
  async runMigrations() {
    try {
      console.log('🚀 Запуск системы миграций...');

      // Создаем таблицу для отслеживания миграций
      await this.createMigrationsTable();

      // Получаем списки миграций
      const executedMigrations = await this.getExecutedMigrations();
      const allMigrations = this.getMigrationFiles();

      // Находим невыполненные миграции
      const pendingMigrations = allMigrations.filter(
        migration => !executedMigrations.includes(migration)
      );

      if (pendingMigrations.length === 0) {
        console.log('✅ Все миграции уже выполнены');
        return;
      }

      console.log(`📋 Найдено ${pendingMigrations.length} невыполненных миграций`);

      // Выполняем каждую миграцию
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }

      console.log('🎉 Все миграции выполнены успешно!');
    } catch (error) {
      console.error('❌ Критическая ошибка при выполнении миграций:', error);
      throw error;
    } finally {
      await this.pool.end();
    }
  }
}

async function main() {
  console.log('🚀 Запуск миграций...');
  
  // Проверяем наличие переменной DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ Ошибка: переменная DATABASE_URL не установлена');
    process.exit(1);
  }

  try {
    const runner = new SimpleMigrationRunner();
    await runner.runMigrations();
    console.log('🎉 Миграции завершены успешно!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при выполнении миграций:', error);
    process.exit(1);
  }
}

// Запускаем только если файл вызван напрямую
if (require.main === module) {
  main();
}

module.exports = { SimpleMigrationRunner };
