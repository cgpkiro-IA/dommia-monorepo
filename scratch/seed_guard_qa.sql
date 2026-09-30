BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE lower(replace(slug, '-', '_')) = 'guard_qa') THEN
    PERFORM public.provision_tenant_schema(
      'guard-qa',
      'Comunidad QA Guard',
      'BASIC',
      25,
      'admin.guard-qa@dommia.test'
    );
  END IF;
END $$;

SELECT public.ensure_tenant_feature_tables('guard-qa');
SELECT public.ensure_tenant_finance_schema('guard-qa');
SELECT public.ensure_tenant_latest_guard_tables('guard-qa');

UPDATE public.tenants
SET modules = modules || '{"ACCESS_QR": true, "dynamic_qr": true, "rfid": false, "stripe_auto": false, "STRIPE": false, "STRIPE_CONNECT": false, "FINANCE_STRIPE": false, "NOTIFICATIONS_PREMIUM": false}'::jsonb,
    updated_at = NOW()
  WHERE lower(replace(slug, '-', '_')) = 'guard_qa';

ALTER TABLE tenant_guard_qa.properties
  ADD COLUMN IF NOT EXISTS lot_size_m2 NUMERIC(10,2) DEFAULT 150.00,
  ADD COLUMN IF NOT EXISTS building_size_m2 NUMERIC(10,2) DEFAULT 180.00;

ALTER TABLE tenant_guard_qa.residents
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS access_totp_secret VARCHAR(64) NOT NULL DEFAULT encode(gen_random_bytes(20), 'hex'),
  ADD COLUMN IF NOT EXISTS last_access_used_step BIGINT;

CREATE TABLE IF NOT EXISTS tenant_guard_qa.resident_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES tenant_guard_qa.residents(id) ON DELETE CASCADE,
  token_hash VARCHAR(128) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tenant_guard_qa.invitations
  ADD COLUMN IF NOT EXISTS last_used_step BIGINT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE tenant_guard_qa.access_logs
  ADD COLUMN IF NOT EXISTS manual_reason TEXT,
  ADD COLUMN IF NOT EXISTS guard_user_id UUID;

INSERT INTO tenant_guard_qa.properties (street, exterior_number, block, lot, notes, is_delinquent)
SELECT seed.street, seed.exterior_number, seed.block, seed.lot, seed.notes, seed.is_delinquent
FROM (VALUES
  ('Circuito del Roble', '101', 'Norte', '01', 'Casa de prueba, propietario', FALSE),
  ('Circuito del Roble', '102', 'Norte', '02', 'Casa de prueba, propiedad con adeudo', TRUE),
  ('Avenida del Lago', '203', 'Sur', '03', 'Casa de prueba, familia', FALSE)
) AS seed(street, exterior_number, block, lot, notes, is_delinquent)
WHERE NOT EXISTS (
  SELECT 1 FROM tenant_guard_qa.properties p
  WHERE p.street = seed.street AND p.exterior_number = seed.exterior_number
);

INSERT INTO tenant_guard_qa.residents (
  property_id, first_name, last_name, email, phone, role, is_primary, password_hash,
  must_change_password, is_active
)
SELECT p.id, seed.first_name, seed.last_name, seed.email, seed.phone, seed.role,
       seed.is_primary, crypt('ResidentQa2026!', gen_salt('bf', 10)), FALSE, TRUE
FROM (VALUES
  ('101', 'Ana', 'Rivera', 'ana.rivera@qa.dommia.test', '+525500001101', 'OWNER', TRUE),
  ('102', 'Bruno', 'Salas', 'bruno.salas@qa.dommia.test', '+525500001102', 'OWNER', TRUE),
  ('102', 'Clara', 'Vega', 'clara.vega@qa.dommia.test', '+525500001103', 'TENANT', FALSE),
  ('203', 'Diego', 'Luna', 'diego.luna@qa.dommia.test', '+525500001104', 'FAMILY_MEMBER', TRUE)
) AS seed(exterior_number, first_name, last_name, email, phone, role, is_primary)
JOIN tenant_guard_qa.properties p ON p.exterior_number = seed.exterior_number
WHERE NOT EXISTS (
  SELECT 1 FROM tenant_guard_qa.residents r WHERE r.email = seed.email
);

INSERT INTO tenant_guard_qa.vehicles (property_id, resident_id, plates, brand, model, color)
SELECT p.id, r.id, seed.plates, seed.brand, seed.model, seed.color
FROM (VALUES
  ('101', 'ana.rivera@qa.dommia.test', 'QAA-1001', 'Toyota', 'Corolla', 'Blanco'),
  ('102', 'bruno.salas@qa.dommia.test', 'QAB-2002', 'Nissan', 'Versa', 'Gris'),
  ('203', 'diego.luna@qa.dommia.test', 'QAC-3003', 'Honda', 'CR-V', 'Azul')
) AS seed(exterior_number, email, plates, brand, model, color)
JOIN tenant_guard_qa.properties p ON p.exterior_number = seed.exterior_number
JOIN tenant_guard_qa.residents r ON r.email = seed.email
WHERE NOT EXISTS (
  SELECT 1 FROM tenant_guard_qa.vehicles v WHERE UPPER(v.plates) = seed.plates
);

CREATE TABLE IF NOT EXISTS tenant_guard_qa.guard_vehicle_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plates VARCHAR(15) NOT NULL,
  normalized_plates VARCHAR(15) UNIQUE NOT NULL,
  flag_type VARCHAR(24) NOT NULL CHECK (flag_type IN ('BLOCKED', 'FREQUENT_VISITOR')),
  reason VARCHAR(300) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_by UUID,
  removed_at TIMESTAMPTZ
);

INSERT INTO public.users (email, password_hash, first_name, last_name, role, tenant_id, is_active)
SELECT seed.email, crypt('GuardQa2026!', gen_salt('bf', 10)), seed.first_name, seed.last_name,
       seed.role, tenant.id, TRUE
FROM public.tenants tenant
CROSS JOIN (VALUES
  ('admin.guard-qa@dommia.test', 'Admin', 'QA Guard', 'TENANT_ADMIN'),
  ('guard.norte@qa.dommia.test', 'Elena', 'Guardia Norte', 'GUARD'),
  ('guard.sur@qa.dommia.test', 'Mario', 'Guardia Sur', 'GUARD'),
  ('guard.apoyo@qa.dommia.test', 'Sofía', 'Guardia Apoyo', 'GUARD')
) AS seed(email, first_name, last_name, role)
WHERE lower(replace(tenant.slug, '-', '_')) = 'guard_qa'
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.user_tenants (user_id, tenant_id, role)
SELECT u.id, tenant.id, seed.role
FROM public.tenants tenant
CROSS JOIN (VALUES
  ('admin.guard-qa@dommia.test', 'TENANT_ADMIN'),
  ('guard.norte@qa.dommia.test', 'GUARD'),
  ('guard.sur@qa.dommia.test', 'GUARD'),
  ('guard.apoyo@qa.dommia.test', 'GUARD')
) AS seed(email, role)
JOIN public.users u ON LOWER(u.email) = seed.email
WHERE lower(replace(tenant.slug, '-', '_')) = 'guard_qa'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_tenants ut WHERE ut.user_id = u.id AND ut.tenant_id = tenant.id
  );

INSERT INTO tenant_guard_qa.guard_vehicle_flags (
  plates, normalized_plates, flag_type, reason, created_by
)
SELECT seed.plates, seed.normalized_plates, seed.flag_type, seed.reason, admin.id
FROM public.users admin
CROSS JOIN (VALUES
  ('QAF-7777', 'QAF7777', 'FREQUENT_VISITOR', 'Proveedor de mantenimiento de acceso frecuente'),
  ('QAB-9999', 'QAB9999', 'BLOCKED', 'Vehículo de prueba en lista de bloqueo')
) AS seed(plates, normalized_plates, flag_type, reason)
WHERE admin.email = 'admin.guard-qa@dommia.test'
ON CONFLICT (normalized_plates) DO UPDATE
SET plates = EXCLUDED.plates,
    flag_type = EXCLUDED.flag_type,
    reason = EXCLUDED.reason,
    is_active = TRUE,
    removed_by = NULL,
    removed_at = NULL;

COMMIT;