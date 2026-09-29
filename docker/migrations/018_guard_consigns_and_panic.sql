-- Migration 018: Guard Consigns & Panic Emergency System across all tenants

CREATE OR REPLACE FUNCTION public.ensure_guard_consigns_and_panic(p_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_schema_name TEXT := 'tenant_' || lower(regexp_replace(p_slug, '[^a-zA-Z0-9_]', '_', 'g'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = v_schema_name) THEN
    RETURN;
  END IF;

  -- 1. Extend notices table with target_audience & acknowledged_guards
  EXECUTE format('ALTER TABLE %I.notices ADD COLUMN IF NOT EXISTS target_audience VARCHAR(32) NOT NULL DEFAULT ''ALL''', v_schema_name);
  EXECUTE format('ALTER TABLE %I.notices ADD COLUMN IF NOT EXISTS acknowledged_guards JSONB NOT NULL DEFAULT ''[]''::jsonb', v_schema_name);
  EXECUTE format('ALTER TABLE %I.notices ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ', v_schema_name);

  -- 2. Extend guard_incidents table with panic alert flags
  EXECUTE format('ALTER TABLE %I.guard_incidents ADD COLUMN IF NOT EXISTS is_panic_alert BOOLEAN NOT NULL DEFAULT FALSE', v_schema_name);
  EXECUTE format('ALTER TABLE %I.guard_incidents ADD COLUMN IF NOT EXISTS panic_type VARCHAR(32)', v_schema_name);
  EXECUTE format('ALTER TABLE %I.guard_incidents ADD COLUMN IF NOT EXISTS resolution_notes TEXT', v_schema_name);

  -- 3. Create index on target_audience and panic alerts
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_notices_audience ON %I.notices (target_audience, is_published, created_at DESC)', v_schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_guard_incidents_panic ON %I.guard_incidents (is_panic_alert, status, created_at DESC)', v_schema_name);
END;
$$;

-- Apply to all existing tenants
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT slug FROM public.tenants LOOP
    PERFORM public.ensure_guard_consigns_and_panic(r.slug);
  END LOOP;
END;
$$;
