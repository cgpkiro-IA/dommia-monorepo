DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%' LOOP
        -- Drop fee_configurations if it had the old schema
        EXECUTE 'CREATE TABLE IF NOT EXISTS ' || quote_ident(r.schema_name) || '.fee_configurations (' ||
            'id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ' ||
            'name VARCHAR(150) NOT NULL, ' ||
            'fee_type VARCHAR(32) NOT NULL DEFAULT ''FIXED_RECURRENT'', ' ||
            'base_amount NUMERIC(12,2) NOT NULL, ' ||
            'frequency VARCHAR(32) NOT NULL DEFAULT ''MONTHLY'', ' ||
            'due_day INT NOT NULL DEFAULT 10, ' ||
            'grace_days INT NOT NULL DEFAULT 5, ' ||
            'late_fee_type VARCHAR(32) NOT NULL DEFAULT ''PERCENTAGE'', ' ||
            'late_fee_amount NUMERIC(12,2) NOT NULL DEFAULT 10.00, ' ||
            'early_bird_discount_type VARCHAR(32) NOT NULL DEFAULT ''FIXED'', ' ||
            'early_bird_discount_amount NUMERIC(12,2) NOT NULL DEFAULT 100.00, ' ||
            'early_bird_deadline_day INT DEFAULT 5, ' ||
            'applies_to_all_properties BOOLEAN NOT NULL DEFAULT true, ' ||
            'is_active BOOLEAN NOT NULL DEFAULT true, ' ||
            'description TEXT, ' ||
            'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), ' ||
            'updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()' ||
        ');';

        -- Make sure financial_charges has fee_config_id
        EXECUTE 'ALTER TABLE ' || quote_ident(r.schema_name) || '.financial_charges ADD COLUMN IF NOT EXISTS fee_config_id UUID REFERENCES ' || quote_ident(r.schema_name) || '.fee_configurations(id) ON DELETE SET NULL;';

        -- Seed default fees if empty
        EXECUTE 'INSERT INTO ' || quote_ident(r.schema_name) || '.fee_configurations (name, fee_type, base_amount, frequency, due_day, grace_days, late_fee_type, late_fee_amount, early_bird_discount_type, early_bird_discount_amount, early_bird_deadline_day, description) ' ||
            'SELECT ''Cuota de Mantenimiento Ordinario'', ''FIXED_RECURRENT'', 1350.00, ''MONTHLY'', 10, 5, ''PERCENTAGE'', 10.00, ''FIXED'', 100.00, 5, ''Cuota ordinaria mensual uniforme'' ' ||
            'WHERE NOT EXISTS (SELECT 1 FROM ' || quote_ident(r.schema_name) || '.fee_configurations WHERE fee_type = ''FIXED_RECURRENT'');';

        EXECUTE 'INSERT INTO ' || quote_ident(r.schema_name) || '.fee_configurations (name, fee_type, base_amount, frequency, due_day, grace_days, late_fee_type, late_fee_amount, early_bird_discount_type, early_bird_discount_amount, early_bird_deadline_day, description) ' ||
            'SELECT ''Cuota Indiviso por Metraje (m²)'', ''VARIABLE_LOT_SIZE'', 6.50, ''MONTHLY'', 10, 5, ''PERCENTAGE'', 10.00, ''NONE'', 0.00, 0, ''Cuota proporcional calculada por metro cuadrado de terreno'' ' ||
            'WHERE NOT EXISTS (SELECT 1 FROM ' || quote_ident(r.schema_name) || '.fee_configurations WHERE fee_type = ''VARIABLE_LOT_SIZE'');';
    END LOOP;
END $$;
