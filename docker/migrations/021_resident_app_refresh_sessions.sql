ALTER TABLE public.resident_sessions
  ADD COLUMN IF NOT EXISTS client_type VARCHAR(16),
  ADD COLUMN IF NOT EXISTS device_id UUID,
  ADD COLUMN IF NOT EXISTS device_name VARCHAR(120),
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refresh_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refresh_absolute_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reuse_detected_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'resident_sessions_client_type_check'
      AND conrelid = 'public.resident_sessions'::regclass
  ) THEN
    ALTER TABLE public.resident_sessions
      ADD CONSTRAINT resident_sessions_client_type_check
      CHECK (client_type IS NULL OR client_type IN ('ANDROID', 'IOS', 'WEB'));
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS resident_sessions_resident_active_idx
  ON public.resident_sessions (resident_id, tenant_slug, created_at DESC)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS public.resident_refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.resident_sessions(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  replaced_by_id UUID REFERENCES public.resident_refresh_tokens(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS resident_refresh_tokens_session_idx
  ON public.resident_refresh_tokens (session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS resident_refresh_tokens_active_expiry_idx
  ON public.resident_refresh_tokens (expires_at)
  WHERE used_at IS NULL AND revoked_at IS NULL;