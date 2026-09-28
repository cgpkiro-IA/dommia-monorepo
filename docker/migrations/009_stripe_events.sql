CREATE TABLE IF NOT EXISTS public.stripe_events (
  event_id VARCHAR(255) PRIMARY KEY,
  event_type VARCHAR(128) NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);