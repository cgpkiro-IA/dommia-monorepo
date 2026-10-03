ALTER TABLE public.saas_plans
  ADD COLUMN IF NOT EXISTS min_properties INTEGER NOT NULL DEFAULT 1;

WITH ordered_plans AS (
  SELECT
    id,
    max_properties,
    LAG(max_properties) OVER (ORDER BY sort_order, monthly_price, code) AS previous_max
  FROM public.saas_plans
)
UPDATE public.saas_plans AS plan
SET min_properties = CASE
  WHEN ordered_plans.previous_max IS NULL THEN LEAST(15, plan.max_properties)
  ELSE LEAST(ordered_plans.previous_max + 1, plan.max_properties)
END
FROM ordered_plans
WHERE plan.id = ordered_plans.id
  AND plan.min_properties = 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'saas_plans_min_max_check'
      AND conrelid = 'public.saas_plans'::regclass
  ) THEN
    ALTER TABLE public.saas_plans
      ADD CONSTRAINT saas_plans_min_max_check
      CHECK (min_properties >= 1 AND min_properties <= max_properties);
  END IF;
END $$;