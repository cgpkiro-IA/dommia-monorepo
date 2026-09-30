CREATE OR REPLACE FUNCTION public.ensure_tenant_finance_schema(p_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_schema_name TEXT := 'tenant_' || lower(regexp_replace(p_slug, '[^a-zA-Z0-9_]', '_', 'g'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = v_schema_name) THEN
    RAISE EXCEPTION 'Tenant schema % does not exist', v_schema_name;
  END IF;

  EXECUTE format('ALTER TABLE %I.properties ADD COLUMN IF NOT EXISTS lot_size_m2 NUMERIC(10,2) DEFAULT 150.00', v_schema_name);
  EXECUTE format('ALTER TABLE %I.properties ADD COLUMN IF NOT EXISTS building_size_m2 NUMERIC(10,2) DEFAULT 180.00', v_schema_name);

  EXECUTE format('ALTER TABLE %I.fee_configurations ADD COLUMN IF NOT EXISTS frequency VARCHAR(32)', v_schema_name);
  EXECUTE format('ALTER TABLE %I.fee_configurations ADD COLUMN IF NOT EXISTS due_day INT', v_schema_name);
  EXECUTE format('ALTER TABLE %I.fee_configurations ADD COLUMN IF NOT EXISTS late_fee_amount NUMERIC(12,2)', v_schema_name);
  EXECUTE format('ALTER TABLE %I.fee_configurations ADD COLUMN IF NOT EXISTS early_bird_discount_type VARCHAR(32)', v_schema_name);
  EXECUTE format('ALTER TABLE %I.fee_configurations ADD COLUMN IF NOT EXISTS early_bird_discount_amount NUMERIC(12,2)', v_schema_name);
  EXECUTE format('ALTER TABLE %I.fee_configurations ADD COLUMN IF NOT EXISTS early_bird_deadline_day INT', v_schema_name);
  EXECUTE format('ALTER TABLE %I.fee_configurations ADD COLUMN IF NOT EXISTS applies_to_all_properties BOOLEAN', v_schema_name);
  EXECUTE format('ALTER TABLE %I.fee_configurations ADD COLUMN IF NOT EXISTS description TEXT', v_schema_name);
  EXECUTE format('ALTER TABLE %I.fee_configurations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ', v_schema_name);

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = v_schema_name AND table_name = 'fee_configurations' AND column_name = 'due_day_of_month'
  ) THEN
    EXECUTE format('UPDATE %I.fee_configurations SET due_day = COALESCE(due_day, due_day_of_month)', v_schema_name);
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = v_schema_name AND table_name = 'fee_configurations' AND column_name = 'late_fee_value'
  ) THEN
    EXECUTE format('UPDATE %I.fee_configurations SET late_fee_amount = COALESCE(late_fee_amount, late_fee_value)', v_schema_name);
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = v_schema_name AND table_name = 'fee_configurations' AND column_name = 'early_bird_discount_value'
  ) THEN
    EXECUTE format('UPDATE %I.fee_configurations SET early_bird_discount_amount = COALESCE(early_bird_discount_amount, early_bird_discount_value), early_bird_discount_type = COALESCE(early_bird_discount_type, CASE WHEN early_bird_discount_value > 0 THEN ''FIXED'' ELSE ''NONE'' END)', v_schema_name);
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = v_schema_name AND table_name = 'fee_configurations' AND column_name = 'early_bird_limit_day'
  ) THEN
    EXECUTE format('UPDATE %I.fee_configurations SET early_bird_deadline_day = COALESCE(early_bird_deadline_day, early_bird_limit_day)', v_schema_name);
  END IF;

  EXECUTE format($update$
    UPDATE %I.fee_configurations SET
      frequency = COALESCE(frequency, 'MONTHLY'),
      due_day = COALESCE(due_day, 10),
      late_fee_type = COALESCE(late_fee_type, 'PERCENTAGE'),
      late_fee_amount = COALESCE(late_fee_amount, 10.00),
      early_bird_discount_type = COALESCE(early_bird_discount_type, 'NONE'),
      early_bird_discount_amount = COALESCE(early_bird_discount_amount, 0.00),
      applies_to_all_properties = COALESCE(applies_to_all_properties, TRUE),
      updated_at = COALESCE(updated_at, created_at, NOW())
  $update$, v_schema_name);

  EXECUTE format('ALTER TABLE %I.fee_configurations ALTER COLUMN frequency SET DEFAULT ''MONTHLY'', ALTER COLUMN frequency SET NOT NULL', v_schema_name);
  EXECUTE format('ALTER TABLE %I.fee_configurations ALTER COLUMN due_day SET DEFAULT 10, ALTER COLUMN due_day SET NOT NULL', v_schema_name);
  EXECUTE format('ALTER TABLE %I.fee_configurations ALTER COLUMN late_fee_amount SET DEFAULT 10.00, ALTER COLUMN late_fee_amount SET NOT NULL', v_schema_name);
  EXECUTE format('ALTER TABLE %I.fee_configurations ALTER COLUMN early_bird_discount_type SET DEFAULT ''NONE'', ALTER COLUMN early_bird_discount_type SET NOT NULL', v_schema_name);
  EXECUTE format('ALTER TABLE %I.fee_configurations ALTER COLUMN early_bird_discount_amount SET DEFAULT 0.00, ALTER COLUMN early_bird_discount_amount SET NOT NULL', v_schema_name);
  EXECUTE format('ALTER TABLE %I.fee_configurations ALTER COLUMN applies_to_all_properties SET DEFAULT TRUE, ALTER COLUMN applies_to_all_properties SET NOT NULL', v_schema_name);
  EXECUTE format('ALTER TABLE %I.fee_configurations ALTER COLUMN updated_at SET DEFAULT NOW(), ALTER COLUMN updated_at SET NOT NULL', v_schema_name);

  EXECUTE format('ALTER TABLE %I.financial_charges ADD COLUMN IF NOT EXISTS period_year INT', v_schema_name);
  EXECUTE format('ALTER TABLE %I.financial_charges ADD COLUMN IF NOT EXISTS period_month INT', v_schema_name);
  EXECUTE format('ALTER TABLE %I.financial_charges ADD COLUMN IF NOT EXISTS balance_due NUMERIC(12,2)', v_schema_name);
  EXECUTE format('ALTER TABLE %I.financial_charges ADD COLUMN IF NOT EXISTS notes TEXT', v_schema_name);
  EXECUTE format($update$
    UPDATE %I.financial_charges SET balance_due =
      CASE WHEN UPPER(status) IN ('PAID', 'CANCELLED') THEN 0 ELSE amount END
    WHERE balance_due IS NULL
  $update$, v_schema_name);
  EXECUTE format('ALTER TABLE %I.financial_charges ALTER COLUMN balance_due SET NOT NULL', v_schema_name);
  EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS financial_charges_period_unique ON %I.financial_charges (property_id, fee_config_id, period_year, period_month) WHERE fee_config_id IS NOT NULL AND period_year IS NOT NULL AND period_month IS NOT NULL', v_schema_name);

  EXECUTE format('ALTER TABLE %I.financial_payments ADD COLUMN IF NOT EXISTS received_by_name VARCHAR(120)', v_schema_name);
  EXECUTE format('ALTER TABLE %I.financial_payments ADD COLUMN IF NOT EXISTS payer_name VARCHAR(120)', v_schema_name);
  EXECUTE format('ALTER TABLE %I.financial_payments ADD COLUMN IF NOT EXISTS notes TEXT', v_schema_name);
  EXECUTE format('ALTER TABLE %I.financial_payments ADD COLUMN IF NOT EXISTS gateway_provider VARCHAR(32)', v_schema_name);
  EXECUTE format('ALTER TABLE %I.financial_payments ADD COLUMN IF NOT EXISTS gateway_tx_id VARCHAR(120)', v_schema_name);
END;
$$;

DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  FOR tenant_record IN SELECT slug FROM public.tenants LOOP
    PERFORM public.ensure_tenant_finance_schema(tenant_record.slug);
  END LOOP;
END;
$$;