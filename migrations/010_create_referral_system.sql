-- Миграция для создания реферальной системы
-- Создает таблицы для трехуровневой реферальной системы

-- Добавляем колонку referral_code в таблицу users
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) UNIQUE;

-- Создаем таблицу referrals для хранения связей рефералов
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(50) NOT NULL,
    level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referrer_id, referred_id),
    UNIQUE(referral_code)
);

-- Создаем индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_level ON referrals(level);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

-- Создаем таблицу referral_payments для хранения начислений
CREATE TABLE IF NOT EXISTS referral_payments (
    id SERIAL PRIMARY KEY,
    referral_id INTEGER NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    payer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    bonus_type VARCHAR(20) NOT NULL CHECK (bonus_type IN ('percentage', 'fixed')),
    bonus_value DECIMAL(10,2) NOT NULL CHECK (bonus_value > 0),
    level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    payment_reference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Создаем индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_referral_payments_referral_id ON referral_payments(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_payments_payer_id ON referral_payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_referral_payments_status ON referral_payments(status);
CREATE INDEX IF NOT EXISTS idx_referral_payments_level ON referral_payments(level);
CREATE INDEX IF NOT EXISTS idx_referral_payments_created_at ON referral_payments(created_at);

-- Создаем таблицу referral_stats для хранения статистики
CREATE TABLE IF NOT EXISTS referral_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    total_referrals INTEGER NOT NULL DEFAULT 0,
    level_1_referrals INTEGER NOT NULL DEFAULT 0,
    level_2_referrals INTEGER NOT NULL DEFAULT 0,
    level_3_referrals INTEGER NOT NULL DEFAULT 0,
    total_earned DECIMAL(10,2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем индекс для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_referral_stats_user_id ON referral_stats(user_id);

-- Создаем функцию для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создаем триггеры для автоматического обновления updated_at
CREATE TRIGGER update_referrals_updated_at 
    BEFORE UPDATE ON referrals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_payments_updated_at 
    BEFORE UPDATE ON referral_payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Создаем функцию для генерации реферального кода
CREATE OR REPLACE FUNCTION generate_referral_code(user_id INTEGER)
RETURNS VARCHAR(50) AS $$
DECLARE
    code VARCHAR(50);
    exists_count INTEGER;
BEGIN
    LOOP
        -- Генерируем код в формате REF{user_id}_{random_string}
        code := 'REF' || user_id || '_' || substring(md5(random()::text) from 1 for 8);
        
        -- Проверяем уникальность
        SELECT COUNT(*) INTO exists_count 
        FROM referrals 
        WHERE referral_code = code;
        
        -- Если код уникален, выходим из цикла
        IF exists_count = 0 THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Создаем функцию для обновления статистики рефералов
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
        user_id,
        COUNT(*) as total_referrals,
        COUNT(CASE WHEN level = 1 THEN 1 END) as level_1_referrals,
        COUNT(CASE WHEN level = 2 THEN 1 END) as level_2_referrals,
        COUNT(CASE WHEN level = 3 THEN 1 END) as level_3_referrals,
        COALESCE(SUM(rp.amount), 0) as total_earned,
        NOW() as last_updated
    FROM referrals r
    LEFT JOIN referral_payments rp ON r.id = rp.referral_id AND rp.status = 'paid'
    WHERE r.referrer_id = user_id
    GROUP BY user_id
    ON CONFLICT (user_id) DO UPDATE SET
        total_referrals = EXCLUDED.total_referrals,
        level_1_referrals = EXCLUDED.level_1_referrals,
        level_2_referrals = EXCLUDED.level_2_referrals,
        level_3_referrals = EXCLUDED.level_3_referrals,
        total_earned = EXCLUDED.total_earned,
        last_updated = EXCLUDED.last_updated;
END;
$$ LANGUAGE plpgsql;

-- Создаем функцию для начисления реферальных бонусов
CREATE OR REPLACE FUNCTION process_referral_payment(
    payer_user_id INTEGER,
    payment_amount DECIMAL(10,2),
    payment_reference VARCHAR(100) DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    referral_record RECORD;
    bonus_amount DECIMAL(10,2);
    bonus_rates DECIMAL(10,2)[] := ARRAY[0.10, 0.05, 0.02]; -- 10%, 5%, 2%
    level_index INTEGER;
BEGIN
    -- Находим всех рефералов в цепочке (до 3 уровней)
    FOR referral_record IN
        WITH RECURSIVE referral_chain AS (
            -- Начальный уровень - прямые рефералы
            SELECT 
                r.id as referral_id,
                r.referrer_id,
                r.referred_id,
                1 as level
            FROM referrals r
            WHERE r.referred_id = payer_user_id
            
            UNION ALL
            
            -- Рекурсивно находим рефералов рефералов
            SELECT 
                r.id as referral_id,
                r.referrer_id,
                r.referred_id,
                rc.level + 1
            FROM referrals r
            JOIN referral_chain rc ON r.referred_id = rc.referrer_id
            WHERE rc.level < 3
        )
        SELECT * FROM referral_chain
    LOOP
        -- Вычисляем размер бонуса
        level_index := referral_record.level;
        bonus_amount := payment_amount * bonus_rates[level_index];
        
        -- Создаем запись о начислении
        INSERT INTO referral_payments (
            referral_id,
            payer_id,
            amount,
            bonus_type,
            bonus_value,
            level,
            status,
            payment_reference
        ) VALUES (
            referral_record.referral_id,
            payer_user_id,
            bonus_amount,
            'percentage',
            bonus_rates[level_index] * 100,
            referral_record.level,
            'paid',
            payment_reference
        );
        
        -- Обновляем статистику реферала
        PERFORM update_referral_stats(referral_record.referrer_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Добавляем комментарии к таблицам
COMMENT ON TABLE referrals IS 'Таблица связей рефералов с трехуровневой структурой';
COMMENT ON TABLE referral_payments IS 'Таблица начислений по рефералам';
COMMENT ON TABLE referral_stats IS 'Таблица статистики рефералов по пользователям';

COMMENT ON COLUMN referrals.level IS 'Уровень реферала: 1 - прямой, 2 - реферал реферала, 3 - реферал реферала реферала';
COMMENT ON COLUMN referral_payments.bonus_type IS 'Тип бонуса: percentage - процент, fixed - фиксированная сумма';
COMMENT ON COLUMN referral_payments.bonus_value IS 'Значение бонуса: для percentage - процент, для fixed - сумма';
COMMENT ON COLUMN referral_stats.total_earned IS 'Общий заработок от рефералов';
