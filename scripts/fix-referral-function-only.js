#!/usr/bin/env node

/**
 * Простой скрипт для исправления только функции update_referral_stats
 * Без выполнения других миграций
 */

const { Pool } = require('pg');

async function fixReferralFunction() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔧 Исправляем только функцию update_referral_stats...');

    // Проверяем, что необходимые таблицы существуют
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('referrals', 'referral_payments', 'referral_stats')
    `);
    
    const existingTables = tables.rows.map(row => row.table_name);
    const requiredTables = ['referrals', 'referral_payments', 'referral_stats'];
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('❌ Отсутствуют необходимые таблицы:', missingTables.join(', '));
      console.log('⚠️  Сначала нужно создать таблицы через миграцию 010_create_referral_system.sql');
      process.exit(1);
    }

    console.log('✅ Все необходимые таблицы существуют');

    // Удаляем старую функцию
    console.log('🔄 Удаляем старую функцию update_referral_stats...');
    await pool.query('DROP FUNCTION IF EXISTS update_referral_stats(INTEGER)');

    // Создаем исправленную функцию
    console.log('🔄 Создаем исправленную функцию update_referral_stats...');
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_referral_stats(user_id INTEGER)
      RETURNS VOID AS $$
      BEGIN
          INSERT INTO referral_stats (
              user_id, 
              total_referrals, 
              level_1_referrals, 
              level_2_referrals, 
              level_3_referrals,
              total_earned,
              last_updated
          )
          SELECT 
              r.referrer_id as user_id,
              COUNT(*) as total_referrals,
              COUNT(CASE WHEN r.level = 1 THEN 1 END) as level_1_referrals,
              COUNT(CASE WHEN r.level = 2 THEN 1 END) as level_2_referrals,
              COUNT(CASE WHEN r.level = 3 THEN 1 END) as level_3_referrals,
              COALESCE(SUM(rp.amount), 0) as total_earned,
              NOW() as last_updated
          FROM referrals r
          LEFT JOIN referral_payments rp ON r.id = rp.referral_id AND rp.status = 'paid'
          WHERE r.referrer_id = $1
          GROUP BY r.referrer_id
          ON CONFLICT (user_id) DO UPDATE SET
              total_referrals = EXCLUDED.total_referrals,
              level_1_referrals = EXCLUDED.level_1_referrals,
              level_2_referrals = EXCLUDED.level_2_referrals,
              level_3_referrals = EXCLUDED.level_3_referrals,
              total_earned = EXCLUDED.total_earned,
              last_updated = EXCLUDED.last_updated;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ Функция update_referral_stats успешно исправлена!');
    console.log('🎉 Исправление завершено - кнопки статистики должны работать!');

  } catch (error) {
    console.error('❌ Ошибка при исправлении функции:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  fixReferralFunction();
}

module.exports = { fixReferralFunction };
