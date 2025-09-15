#!/usr/bin/env node

/**
 * Диагностический скрипт для проверки структуры базы данных
 */

const { Pool } = require('pg');

async function checkDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Проверяем структуру базы данных...\n');

    // Проверяем существующие таблицы
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 Существующие таблицы:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    console.log('');

    // Проверяем структуру таблицы referrals
    if (tables.rows.some(row => row.table_name === 'referrals')) {
      console.log('🔍 Структура таблицы referrals:');
      const referralsColumns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'referrals' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      referralsColumns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      console.log('');
    } else {
      console.log('❌ Таблица referrals не существует!\n');
    }

    // Проверяем структуру таблицы referral_payments
    if (tables.rows.some(row => row.table_name === 'referral_payments')) {
      console.log('🔍 Структура таблицы referral_payments:');
      const paymentsColumns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'referral_payments' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      paymentsColumns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      console.log('');
    } else {
      console.log('❌ Таблица referral_payments не существует!\n');
    }

    // Проверяем структуру таблицы referral_stats
    if (tables.rows.some(row => row.table_name === 'referral_stats')) {
      console.log('🔍 Структура таблицы referral_stats:');
      const statsColumns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'referral_stats' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      statsColumns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      console.log('');
    } else {
      console.log('❌ Таблица referral_stats не существует!\n');
    }

    // Проверяем существующие функции
    const functions = await pool.query(`
      SELECT routine_name, routine_type
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
      AND routine_name LIKE '%referral%'
      ORDER BY routine_name;
    `);
    
    console.log('🔧 Существующие функции:');
    functions.rows.forEach(func => {
      console.log(`  - ${func.routine_name} (${func.routine_type})`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Ошибка при проверке базы данных:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkDatabase();
}

module.exports = { checkDatabase };
