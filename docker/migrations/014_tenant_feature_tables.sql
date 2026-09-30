CREATE TABLE IF NOT EXISTS public.notification_channel_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  channel VARCHAR(32) NOT NULL CHECK (channel IN ('SMTP', 'WHATSAPP_BUSINESS')),
  enabled BOOLEAN NOT NULL DEFAULT false,
  config_encrypted TEXT NOT NULL,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, channel)
);

CREATE OR REPLACE FUNCTION public.ensure_tenant_feature_tables(p_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_schema_name TEXT := 'tenant_' || lower(regexp_replace(p_slug, '[^a-zA-Z0-9_]', '_', 'g'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = v_schema_name) THEN
    RAISE EXCEPTION 'Tenant schema % does not exist', v_schema_name;
  END IF;

  EXECUTE format('ALTER TABLE %I.residents ALTER COLUMN email DROP NOT NULL', v_schema_name);
  EXECUTE format('ALTER TABLE %I.residents ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT true', v_schema_name);
  EXECUTE format('ALTER TABLE %I.residents ADD COLUMN IF NOT EXISTS access_totp_secret VARCHAR(64) NOT NULL DEFAULT encode(gen_random_bytes(20), ''hex'')', v_schema_name);
  EXECUTE format('ALTER TABLE %I.residents ADD COLUMN IF NOT EXISTS last_access_used_step BIGINT', v_schema_name);
  EXECUTE format('ALTER TABLE %I.invitations ADD COLUMN IF NOT EXISTS last_used_step BIGINT', v_schema_name);
  EXECUTE format('ALTER TABLE %I.access_logs ADD COLUMN IF NOT EXISTS manual_reason TEXT', v_schema_name);
  EXECUTE format('ALTER TABLE %I.access_logs ADD COLUMN IF NOT EXISTS guard_user_id UUID', v_schema_name);

  EXECUTE format($ddl$CREATE TABLE IF NOT EXISTS %I.resident_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID NOT NULL REFERENCES %I.residents(id) ON DELETE CASCADE,
    token_hash VARCHAR(128) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )$ddl$, v_schema_name, v_schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS resident_invitations_resident_idx ON %I.resident_invitations(resident_id)', v_schema_name);

  EXECUTE format($ddl$CREATE TABLE IF NOT EXISTS %I.resident_password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID NOT NULL REFERENCES %I.residents(id) ON DELETE CASCADE,
    token_hash VARCHAR(128) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )$ddl$, v_schema_name, v_schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS resident_password_resets_resident_idx ON %I.resident_password_resets(resident_id)', v_schema_name);

  IF (
    SELECT COUNT(*) = 4
    FROM information_schema.columns
    WHERE table_schema = v_schema_name
      AND table_name = 'financial_charges'
      AND column_name IN ('property_id', 'fee_config_id', 'period_year', 'period_month')
  ) THEN
    EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS financial_charges_period_unique
      ON %I.financial_charges (property_id, fee_config_id, period_year, period_month)
      WHERE fee_config_id IS NOT NULL AND period_year IS NOT NULL AND period_month IS NOT NULL', v_schema_name);
  END IF;

  EXECUTE format($ddl$CREATE TABLE IF NOT EXISTS %I.fee_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    fee_type VARCHAR(32) NOT NULL DEFAULT 'FIXED_RECURRENT',
    base_amount NUMERIC(12,2) NOT NULL,
    frequency VARCHAR(32) NOT NULL DEFAULT 'MONTHLY',
    due_day INT NOT NULL DEFAULT 10,
    grace_days INT NOT NULL DEFAULT 5,
    late_fee_type VARCHAR(32) NOT NULL DEFAULT 'PERCENTAGE',
    late_fee_amount NUMERIC(12,2) NOT NULL DEFAULT 10.00,
    early_bird_discount_type VARCHAR(32) NOT NULL DEFAULT 'NONE',
    early_bird_discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    early_bird_deadline_day INT DEFAULT 5,
    applies_to_all_properties BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )$ddl$, v_schema_name);

  EXECUTE format($ddl$CREATE TABLE IF NOT EXISTS %I.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(32) NOT NULL DEFAULT 'GENERAL',
    priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    author_name VARCHAR(100) NOT NULL DEFAULT 'Administración',
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    is_published BOOLEAN NOT NULL DEFAULT true,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )$ddl$, v_schema_name);

  EXECUTE format($ddl$CREATE TABLE IF NOT EXISTS %I.annual_payment_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    discount_percentage NUMERIC(5,2) NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    months_covered INT NOT NULL DEFAULT 12 CHECK (months_covered BETWEEN 1 AND 12),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )$ddl$, v_schema_name);
  EXECUTE format($ddl$CREATE TABLE IF NOT EXISTS %I.annual_payment_commitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES %I.annual_payment_campaigns(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES %I.properties(id) ON DELETE CASCADE,
    gross_amount NUMERIC(12,2) NOT NULL,
    discount_amount NUMERIC(12,2) NOT NULL,
    net_amount NUMERIC(12,2) NOT NULL,
    payment_method VARCHAR(32) NOT NULL,
    reference VARCHAR(128) NOT NULL,
    receipt_url TEXT,
    status VARCHAR(24) NOT NULL DEFAULT 'PENDING_APPROVAL',
    payer_name VARCHAR(120),
    reviewed_by_name VARCHAR(120),
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
  )$ddl$, v_schema_name, v_schema_name, v_schema_name);
  EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS annual_commitment_campaign_property ON %I.annual_payment_commitments (campaign_id, property_id)', v_schema_name);
  EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS annual_commitment_reference ON %I.annual_payment_commitments (reference)', v_schema_name);

  EXECUTE format($ddl$CREATE TABLE IF NOT EXISTS %I.financial_ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES %I.properties(id) ON DELETE CASCADE,
    source_type VARCHAR(32) NOT NULL,
    source_id UUID NOT NULL,
    entry_type VARCHAR(24) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )$ddl$, v_schema_name, v_schema_name);
  EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS financial_ledger_source_unique ON %I.financial_ledger_entries (source_type, source_id, entry_type)', v_schema_name);

  EXECUTE format($ddl$CREATE TABLE IF NOT EXISTS %I.annual_payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commitment_id UUID NOT NULL REFERENCES %I.annual_payment_commitments(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES %I.properties(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'ALLOCATED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )$ddl$, v_schema_name, v_schema_name, v_schema_name);
  EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS annual_allocation_period_unique ON %I.annual_payment_allocations (commitment_id, period_start)', v_schema_name);

  EXECUTE format($ddl$CREATE TABLE IF NOT EXISTS %I.guard_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_name VARCHAR(150) NOT NULL,
    property_address VARCHAR(200) NOT NULL,
    carrier VARCHAR(100) NOT NULL,
    tracking_code VARCHAR(100),
    notes VARCHAR(500),
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COLLECTED')),
    received_by UUID NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    collected_by UUID,
    collected_by_name VARCHAR(150),
    collected_at TIMESTAMPTZ
  )$ddl$, v_schema_name);

  EXECUTE format($ddl$CREATE TABLE IF NOT EXISTS %I.guard_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_type VARCHAR(32) NOT NULL,
    priority VARCHAR(16) NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    description VARCHAR(1000) NOT NULL,
    property_address VARCHAR(200),
    vehicle_plates VARCHAR(15),
    status VARCHAR(16) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED')),
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_by UUID,
    resolved_at TIMESTAMPTZ
  )$ddl$, v_schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS guard_incidents_status_created_idx ON %I.guard_incidents (status, created_at DESC)', v_schema_name);

  EXECUTE format($ddl$CREATE TABLE IF NOT EXISTS %I.guard_vehicle_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plates VARCHAR(15) NOT NULL,
    normalized_plates VARCHAR(15) UNIQUE NOT NULL,
    flag_type VARCHAR(24) NOT NULL CHECK (flag_type IN ('BLOCKED', 'FREQUENT_VISITOR')),
    reason VARCHAR(300) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    removed_by UUID,
    removed_at TIMESTAMPTZ
  )$ddl$, v_schema_name);
END $$;

DO $$
DECLARE tenant_schema RECORD;
BEGIN
  FOR tenant_schema IN SELECT nspname FROM pg_namespace WHERE left(nspname, 7) = 'tenant_' LOOP
    PERFORM public.ensure_tenant_feature_tables(substring(tenant_schema.nspname FROM 8));
  END LOOP;
END $$;