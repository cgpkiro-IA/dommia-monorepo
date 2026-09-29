CREATE TABLE IF NOT EXISTS public.crm_platform_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity VARCHAR(16) NOT NULL CHECK (severity IN ('CRITICAL', 'WARNING', 'INFO')),
  category VARCHAR(32) NOT NULL CHECK (category IN ('CHANNELS', 'SECURITY', 'BILLING', 'SYSTEM', 'TELEMETRY')),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  tenant_slug VARCHAR(64),
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED')),
  acknowledged_by VARCHAR(150),
  acknowledged_at TIMESTAMPTZ,
  resolved_by VARCHAR(150),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS crm_platform_alerts_status_idx
  ON public.crm_platform_alerts (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.crm_telegram_config (
  id VARCHAR(32) PRIMARY KEY DEFAULT 'default',
  bot_token TEXT,
  chat_id TEXT,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  bot_username VARCHAR(100),
  last_tested_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
