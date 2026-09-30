DO $$
DECLARE
  tenant_schema RECORD;
BEGIN
  FOR tenant_schema IN
    SELECT nspname FROM pg_namespace WHERE left(nspname, 7) = 'tenant_'
  LOOP
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I.guard_services (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      service_type VARCHAR(32) NOT NULL,
      custom_service_name VARCHAR(150),
      supplier_name VARCHAR(150),
      vehicle_plates VARCHAR(20),
      destination_type VARCHAR(16) NOT NULL DEFAULT ''SPECIFIC'' CHECK (destination_type IN (''SPECIFIC'', ''GENERAL'')),
      destinations JSONB NOT NULL DEFAULT ''[]''::jsonb,
      status VARCHAR(16) NOT NULL DEFAULT ''IN_TRANSIT'' CHECK (status IN (''IN_TRANSIT'', ''COMPLETED'')),
      notes VARCHAR(500),
      entered_by UUID NOT NULL,
      entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      exited_by UUID,
      exited_at TIMESTAMPTZ
    )', tenant_schema.nspname);

    EXECUTE format('CREATE INDEX IF NOT EXISTS guard_services_status_idx ON %I.guard_services (status, entered_at DESC)', tenant_schema.nspname);
  END LOOP;
END $$;
