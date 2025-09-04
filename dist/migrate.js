"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const fs_1 = require("fs");
const path_1 = require("path");
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function runMigrations() {
    console.log("🚀 Запуск миграций базы данных...");
    console.log(`📁 NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`📁 process.cwd(): ${process.cwd()}`);
    console.log(`📁 __dirname: ${__dirname}`);
    console.log(`📁 DATABASE_URL: ${process.env.DATABASE_URL ? "установлен" : "НЕ УСТАНОВЛЕН"}`);
    const client = new pg_1.Client({
        connectionString: process.env.DATABASE_URL,
    });
    try {
        console.log("🔌 Подключение к базе данных...");
        await client.connect();
        console.log("✅ Подключение успешно");
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
        }
        catch {
            console.log("🏗️ Таблица migrations не существует, создаем новую");
        }
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
        }
        else if (!hasNameColumn && !hasFilenameColumn) {
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
            }
            catch {
                console.log("⚠️ Некоторые колонки уже существуют, продолжаем...");
            }
        }
        else if (hasFilenameColumn && !hasNameColumn) {
            console.log("🔄 Переименовываем filename в name...");
            try {
                await client.query(`
          ALTER TABLE migrations 
          RENAME COLUMN filename TO name
        `);
                console.log("✅ Колонка filename переименована в name");
            }
            catch {
                console.log("⚠️ Ошибка при переименовании колонки");
            }
        }
        else {
            console.log("✅ Таблица migrations уже имеет правильную структуру");
        }
        const migrationsDir = process.cwd().includes('/opt/render/project')
            ? (0, path_1.join)(process.cwd(), "..", "migrations")
            : (0, path_1.join)(__dirname, "../../migrations");
        console.log(`📁 Ищем миграции в: ${migrationsDir}`);
        if (!(0, fs_1.existsSync)(migrationsDir)) {
            console.log(`⚠️ Папка миграций не найдена: ${migrationsDir}`);
            console.log(`📁 Текущая рабочая директория: ${process.cwd()}`);
            console.log(`📁 __dirname: ${__dirname}`);
            console.log(`📁 NODE_ENV: ${process.env.NODE_ENV}`);
            return;
        }
        const migrationFiles = (0, fs_1.readdirSync)(migrationsDir)
            .filter((file) => file.endsWith(".sql"))
            .sort();
        console.log(`📁 Найдено ${migrationFiles.length} файлов миграций`);
        let failuresCount = 0;
        for (const filename of migrationFiles) {
            try {
                const { rows } = await client.query("SELECT id FROM migrations WHERE name = $1", [filename]);
                if (rows.length > 0) {
                    console.log(`⏭️  Миграция ${filename} уже выполнена, пропускаем`);
                    continue;
                }
                console.log(`🚀 Выполняем миграцию: ${filename}`);
                const sqlPath = (0, path_1.join)(migrationsDir, filename);
                const sql = (0, fs_1.readFileSync)(sqlPath, "utf8");
                await client.query("BEGIN");
                await client.query(sql);
                await client.query("INSERT INTO migrations (name) VALUES ($1)", [
                    filename,
                ]);
                await client.query("COMMIT");
                console.log(`✅ Миграция ${filename} выполнена успешно`);
            }
            catch (error) {
                failuresCount += 1;
                try {
                    await client.query("ROLLBACK");
                }
                catch {
                }
                console.error(`❌ Ошибка при выполнении миграции ${filename}:`, error);
                continue;
            }
        }
        if (failuresCount === 0) {
            console.log("🎉 Все миграции выполнены успешно!");
        }
        else {
            console.log(`🏁 Миграции завершены с ошибками. Неуспешных: ${failuresCount}`);
        }
    }
    catch (error) {
        console.error("❌ Ошибка при выполнении миграций:", error);
        throw error;
    }
    finally {
        await client.end();
    }
}
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
//# sourceMappingURL=migrate.js.map