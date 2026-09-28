DO $$
DECLARE
  tenant_schema RECORD;
BEGIN
  FOR tenant_schema IN
    SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'
  LOOP
    EXECUTE format('ALTER TABLE %I.residents ALTER COLUMN email DROP NOT NULL', tenant_schema.schema_name);
  END LOOP;
END $$;