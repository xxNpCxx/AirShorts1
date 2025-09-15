-- Финальное исправление функции update_referral_stats
-- Исправляет неоднозначные ссылки на колонки

DROP FUNCTION IF EXISTS update_referral_stats(INTEGER);

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
    WHERE r.referrer_id = $1  -- Используем параметр функции вместо неоднозначной ссылки
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
