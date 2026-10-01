CREATE OR REPLACE FUNCTION public.ensure_tenant_access_points(p_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_schema_name TEXT := 'tenant_' || lower(regexp_replace(p_slug, '[^a-zA-Z0-9_]', '_', 'g'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = v_schema_name) THEN
    RAISE EXCEPTION 'Tenant schema % does not exist', v_schema_name;
  END IF;

  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.guard_access_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(80) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )', v_schema_name);
  EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS guard_access_points_name_unique ON %I.guard_access_points (LOWER(name))', v_schema_name);

  EXECUTE format('ALTER TABLE %I.guard_services ADD COLUMN IF NOT EXISTS entered_access_point_id UUID REFERENCES %I.guard_access_points(id) ON DELETE RESTRICT', v_schema_name, v_schema_name);
  EXECUTE format('ALTER TABLE %I.guard_services ADD COLUMN IF NOT EXISTS entered_access_point_name VARCHAR(80)', v_schema_name);
  EXECUTE format('ALTER TABLE %I.guard_services ADD COLUMN IF NOT EXISTS exited_access_point_id UUID REFERENCES %I.guard_access_points(id) ON DELETE RESTRICT', v_schema_name, v_schema_name);
  EXECUTE format('ALTER TABLE %I.guard_services ADD COLUMN IF NOT EXISTS exited_access_point_name VARCHAR(80)', v_schema_name);

  EXECUTE format('INSERT INTO %I.guard_access_points (name)
    SELECT $1
    WHERE NOT EXISTS (SELECT 1 FROM %I.guard_access_points WHERE is_active)
    ON CONFLICT DO NOTHING', v_schema_name, v_schema_name)
    USING 'Acceso principal';
END;
$$;

DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  FOR tenant_record IN SELECT slug FROM public.tenants LOOP
    PERFORM public.ensure_tenant_access_points(tenant_record.slug);
  END LOOP;
END;
$$;