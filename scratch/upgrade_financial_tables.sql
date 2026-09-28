DO $$
DECLARE
    schema_rec RECORD;
BEGIN
    FOR schema_rec IN 
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name LIKE 'tenant_%'
    LOOP
        -- Add enhanced columns to financial_charges
        EXECUTE format('ALTER TABLE %I.financial_charges ADD COLUMN IF NOT EXISTS period_year INT;', schema_rec.schema_name);
        EXECUTE format('ALTER TABLE %I.financial_charges ADD COLUMN IF NOT EXISTS period_month INT;', schema_rec.schema_name);
        EXECUTE format('ALTER TABLE %I.financial_charges ADD COLUMN IF NOT EXISTS balance_due NUMERIC(12,2);', schema_rec.schema_name);
        EXECUTE format('ALTER TABLE %I.financial_charges ADD COLUMN IF NOT EXISTS notes TEXT;', schema_rec.schema_name);

        -- Set balance_due = amount where balance_due IS NULL and status = 'PENDING'
        EXECUTE format('UPDATE %I.financial_charges SET balance_due = amount WHERE balance_due IS NULL;', schema_rec.schema_name);

        -- Add enhanced columns to financial_payments
        EXECUTE format('ALTER TABLE %I.financial_payments ADD COLUMN IF NOT EXISTS received_by_name VARCHAR(120);', schema_rec.schema_name);
        EXECUTE format('ALTER TABLE %I.financial_payments ADD COLUMN IF NOT EXISTS payer_name VARCHAR(120);', schema_rec.schema_name);
        EXECUTE format('ALTER TABLE %I.financial_payments ADD COLUMN IF NOT EXISTS notes TEXT;', schema_rec.schema_name);
        EXECUTE format('ALTER TABLE %I.financial_payments ADD COLUMN IF NOT EXISTS gateway_provider VARCHAR(32);', schema_rec.schema_name);
        EXECUTE format('ALTER TABLE %I.financial_payments ADD COLUMN IF NOT EXISTS gateway_tx_id VARCHAR(120);', schema_rec.schema_name);

        -- Create unique index to guarantee idempotency on monthly recurrent charges
        EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS idx_%s_charge_period 
                        ON %I.financial_charges (property_id, fee_config_id, period_year, period_month)
                        WHERE fee_config_id IS NOT NULL AND period_year IS NOT NULL AND period_month IS NOT NULL;', 
                        replace(schema_rec.schema_name, 'tenant_', ''), schema_rec.schema_name);
    END LOOP;
END $$;
