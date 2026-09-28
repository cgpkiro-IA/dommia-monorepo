DO $$
DECLARE
  tenant_schema RECORD;
BEGIN
  FOR tenant_schema IN
    SELECT nspname FROM pg_namespace WHERE left(nspname, 7) = 'tenant_'
  LOOP
    EXECUTE format('ALTER TABLE %I.residents ADD COLUMN IF NOT EXISTS access_totp_secret VARCHAR(64) NOT NULL DEFAULT encode(gen_random_bytes(20), ''hex'')', tenant_schema.nspname);
    EXECUTE format('ALTER TABLE %I.residents ADD COLUMN IF NOT EXISTS last_access_used_step BIGINT', tenant_schema.nspname);
    EXECUTE format('ALTER TABLE %I.invitations ADD COLUMN IF NOT EXISTS notes TEXT', tenant_schema.nspname);
    EXECUTE format('ALTER TABLE %I.invitations ADD COLUMN IF NOT EXISTS last_used_step BIGINT', tenant_schema.nspname);
    EXECUTE format('CREATE INDEX IF NOT EXISTS invitations_resident_created_idx ON %I.invitations (resident_id, created_at DESC)', tenant_schema.nspname);
    EXECUTE format('CREATE INDEX IF NOT EXISTS access_logs_invitation_idx ON %I.access_logs (identifier, is_granted)', tenant_schema.nspname);
  END LOOP;
END $$;