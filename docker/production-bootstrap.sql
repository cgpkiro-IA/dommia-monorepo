\set ON_ERROR_STOP on

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ) OR EXISTS (
    SELECT 1 FROM pg_namespace WHERE left(nspname, 7) = 'tenant_'
  ) THEN
    RAISE EXCEPTION 'La base no está vacía. Este bootstrap solo se ejecuta una vez sobre una base nueva.';
  END IF;
END;
$$;

\ir init-db/01-init.sql
\ir migrations/003_finance_campaign_ledger.sql
\ir migrations/004_resident_access.sql
\ir migrations/005_resident_contact_login.sql
\ir migrations/006_notification_channels.sql
\ir migrations/007_resident_password_resets.sql
\ir migrations/008_resident_sessions.sql
\ir migrations/009_stripe_events.sql
\ir migrations/010_stripe_connected_accounts.sql
\ir migrations/011_access_qr_replay_protection.sql
\ir migrations/012_manual_access_audit.sql
\ir migrations/013_guard_operations.sql
\ir migrations/014_tenant_feature_tables.sql
\ir migrations/015_admin_mfa.sql
\ir migrations/016_guard_services.sql
\ir migrations/017_crm_alerts.sql
\ir migrations/018_guard_consigns_and_panic.sql
\ir migrations/019_tenant_guard_schema_completion.sql
\ir migrations/020_tenant_finance_schema_completion.sql
\ir migrations/021_resident_app_refresh_sessions.sql

DELETE FROM public.gateway_inventory
WHERE uuid = 'gw-caseta-norte-laspalmas-01';

DELETE FROM public.tenants WHERE slug = 'demo';
DROP SCHEMA IF EXISTS tenant_demo CASCADE;

CREATE TABLE public.schema_migrations (
  version TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.schema_migrations (version, filename) VALUES
  ('baseline', 'init-db/01-init.sql'),
  ('003', 'migrations/003_finance_campaign_ledger.sql'),
  ('004', 'migrations/004_resident_access.sql'),
  ('005', 'migrations/005_resident_contact_login.sql'),
  ('006', 'migrations/006_notification_channels.sql'),
  ('007', 'migrations/007_resident_password_resets.sql'),
  ('008', 'migrations/008_resident_sessions.sql'),
  ('009', 'migrations/009_stripe_events.sql'),
  ('010', 'migrations/010_stripe_connected_accounts.sql'),
  ('011', 'migrations/011_access_qr_replay_protection.sql'),
  ('012', 'migrations/012_manual_access_audit.sql'),
  ('013', 'migrations/013_guard_operations.sql'),
  ('014', 'migrations/014_tenant_feature_tables.sql'),
  ('015', 'migrations/015_admin_mfa.sql'),
  ('016', 'migrations/016_guard_services.sql'),
  ('017', 'migrations/017_crm_alerts.sql'),
  ('018', 'migrations/018_guard_consigns_and_panic.sql'),
  ('019', 'migrations/019_tenant_guard_schema_completion.sql'),
  ('020', 'migrations/020_tenant_finance_schema_completion.sql'),
  ('021', 'migrations/021_resident_app_refresh_sessions.sql');

COMMIT;