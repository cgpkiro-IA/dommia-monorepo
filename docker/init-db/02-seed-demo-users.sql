-- ==============================================================================
-- DOMMIA DEMO SEED DATA (USERS, PROPERTIES & ACCESS CONTROLS)
-- ==============================================================================

-- 1. Create global users table in public schema for SaaS operators and staff
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'SUPER_ADMIN', -- SUPER_ADMIN, COMMERCIAL_EXEC, SUPPORT
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Global Users (Password: DommiaPassword2026! - crypt hashed)
INSERT INTO public.users (email, password_hash, first_name, last_name, role)
VALUES 
    ('superadmin@dommia.com.mx', crypt('DommiaPassword2026!', gen_salt('bf', 8)), 'Carlos', 'Administrador Global', 'SUPER_ADMIN'),
    ('ventas@dommia.com.mx', crypt('DommiaPassword2026!', gen_salt('bf', 8)), 'Mariana', 'Ejecutiva Comercial', 'COMMERCIAL_EXEC'),
    ('soporte@dommia.com.mx', crypt('DommiaPassword2026!', gen_salt('bf', 8)), 'Alejandro', 'Soporte Técnico', 'SUPPORT')
ON CONFLICT (email) DO NOTHING;

-- 2. Seed Demo Properties in tenant_demo
DO $$
DECLARE
    v_prop1_id UUID;
    v_prop2_id UUID;
    v_prop3_id UUID;
    v_res1_id UUID;
    v_res2_id UUID;
    v_veh1_id UUID;
    v_veh2_id UUID;
BEGIN
    -- Propiedad 1: Al corriente
    INSERT INTO tenant_demo.properties (street, exterior_number, block, lot, is_delinquent, notes)
    VALUES ('Paseo de los Olivos', '101', 'Manzana 3', 'Lote 14', false, 'Propiedad habitada - Al corriente')
    RETURNING id INTO v_prop1_id;

    -- Propiedad 2: Morosa (adeudos pendientes)
    INSERT INTO tenant_demo.properties (street, exterior_number, block, lot, is_delinquent, notes)
    VALUES ('Paseo de los Olivos', '102', 'Manzana 3', 'Lote 15', true, 'Propiedad morosa - Cuotas vencidas')
    RETURNING id INTO v_prop2_id;

    -- Propiedad 3: Al corriente
    INSERT INTO tenant_demo.properties (street, exterior_number, block, lot, is_delinquent, notes)
    VALUES ('Paseo de los Robles', '205', 'Manzana 5', 'Lote 8', false, 'Familia González - Al corriente')
    RETURNING id INTO v_prop3_id;

    -- Residentes para Propiedad 1 (Al corriente)
    INSERT INTO tenant_demo.residents (property_id, first_name, last_name, email, phone, role, is_primary, password_hash)
    VALUES (v_prop1_id, 'Carlos', 'Mendoza', 'carlos.mendoza@gmail.com', '+525512345678', 'OWNER', true, crypt('Residente2026!', gen_salt('bf', 8)))
    RETURNING id INTO v_res1_id;

    INSERT INTO tenant_demo.residents (property_id, first_name, last_name, email, phone, role, is_primary, password_hash)
    VALUES (v_prop1_id, 'Elena', 'Mendoza', 'elena.mendoza@gmail.com', '+525512345679', 'FAMILY_MEMBER', false, crypt('Residente2026!', gen_salt('bf', 8)));

    -- Residente para Propiedad 2 (Morosa)
    INSERT INTO tenant_demo.residents (property_id, first_name, last_name, email, phone, role, is_primary, password_hash)
    VALUES 
        (v_prop2_id, 'Roberto', 'Garza', 'roberto.garza@gmail.com', '+525598765432', 'OWNER', true, crypt('Residente2026!', gen_salt('bf', 8)))
    RETURNING id INTO v_res2_id;

    -- Vehículos
    INSERT INTO tenant_demo.vehicles (property_id, plates, brand, model, color)
    VALUES 
        (v_prop1_id, 'NXX-4521', 'Mazda', 'CX-5', 'Gris Grafito')
    RETURNING id INTO v_veh1_id;

    INSERT INTO tenant_demo.vehicles (property_id, plates, brand, model, color)
    VALUES 
        (v_prop2_id, 'YZT-8842', 'BMW', 'Serie 3', 'Negro')
    RETURNING id INTO v_veh2_id;

    -- TAGs RFID
    -- TAG activo y autorizado
    INSERT INTO tenant_demo.rfid_tags (property_id, vehicle_id, tag_code, description, is_active)
    VALUES (v_prop1_id, v_veh1_id, 'TAG-UHF-8821', 'Vehículo Mazda CX-5 Carlos', true);

    -- TAG de residente moroso (activo físicamente pero con propiedad morosa)
    INSERT INTO tenant_demo.rfid_tags (property_id, vehicle_id, tag_code, description, is_active)
    VALUES (v_prop2_id, v_veh2_id, 'TAG-UHF-9932', 'Vehículo BMW Roberto', true);

    -- Invitación con QR Dinámico (TOTP)
    INSERT INTO tenant_demo.invitations (
        property_id, resident_id, visitor_name, visitor_phone, invitation_type,
        valid_from, valid_until, totp_secret, is_active
    ) VALUES (
        v_prop1_id,
        v_res1_id,
        'Alejandro Visita Familiar',
        '+525544332211',
        'SINGLE',
        NOW() - INTERVAL '1 hour',
        NOW() + INTERVAL '24 hours',
        'JBSWY3DPEHPK3PXP', -- Semilla Base32 estándar para TOTP
        true
    );

    -- Cargos Financieros
    -- Cargo pagado para Casa 101
    INSERT INTO tenant_demo.financial_charges (property_id, concept, amount, due_date, status)
    VALUES (v_prop1_id, 'Cuota Mantenimiento Septiembre 2026', 1500.00, '2026-09-10', 'PAID');

    -- Cargos vencidos para Casa 102 (Morosa)
    INSERT INTO tenant_demo.financial_charges (property_id, concept, amount, due_date, status)
    VALUES 
        (v_prop2_id, 'Cuota Mantenimiento Julio 2026', 1500.00, '2026-07-10', 'OVERDUE'),
        (v_prop2_id, 'Cuota Mantenimiento Agosto 2026', 1500.00, '2026-08-10', 'OVERDUE'),
        (v_prop2_id, 'Cuota Mantenimiento Septiembre 2026', 1500.00, '2026-09-10', 'OVERDUE');

    -- Gateway de Caseta Demo registrado en inventario global
    INSERT INTO public.gateway_inventory (
        uuid, tenant_id, name, status, last_heartbeat, firmware_version, ip_local
    ) VALUES (
        'gw-caseta-norte-laspalmas-01',
        (SELECT id FROM public.tenants WHERE slug = 'demo'),
        'Gateway Caseta Principal Norte',
        'ONLINE',
        NOW(),
        '1.2.0',
        '192.168.1.50'
    ) ON CONFLICT (uuid) DO NOTHING;

END $$;
