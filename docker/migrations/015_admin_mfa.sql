ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS mfa_secret_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS mfa_pending_secret_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS mfa_pending_created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mfa_last_used_step BIGINT;

CREATE TABLE IF NOT EXISTS public.auth_mfa_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts SMALLINT NOT NULL DEFAULT 0,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS auth_mfa_challenges_pending_expiry_idx
  ON public.auth_mfa_challenges (expires_at)
  WHERE consumed_at IS NULL;