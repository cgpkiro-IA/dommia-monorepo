WITH tenant_schemas AS (
  SELECT nspname AS schema_name
  FROM pg_namespace
  WHERE left(nspname, 7) = 'tenant_'
),
required_public_tables(table_name) AS (
  VALUES
    ('tenants'),
    ('users'),
    ('user_tenants'),
    ('resident_sessions'),
    ('resident_refresh_tokens'),
    ('stripe_connected_accounts'),
    ('stripe_events'),
    ('crm_prospects'),
    ('saas_plans'),
    ('subscriptions'),
    ('gateway_inventory'),
    ('audit_logs'),
    ('notification_channel_configs'),
    ('auth_mfa_challenges'),
    ('crm_platform_alerts'),
    ('crm_telegram_config')
),
required_public_columns(table_name, column_name) AS (
  VALUES
    ('users', 'mfa_enabled'),
    ('users', 'mfa_secret_encrypted'),
    ('users', 'mfa_pending_secret_encrypted'),
    ('users', 'mfa_pending_created_at'),
    ('users', 'mfa_last_used_step'),
    ('resident_sessions', 'client_type'),
    ('resident_sessions', 'device_id'),
    ('resident_sessions', 'device_name'),
    ('resident_sessions', 'last_used_at'),
    ('resident_sessions', 'refresh_expires_at'),
    ('resident_sessions', 'refresh_absolute_expires_at'),
    ('resident_sessions', 'reuse_detected_at'),
    ('resident_refresh_tokens', 'session_id'),
    ('resident_refresh_tokens', 'token_hash'),
    ('resident_refresh_tokens', 'expires_at'),
    ('resident_refresh_tokens', 'used_at'),
    ('resident_refresh_tokens', 'revoked_at'),
    ('resident_refresh_tokens', 'replaced_by_id')
),
required_public_indexes(index_name) AS (
  VALUES
    ('resident_sessions_resident_active_idx'),
    ('resident_refresh_tokens_session_idx'),
    ('resident_refresh_tokens_active_expiry_idx')
),
required_tenant_tables(table_name) AS (
  VALUES
    ('properties'),
    ('residents'),
    ('resident_invitations'),
    ('resident_password_resets'),
    ('vehicles'),
    ('rfid_tags'),
    ('invitations'),
    ('access_logs'),
    ('fee_configurations'),
    ('financial_charges'),
    ('financial_payments'),
    ('financial_ledger_entries'),
    ('annual_payment_campaigns'),
    ('annual_payment_commitments'),
    ('annual_payment_allocations'),
    ('financial_monthly_report_settings'),
    ('financial_monthly_reports'),
    ('financial_expenses'),
    ('financial_report_evidence'),
    ('financial_monthly_report_reviews'),
    ('notices'),
    ('guard_deliveries'),
    ('guard_incidents'),
    ('guard_vehicle_flags'),
    ('guard_services')
),
required_tenant_columns(table_name, column_name) AS (
  VALUES
    ('properties', 'lot_size_m2'),
    ('properties', 'building_size_m2'),
    ('residents', 'must_change_password'),
    ('residents', 'access_totp_secret'),
    ('residents', 'last_access_used_step'),
    ('invitations', 'last_used_step'),
    ('access_logs', 'manual_reason'),
    ('access_logs', 'guard_user_id'),
    ('notices', 'target_audience'),
    ('notices', 'acknowledged_guards'),
    ('notices', 'expires_at'),
    ('guard_incidents', 'is_panic_alert'),
    ('guard_incidents', 'panic_type'),
    ('guard_incidents', 'resolution_notes'),
    ('guard_services', 'destination_type'),
    ('guard_services', 'destinations'),
    ('guard_services', 'status'),
    ('guard_services', 'exited_at'),
    ('fee_configurations', 'frequency'),
    ('fee_configurations', 'due_day'),
    ('fee_configurations', 'late_fee_amount'),
    ('fee_configurations', 'early_bird_discount_type'),
    ('fee_configurations', 'early_bird_discount_amount'),
    ('fee_configurations', 'early_bird_deadline_day'),
    ('fee_configurations', 'applies_to_all_properties'),
    ('fee_configurations', 'description'),
    ('fee_configurations', 'updated_at'),
    ('financial_charges', 'period_year'),
    ('financial_charges', 'period_month'),
    ('financial_charges', 'balance_due'),
    ('financial_charges', 'notes'),
    ('financial_payments', 'received_by_name'),
    ('financial_payments', 'payer_name'),
    ('financial_payments', 'notes'),
    ('financial_payments', 'gateway_provider'),
    ('financial_payments', 'gateway_tx_id'),
    ('financial_expenses', 'report_id'),
    ('financial_expenses', 'category'),
    ('financial_expenses', 'expense_date'),
    ('financial_expenses', 'amount'),
    ('financial_expenses', 'status'),
    ('financial_monthly_reports', 'period_start'),
    ('financial_monthly_reports', 'period_end'),
    ('financial_monthly_reports', 'revision'),
    ('financial_monthly_reports', 'status'),
    ('financial_monthly_reports', 'report_snapshot'),
    ('financial_report_evidence', 'report_id'),
    ('financial_report_evidence', 'expense_id'),
    ('financial_report_evidence', 'object_key'),
    ('financial_report_evidence', 'visibility'),
    ('financial_report_evidence', 'is_redacted'),
    ('financial_monthly_report_settings', 'reporting_start_month')
),
required_tenant_indexes(index_name) AS (
  VALUES
    ('financial_charges_period_unique'),
    ('annual_commitment_campaign_property'),
    ('annual_commitment_reference'),
    ('financial_ledger_source_unique'),
    ('annual_allocation_period_unique'),
    ('resident_invitations_resident_idx'),
    ('resident_password_resets_resident_idx'),
    ('guard_incidents_status_created_idx'),
    ('guard_services_status_idx'),
    ('invitations_resident_created_idx'),
    ('access_logs_invitation_idx'),
    ('idx_notices_audience'),
    ('idx_guard_incidents_panic'),
    ('financial_expenses_period_status_idx'),
    ('financial_expenses_report_idx'),
    ('financial_monthly_reports_one_draft_idx')
),
required_functions(signature) AS (
  VALUES
    ('public.provision_tenant_schema(text,text,text,integer,text)'),
    ('public.ensure_tenant_feature_tables(text)'),
    ('public.ensure_tenant_finance_schema(text)'),
    ('public.ensure_tenant_monthly_financial_reports(text)'),
    ('public.ensure_guard_consigns_and_panic(text)'),
    ('public.ensure_tenant_latest_guard_tables(text)')
),
missing AS (
  SELECT 'public table' AS object_type, 'public' AS schema_name, r.table_name AS object_name
  FROM required_public_tables r
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables t
    WHERE t.table_schema = 'public' AND t.table_name = r.table_name AND t.table_type = 'BASE TABLE'
  )
  UNION ALL
  SELECT 'public column', 'public', r.table_name || '.' || r.column_name
  FROM required_public_columns r
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = r.table_name AND c.column_name = r.column_name
  )
  UNION ALL
  SELECT 'public index', 'public', r.index_name
  FROM required_public_indexes r
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes i
    WHERE i.schemaname = 'public' AND i.indexname = r.index_name
  )
  UNION ALL
  SELECT 'tenant table', s.schema_name, r.table_name
  FROM tenant_schemas s CROSS JOIN required_tenant_tables r
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables t
    WHERE t.table_schema = s.schema_name AND t.table_name = r.table_name AND t.table_type = 'BASE TABLE'
  )
  UNION ALL
  SELECT 'tenant column', s.schema_name, r.table_name || '.' || r.column_name
  FROM tenant_schemas s CROSS JOIN required_tenant_columns r
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = s.schema_name AND c.table_name = r.table_name AND c.column_name = r.column_name
  )
  UNION ALL
  SELECT 'tenant index', s.schema_name, r.index_name
  FROM tenant_schemas s CROSS JOIN required_tenant_indexes r
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes i
    WHERE i.schemaname = s.schema_name AND i.indexname = r.index_name
  )
  UNION ALL
  SELECT 'missing tenant schema', 'public', t.slug
  FROM public.tenants t
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_namespace n
    WHERE n.nspname = 'tenant_' || lower(regexp_replace(t.slug, '[^a-zA-Z0-9_]', '_', 'g'))
  )
  UNION ALL
  SELECT 'orphan tenant schema', s.schema_name, 'no matching public.tenants row'
  FROM tenant_schemas s
  WHERE NOT EXISTS (
    SELECT 1 FROM public.tenants t
    WHERE lower(replace(t.slug, '-', '_')) = substring(s.schema_name FROM 8)
  )
  UNION ALL
  SELECT 'public function', 'public', r.signature
  FROM required_functions r
  WHERE to_regprocedure(r.signature) IS NULL
)
SELECT status, object_type, schema_name, object_name
FROM (
  SELECT 'MISSING' AS status, object_type, schema_name, object_name
  FROM missing
  UNION ALL
  SELECT CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
         'summary',
         'database',
         COUNT(*) || ' missing requirement(s)'
  FROM missing
) checks
ORDER BY status, schema_name, object_type, object_name;