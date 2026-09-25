DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('tenant_valle_real', 'tenant_cumbres', 'tenant_bosques', 'tenant_valle_oriente') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.schema_name) || '.fee_configurations CASCADE;';

        EXECUTE 'CREATE TABLE ' || quote_ident(r.schema_name) || '.fee_configurations (' ||
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

        EXECUTE 'ALTER TABLE ' || quote_ident(r.schema_name) || '.financial_charges ADD COLUMN IF NOT EXISTS fee_config_id UUID REFERENCES ' || quote_ident(r.schema_name) || '.fee_configurations(id) ON DELETE SET NULL;';

        EXECUTE 'INSERT INTO ' || quote_ident(r.schema_name) || '.fee_configurations (name, fee_type, base_amount, frequency, due_day, grace_days, late_fee_type, late_fee_amount, early_bird_discount_type, early_bird_discount_amount, early_bird_deadline_day, description) ' ||
            'VALUES (''Cuota de Mantenimiento Ordinario Mensual'', ''FIXED_RECURRENT'', 1250.00, ''MONTHLY'', 10, 5, ''PERCENTAGE'', 10.00, ''FIXED'', 100.00, 5, ''Cuota ordinaria mensual uniforme'');';

        EXECUTE 'INSERT INTO ' || quote_ident(r.schema_name) || '.fee_configurations (name, fee_type, base_amount, frequency, due_day, grace_days, late_fee_type, late_fee_amount, early_bird_discount_type, early_bird_discount_amount, early_bird_deadline_day, description) ' ||
            'VALUES (''Cuota Indiviso por Metraje de Lote (m²)'', ''VARIABLE_LOT_SIZE'', 6.50, ''MONTHLY'', 10, 5, ''PERCENTAGE'', 10.00, ''NONE'', 0.00, 0, ''Cuota proporcional calculada por metro cuadrado de terreno'');';
    END LOOP;
END $$;
