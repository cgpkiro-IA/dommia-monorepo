-- Migration 022: Resident mobile push-token registration

CREATE TABLE IF NOT EXISTS public.resident_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL,
  session_jti UUID NOT NULL REFERENCES public.resident_sessions(jti) ON DELETE CASCADE,
  client_type VARCHAR(16) NOT NULL CHECK (client_type IN ('ANDROID', 'IOS')),
  device_id UUID NOT NULL,
  token TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, resident_id, client_type, device_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS resident_push_tokens_token_idx
  ON public.resident_push_tokens (tenant_id, client_type, token);

CREATE INDEX IF NOT EXISTS resident_push_tokens_resident_idx
  ON public.resident_push_tokens (tenant_id, resident_id, is_active);
