import { Pool } from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { Logger } from '@nestjs/common';

export class MigrationRunner {
  private readonly logger = new Logger(MigrationRunner.name);
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Создает таблицу для отслеживания выполненных миграций
   */
  private async createMigrationsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        checksum VARCHAR(64)
      );
    `;
    
    await this.pool.query(query);
    this.logger.log('✅ Таблица migrations создана/проверена');
  }

  /**
   * Получает список уже выполненных миграций
   */
  private async getExecutedMigrations(): Promise<string[]> {
    const result = await this.pool.query('SELECT filename FROM migrations ORDER BY id');
    return result.rows.map(row => row.filename);
  }

  /**
   * Получает список всех файлов миграций
   */
  private getMigrationFiles(): string[] {
    const migrationsDir = join(process.cwd(), 'migrations');
    const files = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Сортируем по имени файла
    
    return files;
  }

  /**
   * Вычисляет контрольную сумму файла
   */
  private calculateChecksum(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Выполняет миграцию
   */
  private async executeMigration(filename: string): Promise<void> {
    const filePath = join(process.cwd(), 'migrations', filename);
    const content = readFileSync(filePath, 'utf8');
    const checksum = this.calculateChecksum(content);

    this.logger.log(`🔄 Выполняем миграцию: ${filename}`);

    try {
      // Выполняем SQL из файла
      await this.pool.query(content);
      
      // Записываем информацию о выполненной миграции
      await this.pool.query(
        'INSERT INTO migrations (filename, checksum) VALUES ($1, $2) ON CONFLICT (filename) DO NOTHING',
        [filename, checksum]
      );

      this.logger.log(`✅ Миграция ${filename} выполнена успешно`);
    } catch (error) {
      this.logger.error(`❌ Ошибка выполнения миграции ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Запускает все невыполненные миграции
   */
  async runMigrations(): Promise<void> {
    try {
      this.logger.log('🚀 Запуск системы миграций...');

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
        this.logger.log('✅ Все миграции уже выполнены');
        return;
      }

      this.logger.log(`📋 Найдено ${pendingMigrations.length} невыполненных миграций`);

      // Выполняем каждую миграцию
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }

      this.logger.log('🎉 Все миграции выполнены успешно!');
    } catch (error) {
      this.logger.error('❌ Критическая ошибка при выполнении миграций:', error);
      throw error;
    }
  }

  /**
   * Проверяет статус миграций
   */
  async getMigrationStatus(): Promise<{
    total: number;
    executed: number;
    pending: number;
    executedMigrations: string[];
    pendingMigrations: string[];
  }> {
    await this.createMigrationsTable();
    
    const executedMigrations = await this.getExecutedMigrations();
    const allMigrations = this.getMigrationFiles();
    const pendingMigrations = allMigrations.filter(
      migration => !executedMigrations.includes(migration)
    );

    return {
      total: allMigrations.length,
      executed: executedMigrations.length,
      pending: pendingMigrations.length,
      executedMigrations,
      pendingMigrations,
    };
  }
}
