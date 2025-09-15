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
    // Сначала проверяем, существует ли таблица
    const tableExists = await this.pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      // Таблица существует, проверяем структуру
      const columns = await this.pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'migrations' 
        AND table_schema = 'public'
      `);
      
      const columnNames = columns.rows.map(row => row.column_name);
      
      // Если нет колонки filename, пересоздаем таблицу
      if (!columnNames.includes('filename')) {
        console.log('🔄 Обновляем структуру таблицы migrations...');
        await this.pool.query('DROP TABLE IF EXISTS migrations CASCADE');
        await this.pool.query(`
          CREATE TABLE migrations (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            checksum VARCHAR(64)
          );
        `);
        console.log('✅ Таблица migrations пересоздана с правильной структурой');
      } else {
        console.log('✅ Таблица migrations уже существует с правильной структурой');
      }
    } else {
      // Таблица не существует, создаем
      await this.pool.query(`
        CREATE TABLE migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          checksum VARCHAR(64)
        );
      `);
      console.log('✅ Таблица migrations создана');
    }
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
      .filter(file => !file.includes('011_fix_referral_stats_function.sql')) // Пропускаем проблемную миграцию
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
   * Проверяет существование необходимых таблиц
   */
  async checkRequiredTables() {
    const requiredTables = ['referrals', 'referral_payments', 'referral_stats'];
    const existingTables = await this.pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name = ANY($1)
    `, [requiredTables]);
    
    const existingTableNames = existingTables.rows.map(row => row.table_name);
    const missingTables = requiredTables.filter(table => !existingTableNames.includes(table));
    
    if (missingTables.length > 0) {
      console.log('⚠️  Отсутствуют необходимые таблицы:', missingTables.join(', '));
      console.log('📋 Выполняем миграцию 010_create_referral_system.sql для создания таблиц...');
      
      // Выполняем миграцию создания таблиц
      const createTablesMigration = 'migrations/010_create_referral_system.sql';
      if (this.getMigrationFiles().includes('010_create_referral_system.sql')) {
        await this.executeMigration('010_create_referral_system.sql');
      } else {
        throw new Error('Миграция 010_create_referral_system.sql не найдена');
      }
    } else {
      console.log('✅ Все необходимые таблицы существуют');
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

      // Проверяем существование необходимых таблиц
      await this.checkRequiredTables();

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
