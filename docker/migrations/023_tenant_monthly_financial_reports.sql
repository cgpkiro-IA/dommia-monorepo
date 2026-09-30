CREATE OR REPLACE FUNCTION public.ensure_tenant_monthly_financial_reports(p_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  tenant_schema RECORD;
BEGIN
  SELECT 'tenant_' || lower(regexp_replace(p_slug, '[^a-zA-Z0-9_]', '_', 'g')) AS schema_name
  INTO tenant_schema;

  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = tenant_schema.schema_name) THEN
    RAISE EXCEPTION 'Tenant schema % does not exist', tenant_schema.schema_name;
  END IF;

  EXECUTE format($ddl$
    CREATE TABLE IF NOT EXISTS %I.financial_monthly_report_settings (
      singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton = TRUE),
      reporting_start_month DATE NOT NULL DEFAULT date_trunc('month', CURRENT_DATE)::date,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  $ddl$, tenant_schema.schema_name);
  EXECUTE format($seed$
    INSERT INTO %I.financial_monthly_report_settings (singleton)
    VALUES (TRUE) ON CONFLICT (singleton) DO NOTHING
  $seed$, tenant_schema.schema_name);

    EXECUTE format($ddl$
      CREATE TABLE IF NOT EXISTS %I.financial_expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        report_id UUID,
        category VARCHAR(40) NOT NULL CHECK (category IN (
          'SECURITY_PAYROLL', 'ADMINISTRATION', 'CLEANING', 'GARDENING',
          'GATE_MAINTENANCE', 'UTILITIES', 'REPAIRS', 'SUPPLIES',
          'INSURANCE', 'BANK_FEES', 'OTHER'
        )),
        description VARCHAR(500) NOT NULL,
        vendor_name VARCHAR(160),
        expense_date DATE NOT NULL,
        amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
        payment_method VARCHAR(24) NOT NULL CHECK (payment_method IN (
          'CASH', 'SPEI_TRANSFER', 'BANK_TRANSFER', 'CHECK', 'CARD', 'OTHER'
        )),
        reference VARCHAR(128),
        notes TEXT,
        status VARCHAR(16) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED', 'VOID')),
        evidence_exception_reason VARCHAR(500),
        created_by UUID NOT NULL,
        approved_by UUID,
        approved_at TIMESTAMPTZ,
        voided_by UUID,
        voided_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    $ddl$, tenant_schema.schema_name);

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS financial_expenses_period_status_idx ON %I.financial_expenses (expense_date, status)',
      tenant_schema.schema_name
    );

    EXECUTE format($ddl$
      CREATE TABLE IF NOT EXISTS %I.financial_monthly_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        revision INT NOT NULL DEFAULT 1 CHECK (revision > 0),
        status VARCHAR(16) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED')),
        opening_bank_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
        opening_cash_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
        reported_bank_balance NUMERIC(14,2),
        reported_cash_balance NUMERIC(14,2),
        calculated_closing_balance NUMERIC(14,2),
        variance NUMERIC(14,2),
        report_snapshot JSONB,
        publication_notes TEXT,
        created_by UUID NOT NULL,
        published_by UUID,
        published_at TIMESTAMPTZ,
        supersedes_report_id UUID REFERENCES %I.financial_monthly_reports(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CHECK (
          period_start = date_trunc('month', period_start)::date
          AND period_end = (date_trunc('month', period_start) + INTERVAL '1 month - 1 day')::date
        ),
        CHECK (
          (status = 'DRAFT' AND published_at IS NULL AND published_by IS NULL)
          OR (status = 'PUBLISHED' AND published_at IS NOT NULL AND published_by IS NOT NULL AND report_snapshot IS NOT NULL)
        ),
        UNIQUE (period_start, revision)
      )
    $ddl$, tenant_schema.schema_name, tenant_schema.schema_name);

    EXECUTE format(
      'CREATE UNIQUE INDEX IF NOT EXISTS financial_monthly_reports_one_draft_idx ON %I.financial_monthly_reports (period_start) WHERE status = ''DRAFT''',
      tenant_schema.schema_name
    );

    EXECUTE format(
      'ALTER TABLE %I.financial_expenses ADD COLUMN IF NOT EXISTS report_id UUID REFERENCES %I.financial_monthly_reports(id) ON DELETE RESTRICT',
      tenant_schema.schema_name,
      tenant_schema.schema_name
    );

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_schema = tenant_schema.schema_name
        AND table_name = 'financial_expenses'
        AND constraint_name = 'financial_expenses_report_fk'
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I.financial_expenses ADD CONSTRAINT financial_expenses_report_fk FOREIGN KEY (report_id) REFERENCES %I.financial_monthly_reports(id) ON DELETE RESTRICT',
        tenant_schema.schema_name,
        tenant_schema.schema_name
      );
    END IF;

    EXECUTE format('CREATE INDEX IF NOT EXISTS financial_expenses_report_idx ON %I.financial_expenses(report_id)', tenant_schema.schema_name);

    EXECUTE format($ddl$
      CREATE TABLE IF NOT EXISTS %I.financial_report_evidence (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        expense_id UUID REFERENCES %I.financial_expenses(id) ON DELETE CASCADE,
        report_id UUID REFERENCES %I.financial_monthly_reports(id) ON DELETE CASCADE,
        payment_id UUID REFERENCES %I.financial_payments(id) ON DELETE CASCADE,
        annual_commitment_id UUID REFERENCES %I.annual_payment_commitments(id) ON DELETE CASCADE,
        object_key TEXT NOT NULL UNIQUE,
        original_file_name VARCHAR(255) NOT NULL,
        content_type VARCHAR(80) NOT NULL CHECK (content_type IN ('application/pdf', 'image/jpeg', 'image/png')),
        size_bytes INT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 3750000),
        sha256 CHAR(64) NOT NULL,
        visibility VARCHAR(16) NOT NULL DEFAULT 'ADMIN_ONLY' CHECK (visibility IN ('ADMIN_ONLY', 'RESIDENTS')),
        is_redacted BOOLEAN NOT NULL DEFAULT FALSE,
        uploaded_by UUID NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CHECK (num_nonnulls(expense_id, report_id, payment_id, annual_commitment_id) = 1),
        CHECK (visibility <> 'RESIDENTS' OR is_redacted = TRUE)
      )
    $ddl$, tenant_schema.schema_name, tenant_schema.schema_name, tenant_schema.schema_name, tenant_schema.schema_name, tenant_schema.schema_name);

    EXECUTE format($ddl$
      CREATE TABLE IF NOT EXISTS %I.financial_monthly_report_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        report_id UUID NOT NULL REFERENCES %I.financial_monthly_reports(id) ON DELETE CASCADE,
        resident_id UUID NOT NULL REFERENCES %I.residents(id) ON DELETE CASCADE,
        reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (report_id, resident_id)
      )
    $ddl$, tenant_schema.schema_name, tenant_schema.schema_name, tenant_schema.schema_name);
END $$;

DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  FOR tenant_record IN SELECT slug FROM public.tenants LOOP
    PERFORM public.ensure_tenant_monthly_financial_reports(tenant_record.slug);
  END LOOP;
END $$;
