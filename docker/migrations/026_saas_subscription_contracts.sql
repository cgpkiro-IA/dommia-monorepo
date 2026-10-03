ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_tier VARCHAR(64),
  ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS billing_interval VARCHAR(16) DEFAULT 'MONTHLY',
  ADD COLUMN IF NOT EXISTS has_custom_domain BOOLEAN,
  ADD COLUMN IF NOT EXISTS active_addons JSONB,
  ADD COLUMN IF NOT EXISTS renewal_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS renewal_notice_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS renewal_notice_to VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contract_review_required BOOLEAN NOT NULL DEFAULT false;

UPDATE public.subscriptions
SET contract_review_required = true
WHERE amount IS NULL AND contract_review_required = false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'subscriptions_billing_interval_check'
      AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_billing_interval_check
      CHECK (billing_interval IN ('MONTHLY', 'ANNUAL'));
  END IF;
END $$;