CREATE TABLE IF NOT EXISTS public.resident_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jti UUID UNIQUE NOT NULL,
  resident_id UUID NOT NULL,
  tenant_slug VARCHAR(150) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS resident_sessions_lookup_idx ON public.resident_sessions(jti, resident_id, tenant_slug);