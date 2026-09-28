DO $$
DECLARE
  tenant_schema RECORD;
BEGIN
  FOR tenant_schema IN
    SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'
  LOOP
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I.annual_payment_campaigns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(150) NOT NULL,
      discount_percentage NUMERIC(5,2) NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
      months_covered INT NOT NULL DEFAULT 12 CHECK (months_covered BETWEEN 1 AND 12),
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      status VARCHAR(24) NOT NULL DEFAULT ''DRAFT'',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )', tenant_schema.schema_name);
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I.annual_payment_commitments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id UUID NOT NULL REFERENCES %I.annual_payment_campaigns(id) ON DELETE CASCADE,
      property_id UUID NOT NULL REFERENCES %I.properties(id) ON DELETE CASCADE,
      gross_amount NUMERIC(12,2) NOT NULL,
      discount_amount NUMERIC(12,2) NOT NULL,
      net_amount NUMERIC(12,2) NOT NULL,
      payment_method VARCHAR(32) NOT NULL,
      reference VARCHAR(128) NOT NULL,
      receipt_url TEXT,
      status VARCHAR(24) NOT NULL DEFAULT ''PENDING_APPROVAL'',
      payer_name VARCHAR(120),
      reviewed_by_name VARCHAR(120),
      review_notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      reviewed_at TIMESTAMPTZ
    )', tenant_schema.schema_name, tenant_schema.schema_name, tenant_schema.schema_name);
    EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS annual_commitment_campaign_property ON %I.annual_payment_commitments (campaign_id, property_id)', tenant_schema.schema_name);
    EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS annual_commitment_reference ON %I.annual_payment_commitments (reference)', tenant_schema.schema_name);
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I.financial_ledger_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      property_id UUID REFERENCES %I.properties(id) ON DELETE CASCADE,
      source_type VARCHAR(32) NOT NULL,
      source_id UUID NOT NULL,
      entry_type VARCHAR(24) NOT NULL,
      amount NUMERIC(12,2) NOT NULL,
      description VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )', tenant_schema.schema_name, tenant_schema.schema_name);
    EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS financial_ledger_source_unique ON %I.financial_ledger_entries (source_type, source_id, entry_type)', tenant_schema.schema_name);
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I.annual_payment_allocations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      commitment_id UUID NOT NULL REFERENCES %I.annual_payment_commitments(id) ON DELETE CASCADE,
      property_id UUID NOT NULL REFERENCES %I.properties(id) ON DELETE CASCADE,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      amount NUMERIC(12,2) NOT NULL,
      status VARCHAR(24) NOT NULL DEFAULT ''ALLOCATED'',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )', tenant_schema.schema_name, tenant_schema.schema_name, tenant_schema.schema_name);
    EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS annual_allocation_period_unique ON %I.annual_payment_allocations (commitment_id, period_start)', tenant_schema.schema_name);
  END LOOP;
END $$;