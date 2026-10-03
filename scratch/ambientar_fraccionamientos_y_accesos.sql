-- ==============================================================================
-- DOMMIA MULTI-TENANT AMBIENTATION SCRIPT
-- Provisiona y ambienta Fraccionamientos, Casetas/Gateways IoT y Accesos
-- ==============================================================================

-- 1. Ensure public.provision_tenant_schema creates all needed tables (including fee_configurations)
CREATE OR REPLACE FUNCTION public.provision_tenant_schema(
    p_slug TEXT,
    p_name TEXT,
    p_tier TEXT DEFAULT 'STANDARD',
    p_max_properties INT DEFAULT 100,
    p_contact_email TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_tenant_id UUID;
    v_clean_slug TEXT := lower(regexp_replace(p_slug, '[^a-zA-Z0-9_]', '_', 'g'));
    v_schema_name TEXT := 'tenant_' || v_clean_slug;
    v_existing_id UUID;
BEGIN
    -- Check if tenant already exists
    SELECT id INTO v_existing_id FROM public.tenants WHERE lower(slug) = v_clean_slug;
    IF v_existing_id IS NOT NULL THEN
        v_tenant_id := v_existing_id;
    ELSE
        INSERT INTO public.tenants (
            slug, name, subdomain, tier, max_properties, contact_email, access_url
        ) VALUES (
            v_clean_slug, p_name, v_clean_slug || '.dommia.com.mx', p_tier, p_max_properties, p_contact_email, 'standar.dommia.com.mx/' || v_clean_slug
        ) RETURNING id INTO v_tenant_id;
    END IF;

    -- Create dedicated schema
    EXECUTE 'CREATE SCHEMA IF NOT EXISTS ' || quote_ident(v_schema_name);

    -- Properties
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || quote_ident(v_schema_name) || '.properties (' ||
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ' ||
        'street VARCHAR(150) NOT NULL, ' ||
        'exterior_number VARCHAR(30) NOT NULL, ' ||
        'interior_number VARCHAR(30), ' ||
        'block VARCHAR(30), ' ||
        'lot VARCHAR(30), ' ||
        'lot_size_m2 NUMERIC(10,2) DEFAULT 150.00, ' ||
        'building_size_m2 NUMERIC(10,2) DEFAULT 180.00, ' ||
        'notes TEXT, ' ||
        'is_delinquent BOOLEAN NOT NULL DEFAULT false, ' ||
        'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), ' ||
        'updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()' ||
    ')';

    -- Residents
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || quote_ident(v_schema_name) || '.residents (' ||
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ' ||
        'property_id UUID NOT NULL REFERENCES ' || quote_ident(v_schema_name) || '.properties(id) ON DELETE CASCADE, ' ||
        'first_name VARCHAR(100) NOT NULL, ' ||
        'last_name VARCHAR(100) NOT NULL, ' ||
        'email VARCHAR(150) UNIQUE NOT NULL, ' ||
        'phone VARCHAR(50), ' ||
        'role VARCHAR(32) NOT NULL DEFAULT ''OWNER'', ' ||
        'is_primary BOOLEAN NOT NULL DEFAULT true, ' ||
        'password_hash VARCHAR(255), ' ||
        'is_active BOOLEAN NOT NULL DEFAULT true, ' ||
        'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), ' ||
        'updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()' ||
    ')';

    -- Vehicles
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || quote_ident(v_schema_name) || '.vehicles (' ||
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ' ||
        'property_id UUID NOT NULL REFERENCES ' || quote_ident(v_schema_name) || '.properties(id) ON DELETE CASCADE, ' ||
        'resident_id UUID REFERENCES ' || quote_ident(v_schema_name) || '.residents(id) ON DELETE SET NULL, ' ||
        'plates VARCHAR(30) NOT NULL, ' ||
        'brand VARCHAR(50), ' ||
        'model VARCHAR(50), ' ||
        'color VARCHAR(30), ' ||
        'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()' ||
    ')';

    -- RFID Tags
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || quote_ident(v_schema_name) || '.rfid_tags (' ||
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ' ||
        'property_id UUID NOT NULL REFERENCES ' || quote_ident(v_schema_name) || '.properties(id) ON DELETE CASCADE, ' ||
        'vehicle_id UUID REFERENCES ' || quote_ident(v_schema_name) || '.vehicles(id) ON DELETE SET NULL, ' ||
        'tag_code VARCHAR(64) UNIQUE NOT NULL, ' ||
        'description VARCHAR(100), ' ||
        'is_active BOOLEAN NOT NULL DEFAULT true, ' ||
        'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()' ||
    ')';

    -- Invitations (Dynamic TOTP Seeds)
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || quote_ident(v_schema_name) || '.invitations (' ||
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ' ||
        'property_id UUID NOT NULL REFERENCES ' || quote_ident(v_schema_name) || '.properties(id) ON DELETE CASCADE, ' ||
        'resident_id UUID NOT NULL REFERENCES ' || quote_ident(v_schema_name) || '.residents(id) ON DELETE CASCADE, ' ||
        'visitor_name VARCHAR(150) NOT NULL, ' ||
        'visitor_phone VARCHAR(50), ' ||
        'invitation_type VARCHAR(32) NOT NULL DEFAULT ''SINGLE'', ' ||
        'valid_from TIMESTAMPTZ NOT NULL, ' ||
        'valid_until TIMESTAMPTZ NOT NULL, ' ||
        'totp_secret VARCHAR(64) NOT NULL DEFAULT encode(gen_random_bytes(20), ''hex''), ' ||
        'is_active BOOLEAN NOT NULL DEFAULT true, ' ||
        'used_at TIMESTAMPTZ, ' ||
        'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()' ||
    ')';

    -- Access Logs
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || quote_ident(v_schema_name) || '.access_logs (' ||
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ' ||
        'access_type VARCHAR(32) NOT NULL, ' ||
        'identifier VARCHAR(100) NOT NULL, ' ||
        'property_id UUID REFERENCES ' || quote_ident(v_schema_name) || '.properties(id) ON DELETE SET NULL, ' ||
        'is_granted BOOLEAN NOT NULL, ' ||
        'rejection_reason VARCHAR(100), ' ||
        'gateway_uuid VARCHAR(64), ' ||
        'timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()' ||
    ')';

    -- Fee Configurations
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || quote_ident(v_schema_name) || '.fee_configurations (' ||
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ' ||
        'name VARCHAR(150) NOT NULL, ' ||
        'fee_type VARCHAR(32) NOT NULL, ' ||
        'base_amount NUMERIC(12,2) NOT NULL, ' ||
        'currency VARCHAR(10) NOT NULL DEFAULT ''MXN'', ' ||
        'due_day_of_month INT NOT NULL DEFAULT 10, ' ||
        'late_fee_type VARCHAR(32) NOT NULL DEFAULT ''NONE'', ' ||
        'late_fee_value NUMERIC(10,2) NOT NULL DEFAULT 0.00, ' ||
        'grace_days INT NOT NULL DEFAULT 5, ' ||
        'early_bird_discount_type VARCHAR(32) NOT NULL DEFAULT ''NONE'', ' ||
        'early_bird_discount_value NUMERIC(10,2) NOT NULL DEFAULT 0.00, ' ||
        'early_bird_limit_day INT NOT NULL DEFAULT 5, ' ||
        'is_active BOOLEAN NOT NULL DEFAULT true, ' ||
        'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), ' ||
        'updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()' ||
    ')';

    -- Financial Charges
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || quote_ident(v_schema_name) || '.financial_charges (' ||
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ' ||
        'property_id UUID NOT NULL REFERENCES ' || quote_ident(v_schema_name) || '.properties(id) ON DELETE CASCADE, ' ||
        'fee_config_id UUID REFERENCES ' || quote_ident(v_schema_name) || '.fee_configurations(id) ON DELETE SET NULL, ' ||
        'concept VARCHAR(200) NOT NULL, ' ||
        'amount NUMERIC(12,2) NOT NULL, ' ||
        'due_date DATE NOT NULL, ' ||
        'status VARCHAR(32) NOT NULL DEFAULT ''PENDING'', ' ||
        'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), ' ||
        'updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()' ||
    ')';

    -- Financial Payments
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || quote_ident(v_schema_name) || '.financial_payments (' ||
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ' ||
        'property_id UUID NOT NULL REFERENCES ' || quote_ident(v_schema_name) || '.properties(id) ON DELETE CASCADE, ' ||
        'charge_id UUID REFERENCES ' || quote_ident(v_schema_name) || '.financial_charges(id) ON DELETE SET NULL, ' ||
        'amount NUMERIC(12,2) NOT NULL, ' ||
        'payment_method VARCHAR(32) NOT NULL, ' ||
        'reference VARCHAR(128), ' ||
        'receipt_url TEXT, ' ||
        'status VARCHAR(32) NOT NULL DEFAULT ''PENDING_APPROVAL'', ' ||
        'approved_by UUID, ' ||
        'paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), ' ||
        'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()' ||
    ')';

    -- Notices
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || quote_ident(v_schema_name) || '.notices (' ||
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ' ||
        'title VARCHAR(200) NOT NULL, ' ||
        'content TEXT NOT NULL, ' ||
        'category VARCHAR(32) NOT NULL DEFAULT ''GENERAL'', ' ||
        'priority VARCHAR(32) NOT NULL DEFAULT ''MEDIUM'', ' ||
        'author_name VARCHAR(100) NOT NULL DEFAULT ''Administración'', ' ||
        'is_pinned BOOLEAN NOT NULL DEFAULT false, ' ||
        'is_published BOOLEAN NOT NULL DEFAULT true, ' ||
        'published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), ' ||
        'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), ' ||
        'updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()' ||
    ')';

    RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. Provision schemas for ALL Official Communities
-- ==============================================================================
SELECT public.provision_tenant_schema('demo', 'Fraccionamiento Residencial Las Palmas', 'PROFESSIONAL', 150, 'contacto@laspalmas.dommia.com.mx');
SELECT public.provision_tenant_schema('valle_real', 'Fraccionamiento Valle Real', 'STANDARD', 80, 'administracion@vallereal.dommia.com.mx');
SELECT public.provision_tenant_schema('cumbres', 'Fracc. Cumbres del Valle', 'BASIC', 50, 'contacto@cumbresdelvalle.com');
SELECT public.provision_tenant_schema('bosques', 'Privada Bosques del Reino', 'ENTERPRISE', 300, 'gerencia@bosquesdelreino.mx');
SELECT public.provision_tenant_schema('valle_oriente', 'Residencial Valle Oriente', 'STANDARD', 120, 'contacto@valleoriente.dommia.com.mx');

-- Update URLs, domains, and active modules for each tenant
UPDATE public.tenants SET
    access_url = 'https://demo.dommia.com.mx',
    has_custom_domain = false,
    custom_domain = NULL,
    modules = '["FINANCE", "ACCESS_QR", "RESIDENT_APP", "IOT_GATEWAY"]'::jsonb,
    is_active = true
WHERE slug = 'demo';

UPDATE public.tenants SET
    access_url = 'standar.dommia.com.mx/valle_real',
    has_custom_domain = false,
    custom_domain = 'vallereal.dommia.com.mx',
    modules = '["FINANCE", "ACCESS_QR", "RESIDENT_APP", "IOT_GATEWAY"]'::jsonb,
    is_active = true
WHERE slug = 'valle_real';

UPDATE public.tenants SET
    access_url = 'standar.dommia.com.mx/cumbres',
    has_custom_domain = false,
    custom_domain = 'cumbres.dommia.com.mx',
    modules = '["FINANCE", "ACCESS_QR", "RESIDENT_APP"]'::jsonb,
    is_active = true
WHERE slug = 'cumbres';

UPDATE public.tenants SET
    access_url = 'https://bosquesdelreino.mx',
    has_custom_domain = true,
    custom_domain = 'bosquesdelreino.mx',
    modules = '["FINANCE", "ACCESS_QR", "RESIDENT_APP", "IOT_GATEWAY"]'::jsonb,
    is_active = true
WHERE slug = 'bosques';

UPDATE public.tenants SET
    access_url = 'standar.dommia.com.mx/valle_oriente',
    has_custom_domain = false,
    custom_domain = 'valleoriente.dommia.com.mx',
    modules = '["FINANCE", "ACCESS_QR", "RESIDENT_APP", "IOT_GATEWAY"]'::jsonb,
    is_active = true
WHERE slug = 'valle_oriente';



-- ==============================================================================
-- 3. Gateways IoT Inventory (Accesos Vehiculares / Peatonales en Caseta)
-- ==============================================================================
DELETE FROM public.gateway_inventory;

INSERT INTO public.gateway_inventory (uuid, tenant_id, name, firmware_version, ip_local, status, last_heartbeat, notes)
SELECT 'gw-caseta-norte-laspalmas-01', id, 'Gateway Caseta Principal Norte (Entrada Colonos y Visitas)', 'v1.2.4-dommia-edge', '192.168.1.50', 'ONLINE', NOW(), 'Antena UHF largo alcance + Lector QR escáner 2D'
FROM public.tenants WHERE slug = 'demo';

INSERT INTO public.gateway_inventory (uuid, tenant_id, name, firmware_version, ip_local, status, last_heartbeat, notes)
SELECT 'gw-caseta-sur-laspalmas-02', id, 'Gateway Caseta Sur (Salida Colonos)', 'v1.2.4-dommia-edge', '192.168.1.51', 'ONLINE', NOW(), 'Lector de salida automática por antena UHF largo alcance'
FROM public.tenants WHERE slug = 'demo';

INSERT INTO public.gateway_inventory (uuid, tenant_id, name, firmware_version, ip_local, status, last_heartbeat, notes)
SELECT 'gw-caseta-principal-vallereal-01', id, 'Gateway Caseta Acceso Valle Real', 'v1.2.4-dommia-edge', '192.168.2.10', 'ONLINE', NOW(), 'Controladora Wiegand 26-bit para pluma vehicular y lector QR caseta'
FROM public.tenants WHERE slug = 'valle_real';

INSERT INTO public.gateway_inventory (uuid, tenant_id, name, firmware_version, ip_local, status, last_heartbeat, notes)
SELECT 'gw-caseta-cumbres-01', id, 'Gateway Caseta Única Cumbres del Valle', 'v1.2.0', '192.168.3.25', 'ONLINE', NOW(), 'Pluma electromecánica con apertura manual y lector QR visitantes'
FROM public.tenants WHERE slug = 'cumbres';

INSERT INTO public.gateway_inventory (uuid, tenant_id, name, firmware_version, ip_local, status, last_heartbeat, notes)
SELECT 'gw-caseta-bosques-01', id, 'Gateway Caseta Principal Poniente (Bosques)', 'v1.3.0-enterprise', '10.0.1.100', 'ONLINE', NOW(), 'Barrera de alta velocidad RFID UHF + Lector OCR Placas'
FROM public.tenants WHERE slug = 'bosques';

INSERT INTO public.gateway_inventory (uuid, tenant_id, name, firmware_version, ip_local, status, last_heartbeat, notes)
SELECT 'gw-caseta-bosques-02', id, 'Gateway Caseta Residentes Oriente (Bosques)', 'v1.3.0-enterprise', '10.0.1.101', 'ONLINE', NOW(), 'Acceso exclusivo residentes TAG UHF'
FROM public.tenants WHERE slug = 'bosques';

INSERT INTO public.gateway_inventory (uuid, tenant_id, name, firmware_version, ip_local, status, last_heartbeat, notes)
SELECT 'gw-caseta-valleoriente-01', id, 'Gateway Caseta Monumental Valle Oriente', 'v1.2.4-dommia-edge', '192.168.4.15', 'ONLINE', NOW(), 'Pluma vehicular doble y torniquete peatonal'
FROM public.tenants WHERE slug = 'valle_oriente';


-- ==============================================================================
-- 4. AMBIENTAR DATOS COMPLETOS PARA TENANT: VALLE_REAL (Dommia Resident PWA)
-- ==============================================================================

-- 4.1 Properties
INSERT INTO tenant_valle_real.properties (id, street, exterior_number, interior_number, block, lot, lot_size_m2, building_size_m2, is_delinquent, notes) VALUES
('a0000000-0000-0000-0000-000000000142', 'Cda. Los Cedros', '142', NULL, 'Mza 3', 'Lote 14', 180.00, 220.00, false, 'Casa de Carlos Villarreal (Residente Demo Principal PWA)'),
('a0000000-0000-0000-0000-000000000101', 'Cda. Los Cedros', '101', NULL, 'Mza 1', 'Lote 01', 160.00, 195.00, false, 'Familia González'),
('a0000000-0000-0000-0000-000000000102', 'Cda. Los Cedros', '102', NULL, 'Mza 1', 'Lote 02', 155.00, 190.00, false, 'Familia Garza'),
('a0000000-0000-0000-0000-000000000103', 'Cda. Los Cedros', '103', NULL, 'Mza 1', 'Lote 03', 150.00, 185.00, true, 'Propiedad con adeudo de mantenimiento'),
('a0000000-0000-0000-0000-000000000104', 'Cda. Los Cedros', '104', NULL, 'Mza 1', 'Lote 04', 170.00, 210.00, false, 'Familia Rodríguez'),
('a0000000-0000-0000-0000-000000000105', 'Av. De los Robles', '201', 'A', 'Mza 2', 'Lote 01', 140.00, 170.00, false, 'Depto A - Inquilino'),
('a0000000-0000-0000-0000-000000000106', 'Av. De los Robles', '202', NULL, 'Mza 2', 'Lote 02', 200.00, 260.00, false, 'Casa esquina'),
('a0000000-0000-0000-0000-000000000107', 'Av. De los Robles', '203', NULL, 'Mza 2', 'Lote 03', 150.00, 180.00, false, 'Familia Treviño')
ON CONFLICT (id) DO UPDATE SET street = EXCLUDED.street;

-- 4.2 Residents
INSERT INTO tenant_valle_real.residents (id, property_id, first_name, last_name, email, phone, role, is_primary, password_hash, is_active) VALUES
('b0000000-0000-0000-0000-000000000142', 'a0000000-0000-0000-0000-000000000142', 'Carlos', 'Villarreal', 'carlos.villarreal@dommia.com.mx', '+52 81 2345 6789', 'OWNER', true, crypt('Dommia2026!', gen_salt('bf', 8)), true),
('b0000000-0000-0000-0000-000000000143', 'a0000000-0000-0000-0000-000000000142', 'Sofía', 'Villarreal', 'sofia.villarreal@dommia.com.mx', '+52 81 2345 6780', 'FAMILY_MEMBER', false, crypt('Dommia2026!', gen_salt('bf', 8)), true),
('b0000000-0000-0000-0000-000000000101', 'a0000000-0000-0000-0000-000000000101', 'Martín', 'González', 'martin.gonzalez@correo.com', '+52 81 8000 1111', 'OWNER', true, crypt('Dommia2026!', gen_salt('bf', 8)), true),
('b0000000-0000-0000-0000-000000000102', 'a0000000-0000-0000-0000-000000000102', 'Lucía', 'Garza', 'lucia.garza@correo.com', '+52 81 8000 2222', 'OWNER', true, crypt('Dommia2026!', gen_salt('bf', 8)), true),
('b0000000-0000-0000-0000-000000000103', 'a0000000-0000-0000-0000-000000000103', 'Javier', 'Hernández', 'javier.hernandez@correo.com', '+52 81 8000 3333', 'TENANT', true, crypt('Dommia2026!', gen_salt('bf', 8)), true),
('b0000000-0000-0000-0000-000000000104', 'a0000000-0000-0000-0000-000000000104', 'Diana', 'Rodríguez', 'diana.rodriguez@correo.com', '+52 81 8000 4444', 'OWNER', true, crypt('Dommia2026!', gen_salt('bf', 8)), true)
ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name;

-- 4.3 Vehicles
INSERT INTO tenant_valle_real.vehicles (id, property_id, resident_id, plates, brand, model, color) VALUES
('c0000000-0000-0000-0000-000000000142', 'a0000000-0000-0000-0000-000000000142', 'b0000000-0000-0000-0000-000000000142', 'NL-VR-142', 'Audi', 'A4 2024', 'Gris Oxford'),
('c0000000-0000-0000-0000-000000000143', 'a0000000-0000-0000-0000-000000000142', 'b0000000-0000-0000-0000-000000000143', 'NL-VR-143', 'BMW', 'X3 2023', 'Blanco'),
('c0000000-0000-0000-0000-000000000101', 'a0000000-0000-0000-0000-000000000101', 'b0000000-0000-0000-0000-000000000101', 'NL-VR-101', 'Mazda', 'CX-5', 'Rojo Cereza'),
('c0000000-0000-0000-0000-000000000102', 'a0000000-0000-0000-0000-000000000102', 'b0000000-0000-0000-0000-000000000102', 'NL-VR-102', 'Toyota', 'RAV4', 'Plata'),
('c0000000-0000-0000-0000-000000000103', 'a0000000-0000-0000-0000-000000000103', 'b0000000-0000-0000-0000-000000000103', 'NL-VR-103', 'Volkswagen', 'Jetta', 'Negro')
ON CONFLICT (id) DO NOTHING;

-- 4.4 RFID Tags (Tags UHF Caseta)
INSERT INTO tenant_valle_real.rfid_tags (property_id, vehicle_id, tag_code, description, is_active) VALUES
('a0000000-0000-0000-0000-000000000142', 'c0000000-0000-0000-0000-000000000142', 'TAG-VR-142', 'Tag Parabrisas Audi A4 (Carlos V.)', true),
('a0000000-0000-0000-0000-000000000142', 'c0000000-0000-0000-0000-000000000143', 'TAG-VR-143', 'Tag Parabrisas BMW X3 (Sofía V.)', true),
('a0000000-0000-0000-0000-000000000101', 'c0000000-0000-0000-0000-000000000101', 'TAG-VR-101', 'Tag Parabrisas Mazda CX-5', true),
('a0000000-0000-0000-0000-000000000102', 'c0000000-0000-0000-0000-000000000102', 'TAG-VR-102', 'Tag Parabrisas Toyota RAV4', true)
ON CONFLICT (tag_code) DO NOTHING;

-- 4.5 Invitations (Dynamic TOTP Seeds para Dommia Resident PWA)
INSERT INTO tenant_valle_real.invitations (property_id, resident_id, visitor_name, visitor_phone, invitation_type, valid_from, valid_until, totp_secret, is_active) VALUES
('a0000000-0000-0000-0000-000000000142', 'b0000000-0000-0000-0000-000000000142', 'Arq. Miguel Ángel Morales', '+52 81 9999 8888', 'SINGLE', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '23 hours', 'DOMMIA_SEC_VR_142_SECRET_KEY_2026', true),
('a0000000-0000-0000-0000-000000000142', 'b0000000-0000-0000-0000-000000000142', 'Servicio Técnico Totalplay', '+52 81 8888 7777', 'SERVICE', NOW(), NOW() + INTERVAL '4 hours', encode(gen_random_bytes(20), 'hex'), true),
('a0000000-0000-0000-0000-000000000101', 'b0000000-0000-0000-0000-000000000101', 'Dra. Claudia Ramos', '+52 81 5555 4444', 'SINGLE', NOW(), NOW() + INTERVAL '12 hours', encode(gen_random_bytes(20), 'hex'), true);

-- 4.6 Access Logs (Accesos Concedidos y Denegados)
INSERT INTO tenant_valle_real.access_logs (access_type, identifier, property_id, is_granted, rejection_reason, gateway_uuid, timestamp) VALUES
('RFID', 'TAG-VR-142', 'a0000000-0000-0000-0000-000000000142', true, NULL, 'gw-caseta-principal-vallereal-01', NOW() - INTERVAL '25 minutes'),
('DYNAMIC_QR', 'DOMMIA_SEC_VR_142_SECRET_KEY_2026', 'a0000000-0000-0000-0000-000000000142', true, NULL, 'gw-caseta-principal-vallereal-01', NOW() - INTERVAL '2 hours'),
('RFID', 'TAG-VR-999_DESCONOCIDO', NULL, false, 'Tag RFID no registrado en el padrón', 'gw-caseta-principal-vallereal-01', NOW() - INTERVAL '4 hours'),
('DYNAMIC_QR', 'QR_EXPIRADO_DEMO', 'a0000000-0000-0000-0000-000000000103', false, 'Propiedad morosa / Código QR revocado', 'gw-caseta-principal-vallereal-01', NOW() - INTERVAL '6 hours');

-- 4.7 Fee Configurations
INSERT INTO tenant_valle_real.fee_configurations (name, fee_type, base_amount, currency, due_day_of_month, late_fee_type, late_fee_value, grace_days, early_bird_discount_type, early_bird_discount_value, early_bird_limit_day, is_active) VALUES
('Cuota Mensual Mantenimiento Valle Real', 'FIXED_RECURRENT', 1400.00, 'MXN', 10, 'PERCENTAGE', 10.00, 5, 'FIXED', 100.00, 5, true),
('Cuota Indiviso Áreas Verdes (m²)', 'VARIABLE_LOT_SIZE', 7.50, 'MXN', 10, 'PERCENTAGE', 5.00, 3, 'NONE', 0.00, 0, true);

-- 4.8 Notices
INSERT INTO tenant_valle_real.notices (title, content, category, priority, author_name, is_pinned, is_published, published_at) VALUES
('Mantenimiento Preventivo a Plumas de Acceso', 'Estimados vecinos, este sábado de 9:00 a 13:00 se realizarán ajustes en los lectores RFID y motor de pluma principal. El acceso será manual con apoyo de guardia.', 'MAINTENANCE', 'MEDIUM', 'Administración Valle Real', true, true, NOW() - INTERVAL '1 day'),
('Asamblea Anual de Colonos - Convocatoria Oficial', 'Se cita a todos los propietarios a la 1ª Convocatoria para votación de mejoras en áreas verdes y luminarias solares.', 'ASSEMBLY', 'HIGH', 'Comité de Vigilancia', true, true, NOW() - INTERVAL '3 days'),
('Protocolo de Seguridad para Invitaciones Digitales QR', 'Recuerden compartir códigos QR directamente desde la App Dommia Resident. No compartan capturas de pantalla viejas.', 'GENERAL', 'LOW', 'Seguridad Caseta', false, true, NOW() - INTERVAL '5 days');


-- ==============================================================================
-- 5. AMBIENTAR DATOS COMPLETOS PARA TENANT: CUMBRES (Fracc. Cumbres del Valle)
-- ==============================================================================
INSERT INTO tenant_cumbres.properties (street, exterior_number, block, lot, lot_size_m2, building_size_m2, is_delinquent) VALUES
('Paseo de las Cumbres', '101', 'Sector 1', 'Lote 01', 140.00, 165.00, false),
('Paseo de las Cumbres', '102', 'Sector 1', 'Lote 02', 140.00, 165.00, false),
('Paseo de las Cumbres', '103', 'Sector 1', 'Lote 03', 145.00, 170.00, true),
('Paseo de las Cumbres', '104', 'Sector 1', 'Lote 04', 150.00, 180.00, false),
('Cumbres del Valle', '201', 'Sector 2', 'Lote 01', 135.00, 155.00, false);

DO $$
DECLARE
    v_prop_id UUID;
    v_res_id UUID;
BEGIN
    SELECT id INTO v_prop_id FROM tenant_cumbres.properties WHERE exterior_number = '101' LIMIT 1;
    IF v_prop_id IS NOT NULL THEN
        INSERT INTO tenant_cumbres.residents (property_id, first_name, last_name, email, phone, role, is_primary, password_hash)
        VALUES (v_prop_id, 'Ing. Salvador', 'Garza', 'salvador.garza@cumbres.com', '+52 81 7777 1111', 'OWNER', true, crypt('Dommia2026!', gen_salt('bf', 8)))
        RETURNING id INTO v_res_id;

        INSERT INTO tenant_cumbres.vehicles (property_id, resident_id, plates, brand, model, color)
        VALUES (v_prop_id, v_res_id, 'NL-CV-101', 'Nissan', 'Sentra', 'Blanco');

        INSERT INTO tenant_cumbres.rfid_tags (property_id, tag_code, description)
        VALUES (v_prop_id, 'TAG-CV-101', 'Tag Parabrisas Nissan Sentra');
    END IF;
END $$;

INSERT INTO tenant_cumbres.fee_configurations (name, fee_type, base_amount, currency, due_day_of_month, late_fee_type, late_fee_value, grace_days)
VALUES ('Cuota Mantenimiento y Vigilancia Cumbres', 'FIXED_RECURRENT', 950.00, 'MXN', 10, 'FIXED', 100.00, 5);

INSERT INTO tenant_cumbres.notices (title, content, category, priority, author_name)
VALUES ('Revisión de luminarias en circuito Cumbres', 'Se completó la sustitución de 12 lámparas LED en el circuito principal.', 'MAINTENANCE', 'LOW', 'Mesa Directiva');


-- ==============================================================================
-- 6. AMBIENTAR DATOS COMPLETOS PARA TENANT: BOSQUES (Privada Bosques del Reino)
-- ==============================================================================
INSERT INTO tenant_bosques.properties (street, exterior_number, block, lot, lot_size_m2, building_size_m2, is_delinquent) VALUES
('Bosque Real', '501', 'Fase 1', 'Lote A-01', 350.00, 420.00, false),
('Bosque Real', '502', 'Fase 1', 'Lote A-02', 320.00, 390.00, false),
('Bosque Real', '503', 'Fase 1', 'Lote A-03', 380.00, 460.00, false),
('Paseo del Roble', '601', 'Fase 2', 'Lote B-01', 400.00, 500.00, false),
('Paseo del Roble', '602', 'Fase 2', 'Lote B-02', 350.00, 410.00, true);

DO $$
DECLARE
    v_prop_id UUID;
    v_res_id UUID;
BEGIN
    SELECT id INTO v_prop_id FROM tenant_bosques.properties WHERE exterior_number = '501' LIMIT 1;
    IF v_prop_id IS NOT NULL THEN
        INSERT INTO tenant_bosques.residents (property_id, first_name, last_name, email, phone, role, is_primary, password_hash)
        VALUES (v_prop_id, 'Arq. Fernando', 'Villarreal', 'fernando.villarreal@bosques.com', '+52 81 8888 2222', 'OWNER', true, crypt('Dommia2026!', gen_salt('bf', 8)))
        RETURNING id INTO v_res_id;

        INSERT INTO tenant_bosques.vehicles (property_id, resident_id, plates, brand, model, color)
        VALUES (v_prop_id, v_res_id, 'NL-BR-501', 'Porsche', 'Cayenne', 'Negro Obsidiana');

        INSERT INTO tenant_bosques.rfid_tags (property_id, tag_code, description)
        VALUES (v_prop_id, 'TAG-BR-501', 'Tag UHF Parabrisas Porsche Cayenne');
    END IF;
END $$;

INSERT INTO tenant_bosques.fee_configurations (name, fee_type, base_amount, currency, due_day_of_month, late_fee_type, late_fee_value, grace_days, early_bird_discount_type, early_bird_discount_value, early_bird_limit_day)
VALUES ('Cuota Residencial Campestre Bosques', 'FIXED_RECURRENT', 3200.00, 'MXN', 5, 'PERCENTAGE', 10.00, 5, 'FIXED', 300.00, 5);

INSERT INTO tenant_bosques.notices (title, content, category, priority, author_name)
VALUES ('Acceso Exclusivo de Carga Pesada por Caseta Poniente', 'A partir del lunes, camiones de construcción y mudanzas deberán ingresar exclusivamente por la Caseta Poniente.', 'URGENT', 'HIGH', 'Dirección General');


-- ==============================================================================
-- 7. USUARIOS Y VÍNCULOS MULTI-TENANT (Para Communities Admin)
-- ==============================================================================

-- Create dedicated admins for each community
INSERT INTO public.users (email, password_hash, first_name, last_name, role, is_active)
VALUES
('admin@vallereal.dommia.com.mx', crypt('Dommia2026!', gen_salt('bf', 8)), 'Ing. Ricardo', 'Sánchez', 'TENANT_ADMIN', true),
('admin@cumbres.dommia.com.mx', crypt('Dommia2026!', gen_salt('bf', 8)), 'Lic. Marcela', 'Peña', 'TENANT_ADMIN', true),
('admin@bosques.dommia.com.mx', crypt('Dommia2026!', gen_salt('bf', 8)), 'Lic. Eugenio', 'Elizondo', 'TENANT_ADMIN', true),
('admin@valleoriente.dommia.com.mx', crypt('Dommia2026!', gen_salt('bf', 8)), 'C.P. Mónica', 'Treviño', 'TENANT_ADMIN', true)
ON CONFLICT (email) DO UPDATE SET is_active = true;

-- Ensure Roberto Garza (admin@laspalmas.dommia.com.mx) has multi-tenant permissions across ALL 5 communities!
-- This allows testing switching between workspaces in Communities Admin immediately.
DELETE FROM public.user_tenants WHERE user_id = (SELECT id FROM public.users WHERE email = 'admin@laspalmas.dommia.com.mx');

INSERT INTO public.user_tenants (user_id, tenant_id, role)
SELECT u.id, t.id, 'TENANT_ADMIN'
FROM public.users u
CROSS JOIN public.tenants t
WHERE u.email = 'admin@laspalmas.dommia.com.mx';

-- Link each specific admin to their own community
INSERT INTO public.user_tenants (user_id, tenant_id, role)
SELECT u.id, t.id, 'TENANT_ADMIN'
FROM public.users u
JOIN public.tenants t ON t.slug = 'valle_real'
WHERE u.email = 'admin@vallereal.dommia.com.mx'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_tenants (user_id, tenant_id, role)
SELECT u.id, t.id, 'TENANT_ADMIN'
FROM public.users u
JOIN public.tenants t ON t.slug = 'cumbres'
WHERE u.email = 'admin@cumbres.dommia.com.mx'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_tenants (user_id, tenant_id, role)
SELECT u.id, t.id, 'TENANT_ADMIN'
FROM public.users u
JOIN public.tenants t ON t.slug = 'bosques'
WHERE u.email = 'admin@bosques.dommia.com.mx'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_tenants (user_id, tenant_id, role)
SELECT u.id, t.id, 'TENANT_ADMIN'
FROM public.users u
JOIN public.tenants t ON t.slug = 'valle_oriente'
WHERE u.email = 'admin@valleoriente.dommia.com.mx'
ON CONFLICT DO NOTHING;
