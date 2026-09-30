CREATE OR REPLACE FUNCTION public.ensure_tenant_latest_guard_tables(p_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_schema_name TEXT := 'tenant_' || lower(regexp_replace(p_slug, '[^a-zA-Z0-9_]', '_', 'g'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = v_schema_name) THEN
    RAISE EXCEPTION 'Tenant schema % does not exist', v_schema_name;
  END IF;

  EXECUTE format($ddl$CREATE TABLE IF NOT EXISTS %I.guard_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type VARCHAR(32) NOT NULL,
    custom_service_name VARCHAR(150),
    supplier_name VARCHAR(150),
    vehicle_plates VARCHAR(20),
    destination_type VARCHAR(16) NOT NULL DEFAULT 'SPECIFIC' CHECK (destination_type IN ('SPECIFIC', 'GENERAL')),
    destinations JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(16) NOT NULL DEFAULT 'IN_TRANSIT' CHECK (status IN ('IN_TRANSIT', 'COMPLETED')),
    notes VARCHAR(500),
    entered_by UUID NOT NULL,
    entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    exited_by UUID,
    exited_at TIMESTAMPTZ
  )$ddl$, v_schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS guard_services_status_idx ON %I.guard_services (status, entered_at DESC)', v_schema_name);

  EXECUTE format('ALTER TABLE %I.notices ADD COLUMN IF NOT EXISTS target_audience VARCHAR(32) NOT NULL DEFAULT ''ALL''', v_schema_name);
  EXECUTE format('ALTER TABLE %I.notices ADD COLUMN IF NOT EXISTS acknowledged_guards JSONB NOT NULL DEFAULT ''[]''::jsonb', v_schema_name);
  EXECUTE format('ALTER TABLE %I.notices ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ', v_schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_notices_audience ON %I.notices (target_audience, is_published, created_at DESC)', v_schema_name);

  EXECUTE format('ALTER TABLE %I.guard_incidents ADD COLUMN IF NOT EXISTS is_panic_alert BOOLEAN NOT NULL DEFAULT FALSE', v_schema_name);
  EXECUTE format('ALTER TABLE %I.guard_incidents ADD COLUMN IF NOT EXISTS panic_type VARCHAR(32)', v_schema_name);
  EXECUTE format('ALTER TABLE %I.guard_incidents ADD COLUMN IF NOT EXISTS resolution_notes TEXT', v_schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_guard_incidents_panic ON %I.guard_incidents (is_panic_alert, status, created_at DESC)', v_schema_name);

  EXECUTE format('CREATE INDEX IF NOT EXISTS invitations_resident_created_idx ON %I.invitations (resident_id, created_at DESC)', v_schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS access_logs_invitation_idx ON %I.access_logs (identifier, is_granted)', v_schema_name);
END;
$$;

DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  FOR tenant_record IN SELECT slug FROM public.tenants LOOP
    PERFORM public.ensure_tenant_latest_guard_tables(tenant_record.slug);
  END LOOP;
END;
$$;