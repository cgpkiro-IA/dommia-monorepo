DO $$
DECLARE
  tenant_schema RECORD;
BEGIN
  FOR tenant_schema IN
    SELECT nspname FROM pg_namespace WHERE left(nspname, 7) = 'tenant_'
  LOOP
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I.guard_deliveries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      recipient_name VARCHAR(150) NOT NULL,
      property_address VARCHAR(200) NOT NULL,
      carrier VARCHAR(100) NOT NULL,
      tracking_code VARCHAR(100),
      notes VARCHAR(500),
      status VARCHAR(16) NOT NULL DEFAULT ''PENDING'' CHECK (status IN (''PENDING'', ''COLLECTED'')),
      received_by UUID NOT NULL,
      received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      collected_by UUID,
      collected_by_name VARCHAR(150),
      collected_at TIMESTAMPTZ
    )', tenant_schema.nspname);

    EXECUTE format('CREATE TABLE IF NOT EXISTS %I.guard_incidents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      incident_type VARCHAR(32) NOT NULL,
      priority VARCHAR(16) NOT NULL CHECK (priority IN (''LOW'', ''MEDIUM'', ''HIGH'', ''URGENT'')),
      description VARCHAR(1000) NOT NULL,
      property_address VARCHAR(200),
      vehicle_plates VARCHAR(15),
      status VARCHAR(16) NOT NULL DEFAULT ''OPEN'' CHECK (status IN (''OPEN'', ''RESOLVED'')),
      created_by UUID NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      resolved_by UUID,
      resolved_at TIMESTAMPTZ
    )', tenant_schema.nspname);
    EXECUTE format('CREATE INDEX IF NOT EXISTS guard_incidents_status_created_idx ON %I.guard_incidents (status, created_at DESC)', tenant_schema.nspname);

    EXECUTE format('CREATE TABLE IF NOT EXISTS %I.guard_vehicle_flags (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      plates VARCHAR(15) NOT NULL,
      normalized_plates VARCHAR(15) UNIQUE NOT NULL,
      flag_type VARCHAR(24) NOT NULL CHECK (flag_type IN (''BLOCKED'', ''FREQUENT_VISITOR'')),
      reason VARCHAR(300) NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_by UUID NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      removed_by UUID,
      removed_at TIMESTAMPTZ
    )', tenant_schema.nspname);
  END LOOP;
END $$;