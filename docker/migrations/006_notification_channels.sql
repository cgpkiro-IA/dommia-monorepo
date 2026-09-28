CREATE TABLE IF NOT EXISTS public.notification_channel_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  channel VARCHAR(32) NOT NULL CHECK (channel IN ('SMTP', 'WHATSAPP_BUSINESS')),
  enabled BOOLEAN NOT NULL DEFAULT false,
  config_encrypted TEXT NOT NULL,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, channel)
);