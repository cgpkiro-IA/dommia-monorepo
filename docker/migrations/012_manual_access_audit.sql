DO $$
DECLARE
  tenant_schema RECORD;
BEGIN
  FOR tenant_schema IN
    SELECT nspname FROM pg_namespace WHERE left(nspname, 7) = 'tenant_'
  LOOP
    EXECUTE format('ALTER TABLE %I.access_logs ADD COLUMN IF NOT EXISTS manual_reason TEXT', tenant_schema.nspname);
    EXECUTE format('ALTER TABLE %I.access_logs ADD COLUMN IF NOT EXISTS guard_user_id UUID', tenant_schema.nspname);
  END LOOP;
END $$;