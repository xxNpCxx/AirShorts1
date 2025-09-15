import { Module } from '@nestjs/common';
import { MigrationsService } from './migrations.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [MigrationsService],
  exports: [MigrationsService],
})
export class MigrationsModule {}
