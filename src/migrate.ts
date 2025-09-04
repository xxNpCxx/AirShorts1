import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { Client } from "pg";
import * as dotenv from "dotenv";

// Загружаем переменные окружения
dotenv.config();

async function runMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("🔌 Подключение к базе данных...");
    await client.connect();
    console.log("✅ Подключение успешно");

    // Проверяем существующую структуру таблицы migrations
    let tableExists = false;
    let hasNameColumn = false;
    let hasFilenameColumn = false;

    try {
      const tableCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'migrations' 
        AND column_name = 'name'
      `);
      hasNameColumn = tableCheck.rows.length > 0;

      const filenameCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'migrations' 
        AND column_name = 'filename'
      `);
      hasFilenameColumn = filenameCheck.rows.length > 0;

      tableExists = true;
      console.log("🏗️ Таблица migrations уже существует");
    } catch {
      console.log("🏗️ Таблица migrations не существует, создаем новую");
    }

    // Создаем или обновляем таблицу migrations
    if (!tableExists) {
      console.log("🏗️ Создаем таблицу migrations...");
      await client.query(`
        CREATE TABLE migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("✅ Таблица migrations создана");
    } else if (!hasNameColumn && !hasFilenameColumn) {
      console.log("🔄 Обновляем существующую таблицу migrations...");
      try {
        await client.query(`
          ALTER TABLE migrations 
          ADD COLUMN name VARCHAR(255) UNIQUE
        `);
        await client.query(`
          ALTER TABLE migrations 
          ADD COLUMN executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);
        console.log("✅ Таблица migrations обновлена");
      } catch {
        console.log("⚠️ Некоторые колонки уже существуют, продолжаем...");
      }
    } else if (hasFilenameColumn && !hasNameColumn) {
      // Если есть filename, но нет name, переименовываем
      console.log("🔄 Переименовываем filename в name...");
      try {
        await client.query(`
          ALTER TABLE migrations 
          RENAME COLUMN filename TO name
        `);
        console.log("✅ Колонка filename переименована в name");
      } catch {
        console.log("⚠️ Ошибка при переименовании колонки");
      }
    } else {
      console.log("✅ Таблица migrations уже имеет правильную структуру");
    }

    // Читаем все SQL файлы миграций
    // В production (Render) папка migrations находится в корне проекта
    // В development папка migrations находится относительно src/
    const migrationsDir = process.env.NODE_ENV === 'production' 
      ? join(process.cwd(), "migrations")
      : join(__dirname, "../../migrations");
    
    console.log(`📁 Ищем миграции в: ${migrationsDir}`);
    
    // Проверяем существование папки миграций
    if (!existsSync(migrationsDir)) {
      console.log(`⚠️ Папка миграций не найдена: ${migrationsDir}`);
      console.log(`📁 Текущая рабочая директория: ${process.cwd()}`);
      console.log(`📁 __dirname: ${__dirname}`);
      console.log(`📁 NODE_ENV: ${process.env.NODE_ENV}`);
      return; // Выходим без ошибки, если папки нет
    }
    
    const migrationFiles = readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort(); // Сортируем по имени файла

    console.log(`📁 Найдено ${migrationFiles.length} файлов миграций`);

    let failuresCount = 0;

    for (const filename of migrationFiles) {
      try {
        // Проверяем, была ли миграция уже выполнена
        const { rows } = await client.query(
          "SELECT id FROM migrations WHERE name = $1",
          [filename],
        );

        if (rows.length > 0) {
          console.log(`⏭️  Миграция ${filename} уже выполнена, пропускаем`);
          continue;
        }

        console.log(`🚀 Выполняем миграцию: ${filename}`);
        const sqlPath = join(migrationsDir, filename);
        const sql = readFileSync(sqlPath, "utf8");

        // Выполняем весь файл одной транзакцией, без разбиения по ';'
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO migrations (name) VALUES ($1)", [
          filename,
        ]);
        await client.query("COMMIT");

        console.log(`✅ Миграция ${filename} выполнена успешно`);
      } catch (error) {
        failuresCount += 1;
        try {
          await client.query("ROLLBACK");
        } catch {
          // Игнорируем ошибку rollback
        }
        console.error(`❌ Ошибка при выполнении миграции ${filename}:`, error);
        // Продолжаем с другими миграциями
        continue;
      }
    }

    if (failuresCount === 0) {
      console.log("🎉 Все миграции выполнены успешно!");
    } else {
      console.log(
        `🏁 Миграции завершены с ошибками. Неуспешных: ${failuresCount}`,
      );
    }
  } catch (error) {
    console.error("❌ Ошибка при выполнении миграций:", error);
    throw error;
  } finally {
    await client.end();
  }
}

// Запускаем миграции если файл вызван напрямую
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log("🏁 Миграции завершены");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Критическая ошибка:", error);
      process.exit(1);
    });
}

export { runMigrations };
