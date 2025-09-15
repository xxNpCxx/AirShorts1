import { Injectable, OnModuleInit } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { MigrationRunner } from './migration-runner';
import { Logger } from '@nestjs/common';

export const PG_POOL = 'PG_POOL';

@Injectable()
export class MigrationsService implements OnModuleInit {
  private readonly logger = new Logger(MigrationsService.name);
  private readonly migrationRunner: MigrationRunner;

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {
    this.migrationRunner = new MigrationRunner(pool);
  }

  async onModuleInit() {
    // Запускаем миграции при старте приложения
    await this.runMigrations();
  }

  /**
   * Запускает все невыполненные миграции
   */
  async runMigrations(): Promise<void> {
    try {
      this.logger.log('🔄 Запуск миграций при старте приложения...');
      await this.migrationRunner.runMigrations();
    } catch (error) {
      this.logger.error('❌ Ошибка при выполнении миграций:', error);
      // Не прерываем запуск приложения, только логируем ошибку
    }
  }

  /**
   * Получает статус миграций
   */
  async getStatus() {
    return await this.migrationRunner.getMigrationStatus();
  }

  /**
   * Принудительно запускает миграции (для ручного вызова)
   */
  async forceRunMigrations(): Promise<void> {
    this.logger.log('🔄 Принудительный запуск миграций...');
    await this.migrationRunner.runMigrations();
  }
}
