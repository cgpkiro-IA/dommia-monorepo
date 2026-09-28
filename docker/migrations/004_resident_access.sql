DO $$
DECLARE
  tenant_schema RECORD;
BEGIN
  FOR tenant_schema IN
    SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'
  LOOP
    EXECUTE format('ALTER TABLE %I.residents ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT true', tenant_schema.schema_name);
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I.resident_invitations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      resident_id UUID NOT NULL REFERENCES %I.residents(id) ON DELETE CASCADE,
      token_hash VARCHAR(128) UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      revoked_at TIMESTAMPTZ,
      created_by UUID,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )', tenant_schema.schema_name, tenant_schema.schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS resident_invitations_resident_idx ON %I.resident_invitations(resident_id)', tenant_schema.schema_name);
  END LOOP;
END $$;
