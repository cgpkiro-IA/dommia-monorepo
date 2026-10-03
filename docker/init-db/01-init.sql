-- ==============================================================================
-- DOMMIA MASTER DATABASE INITIALIZATION SCRIPT
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. GLOBAL SCHEMA (public) - SaaS Core & Backoffice
-- ==============================================================================

-- Tenants (Fraccionamientos registrados)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(128) UNIQUE NOT NULL,
    tier VARCHAR(64) NOT NULL DEFAULT 'STANDARD', -- BASIC, STANDARD, PROFESSIONAL, ENTERPRISE
    max_properties INT NOT NULL DEFAULT 100,      -- Límite duro de casas contratadas
    is_active BOOLEAN NOT NULL DEFAULT true,
    modules JSONB NOT NULL DEFAULT '{
        "finance": true,
        "rfid": true,
        "dynamic_qr": true,
        "whatsapp": false,
        "stripe_auto": false
    }'::jsonb,
    contact_name VARCHAR(150),
    contact_email VARCHAR(150),
    contact_phone VARCHAR(50),
    has_custom_domain BOOLEAN DEFAULT false,
    custom_domain VARCHAR(150),
    access_url VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON public.tenants(subdomain);

-- Users (Usuarios administrativos y operadores del SaaS)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'TENANT_ADMIN',
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL DEFAULT 'TENANT_ADMIN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.resident_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jti UUID UNIQUE NOT NULL,
    resident_id UUID NOT NULL,
    tenant_slug VARCHAR(150) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stripe_connected_accounts (
    tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
    account_id VARCHAR(255) UNIQUE NOT NULL,
    details_submitted BOOLEAN NOT NULL DEFAULT false,
    charges_enabled BOOLEAN NOT NULL DEFAULT false,
    payouts_enabled BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stripe_events (
    event_id VARCHAR(255) PRIMARY KEY,
    event_type VARCHAR(128) NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CRM Prospects (Pipeline comercial del operador)
CREATE TABLE IF NOT EXISTS public.crm_prospects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    community_name VARCHAR(255) NOT NULL,
    estimated_houses INT DEFAULT 50,
    stage VARCHAR(64) NOT NULL DEFAULT 'LEAD', -- LEAD, CONTACTED, DEMO_SCHEDULED, QUOTED, WON, LOST
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SaaS Plans (Catálogo oficial de niveles de suscripción de la plataforma)
CREATE TABLE IF NOT EXISTS public.saas_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    monthly_price NUMERIC(10,2) NOT NULL,
    min_properties INT NOT NULL DEFAULT 1,
    max_properties INT NOT NULL DEFAULT 50,
    price_per_extra_property NUMERIC(10,2) NOT NULL DEFAULT 20.00,
    includes_custom_domain BOOLEAN NOT NULL DEFAULT false,
    custom_domain_addon_price NUMERIC(10,2) NOT NULL DEFAULT 490.00,
    standard_domain_pattern VARCHAR(120) NOT NULL DEFAULT 'standar.dommia.com.mx/{slug}',
    included_modules JSONB NOT NULL DEFAULT '[]'::jsonb,
    available_addons JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_highlighted BOOLEAN NOT NULL DEFAULT false,
    sort_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT saas_plans_min_max_check CHECK (min_properties >= 1 AND min_properties <= max_properties)
);

-- Subscriptions (Stripe Customer y Tiers)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(128),
    stripe_subscription_id VARCHAR(128),
    plan_tier VARCHAR(64),
    amount NUMERIC(12,2),
    billing_interval VARCHAR(16) DEFAULT 'MONTHLY',
    has_custom_domain BOOLEAN,
    active_addons JSONB,
    renewal_amount NUMERIC(12,2),
    renewal_notice_sent_at TIMESTAMPTZ,
    renewal_notice_to VARCHAR(255),
    contract_review_required BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(64) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, PAST_DUE, CANCELED, TRIALING
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT subscriptions_billing_interval_check CHECK (billing_interval IN ('MONTHLY', 'ANNUAL'))
);

-- Gateway Inventory (Monitoreo y telemetría de hardware de caseta)
CREATE TABLE IF NOT EXISTS public.gateway_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid VARCHAR(64) UNIQUE NOT NULL,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    certificate_fingerprint VARCHAR(255),
    status VARCHAR(32) NOT NULL DEFAULT 'OFFLINE', -- ONLINE, OFFLINE, MAINTENANCE, ALERT
    last_heartbeat TIMESTAMPTZ,
    firmware_version VARCHAR(32) DEFAULT '1.0.0',
    ip_local VARCHAR(45),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gateway_uuid ON public.gateway_inventory(uuid);

-- Global Audit Logs (Trazabilidad completa con Diff de cambios)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    user_id UUID,
    user_email VARCHAR(150),
    action VARCHAR(64) NOT NULL,        -- CREATE, UPDATE, DELETE, LOGIN, ACCESS_OVERRIDE
    entity VARCHAR(64) NOT NULL,        -- Tenant, Property, Charge, Tag, Gateway
    entity_id VARCHAR(128),
    ip_address VARCHAR(45),
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.audit_logs(created_at);

-- ==============================================================================
-- 3. AUTOMATED TENANT PROVISIONING FUNCTION
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.provision_tenant_schema(
    p_slug TEXT,
    p_name TEXT,
    p_tier TEXT DEFAULT 'STANDARD',
    p_max_properties INT DEFAULT 100,
    p_contact_email TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_tenant_id UUID;
    v_schema_name TEXT := 'tenant_' || lower(regexp_replace(p_slug, '[^a-zA-Z0-9_]', '_', 'g'));
BEGIN
    -- 1. Insert into public.tenants
    INSERT INTO public.tenants (
        slug, name, subdomain, tier, max_properties, contact_email
    ) VALUES (
        lower(p_slug), p_name, lower(p_slug) || '.dommia.com.mx', p_tier, p_max_properties, p_contact_email
    ) RETURNING id INTO v_tenant_id;

    -- 2. Create dedicated schema
    EXECUTE 'CREATE SCHEMA IF NOT EXISTS ' || quote_ident(v_schema_name);

    -- 3. Properties table in tenant schema
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

    -- 4. Residents table
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || quote_ident(v_schema_name) || '.residents (' ||
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ' ||
        'property_id UUID NOT NULL REFERENCES ' || quote_ident(v_schema_name) || '.properties(id) ON DELETE CASCADE, ' ||
        'first_name VARCHAR(100) NOT NULL, ' ||
        'last_name VARCHAR(100) NOT NULL, ' ||
        'email VARCHAR(150) UNIQUE, ' ||
        'phone VARCHAR(50), ' ||
        'role VARCHAR(32) NOT NULL DEFAULT ''OWNER'', ' || -- OWNER, TENANT, FAMILY_MEMBER
        'access_totp_secret VARCHAR(64) NOT NULL DEFAULT encode(gen_random_bytes(20), ''hex''), ' ||
        'last_access_used_step BIGINT, ' ||
        'is_primary BOOLEAN NOT NULL DEFAULT true, ' ||
        'password_hash VARCHAR(255), ' ||
        'must_change_password BOOLEAN NOT NULL DEFAULT true, ' ||
        'is_active BOOLEAN NOT NULL DEFAULT true, ' ||
        'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), ' ||
        'updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()' ||
    ')';

    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || quote_ident(v_schema_name) || '.resident_invitations (' ||
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ' ||
        'resident_id UUID NOT NULL REFERENCES ' || quote_ident(v_schema_name) || '.residents(id) ON DELETE CASCADE, ' ||
        'token_hash VARCHAR(128) UNIQUE NOT NULL, ' ||
        'expires_at TIMESTAMPTZ NOT NULL, ' ||
        'used_at TIMESTAMPTZ, revoked_at TIMESTAMPTZ, created_by UUID, ' ||
        'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()' ||
    ')';

    -- 5. Vehicles table
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

    -- 6. RFID Tags table (Wiegand UHF / Proximity)
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || quote_ident(v_schema_name) || '.rfid_tags (' ||
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ' ||
        'property_id UUID NOT NULL REFERENCES ' || quote_ident(v_schema_name) || '.properties(id) ON DELETE CASCADE, ' ||
        'vehicle_id UUID REFERENCES ' || quote_ident(v_schema_name) || '.vehicles(id) ON DELETE SET NULL, ' ||
        'tag_code VARCHAR(64) UNIQUE NOT NULL, ' ||
        'description VARCHAR(100), ' ||
        'is_active BOOLEAN NOT NULL DEFAULT true, ' ||
        'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()' ||
    ')';

    -- 7. Invitations table (Dynamic QR TOTP seeds)
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || quote_ident(v_schema_name) || '.invitations (' ||
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ' ||
        'property_id UUID NOT NULL REFERENCES ' || quote_ident(v_schema_name) || '.properties(id) ON DELETE CASCADE, ' ||
        'resident_id UUID NOT NULL REFERENCES ' || quote_ident(v_schema_name) || '.residents(id) ON DELETE CASCADE, ' ||
        'visitor_name VARCHAR(150) NOT NULL, ' ||
        'visitor_phone VARCHAR(50), ' ||
        'invitation_type VARCHAR(32) NOT NULL DEFAULT ''SINGLE'', ' || -- SINGLE, RECURRENT, SERVICE
        'valid_from TIMESTAMPTZ NOT NULL, ' ||
        'valid_until TIMESTAMPTZ NOT NULL, ' ||
        'totp_secret VARCHAR(64) NOT NULL DEFAULT encode(gen_random_bytes(20), ''hex''), ' ||
        'notes TEXT, ' ||
        'last_used_step BIGINT, ' ||
        'is_active BOOLEAN NOT NULL DEFAULT true, ' ||
        'used_at TIMESTAMPTZ, ' ||
        'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()' ||
    ')';

    -- 8. Access Logs (Sincronizados desde caseta)
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || quote_ident(v_schema_name) || '.access_logs (' ||
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ' ||
        'access_type VARCHAR(32) NOT NULL, ' || -- RFID, DYNAMIC_QR, MANUAL_GUARD
        'identifier VARCHAR(100) NOT NULL, ' || -- Tag code o ID de invitación
        'property_id UUID REFERENCES ' || quote_ident(v_schema_name) || '.properties(id) ON DELETE SET NULL, ' ||
        'is_granted BOOLEAN NOT NULL, ' ||
        'rejection_reason VARCHAR(100), ' ||
        'manual_reason TEXT, ' ||
        'guard_user_id UUID, ' ||
        'gateway_uuid VARCHAR(64), ' ||
        'timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()' ||
    ')';

    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || quote_ident(v_schema_name) || '.guard_deliveries (' ||
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ' ||
        'recipient_name VARCHAR(150) NOT NULL, ' ||
        'property_address VARCHAR(200) NOT NULL, ' ||
        'carrier VARCHAR(100) NOT NULL, ' ||
        'tracking_code VARCHAR(100), ' ||
        'notes VARCHAR(500), ' ||
        'status VARCHAR(16) NOT NULL DEFAULT ''PENDING'' CHECK (status IN (''PENDING'', ''COLLECTED'')), ' ||
        'received_by UUID NOT NULL, ' ||
        'received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), ' ||
        'collected_by UUID, ' ||
        'collected_by_name VARCHAR(150), ' ||
        'collected_at TIMESTAMPTZ' ||
    ')';

    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || quote_ident(v_schema_name) || '.guard_incidents (' ||
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ' ||
        'incident_type VARCHAR(32) NOT NULL, ' ||
        'priority VARCHAR(16) NOT NULL CHECK (priority IN (''LOW'', ''MEDIUM'', ''HIGH'', ''URGENT'')), ' ||
        'description VARCHAR(1000) NOT NULL, ' ||
        'property_address VARCHAR(200), ' ||
        'vehicle_plates VARCHAR(15), ' ||
        'status VARCHAR(16) NOT NULL DEFAULT ''OPEN'' CHECK (status IN (''OPEN'', ''RESOLVED'')), ' ||
        'created_by UUID NOT NULL, ' ||
        'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), ' ||
        'resolved_by UUID, ' ||
        'resolved_at TIMESTAMPTZ' ||
    ')';
    EXECUTE 'CREATE INDEX IF NOT EXISTS guard_incidents_status_created_idx ON ' || quote_ident(v_schema_name) || '.guard_incidents (status, created_at DESC)';

    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || quote_ident(v_schema_name) || '.guard_vehicle_flags (' ||
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ' ||
        'plates VARCHAR(15) NOT NULL, ' ||
        'normalized_plates VARCHAR(15) UNIQUE NOT NULL, ' ||
        'flag_type VARCHAR(24) NOT NULL CHECK (flag_type IN (''BLOCKED'', ''FREQUENT_VISITOR'')), ' ||
        'reason VARCHAR(300) NOT NULL, ' ||
        'is_active BOOLEAN NOT NULL DEFAULT TRUE, ' ||
        'created_by UUID NOT NULL, ' ||
        'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), ' ||
        'removed_by UUID, ' ||
        'removed_at TIMESTAMPTZ' ||
    ')';

    -- 9. Fee Configurations (Estructura de Cuotas Ordinarias, Metraje y Extraordinarias)
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || quote_ident(v_schema_name) || '.fee_configurations (' ||
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ' ||
        'name VARCHAR(150) NOT NULL, ' ||
        'fee_type VARCHAR(32) NOT NULL DEFAULT ''FIXED_RECURRENT'', ' || -- FIXED_RECURRENT, VARIABLE_LOT_SIZE, EXTRAORDINARY
        'base_amount NUMERIC(12,2) NOT NULL, ' ||
        'frequency VARCHAR(32) NOT NULL DEFAULT ''MONTHLY'', ' || -- MONTHLY, BI_MONTHLY, ANNUAL, ONE_TIME
        'due_day INT NOT NULL DEFAULT 10, ' ||
        'grace_days INT NOT NULL DEFAULT 5, ' ||
        'late_fee_type VARCHAR(32) NOT NULL DEFAULT ''PERCENTAGE'', ' || -- NONE, PERCENTAGE, FIXED
        'late_fee_amount NUMERIC(12,2) NOT NULL DEFAULT 10.00, ' ||
        'early_bird_discount_type VARCHAR(32) NOT NULL DEFAULT ''NONE'', ' || -- NONE, PERCENTAGE, FIXED
        'early_bird_discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00, ' ||
        'early_bird_deadline_day INT DEFAULT 5, ' ||
        'applies_to_all_properties BOOLEAN NOT NULL DEFAULT true, ' ||
        'is_active BOOLEAN NOT NULL DEFAULT true, ' ||
        'description TEXT, ' ||
        'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), ' ||
        'updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()' ||
    ')';

    -- 10. Financial Charges (Cuotas de mantenimiento generadas)
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || quote_ident(v_schema_name) || '.financial_charges (' ||
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ' ||
        'property_id UUID NOT NULL REFERENCES ' || quote_ident(v_schema_name) || '.properties(id) ON DELETE CASCADE, ' ||
        'fee_config_id UUID REFERENCES ' || quote_ident(v_schema_name) || '.fee_configurations(id) ON DELETE SET NULL, ' ||
        'concept VARCHAR(200) NOT NULL, ' ||
        'amount NUMERIC(12,2) NOT NULL, ' ||
        'balance_due NUMERIC(12,2) NOT NULL, ' ||
        'due_date DATE NOT NULL, ' ||
        'period_year INT, ' ||
        'period_month INT, ' ||
        'status VARCHAR(32) NOT NULL DEFAULT ''PENDING'', ' || -- PENDING, PAID, PARTIAL, OVERDUE, CANCELLED
        'notes TEXT, ' ||
        'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), ' ||
        'updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()' ||
    ')';

    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS financial_charges_period_unique ON ' || quote_ident(v_schema_name) || '.financial_charges (property_id, fee_config_id, period_year, period_month) WHERE fee_config_id IS NOT NULL AND period_year IS NOT NULL AND period_month IS NOT NULL';

    -- 10. Financial Payments
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || quote_ident(v_schema_name) || '.financial_payments (' ||
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ' ||
        'property_id UUID NOT NULL REFERENCES ' || quote_ident(v_schema_name) || '.properties(id) ON DELETE CASCADE, ' ||
        'charge_id UUID REFERENCES ' || quote_ident(v_schema_name) || '.financial_charges(id) ON DELETE SET NULL, ' ||
        'amount NUMERIC(12,2) NOT NULL, ' ||
        'payment_method VARCHAR(32) NOT NULL DEFAULT ''CASH'', ' || -- CASH, SPEI_TRANSFER, BANK_DEPOSIT, STRIPE_CARD
        'reference VARCHAR(128), ' ||
        'receipt_url TEXT, ' ||
        'status VARCHAR(32) NOT NULL DEFAULT ''APPROVED'', ' || -- PENDING_APPROVAL, APPROVED, REJECTED
        'approved_by UUID, ' ||
        'received_by_name VARCHAR(120), ' ||
        'payer_name VARCHAR(120), ' ||
        'notes TEXT, ' ||
        'gateway_provider VARCHAR(32), ' ||
        'gateway_tx_id VARCHAR(120), ' ||
        'paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), ' ||
        'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()' ||
    ')';

    -- 11. Notices & Announcements (Circulares y Avisos para Dommia Communities y Dommia Resident)
    EXECUTE 'CREATE TABLE IF NOT EXISTS ' || quote_ident(v_schema_name) || '.notices (' ||
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ' ||
        'title VARCHAR(200) NOT NULL, ' ||
        'content TEXT NOT NULL, ' ||
        'category VARCHAR(32) NOT NULL DEFAULT ''GENERAL'', ' || -- URGENT, MAINTENANCE, ASSEMBLY, GENERAL
        'priority VARCHAR(32) NOT NULL DEFAULT ''MEDIUM'', ' ||  -- HIGH, MEDIUM, LOW
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
-- 4. SEED INITIAL DEMO DATA & SAAS PLANS
-- ==============================================================================

DO $$
BEGIN
    -- 4.1 Seed SaaS Plans
    IF NOT EXISTS (SELECT 1 FROM public.saas_plans WHERE code = 'BASIC') THEN
        INSERT INTO public.saas_plans (
            code, name, description, monthly_price, min_properties, max_properties, price_per_extra_property,
            includes_custom_domain, custom_domain_addon_price, standard_domain_pattern,
            included_modules, available_addons, is_active, is_highlighted, sort_order
        ) VALUES 
        (
            'BASIC',
            'Dommia Inicial / Básico',
            'Ideal para cotos pequeños y privadas de hasta 50 casas que buscan digitalizar accesos QR y administración vecinal.',
            1490.00,
            15,
            50,
            25.00,
            false,
            490.00,
            'standar.dommia.com.mx/{slug}',
            '["directory", "finance", "resident_pwa", "dynamic_qr", "guard_console"]'::jsonb,
            '[{"code": "CUSTOM_DOMAIN", "name": "Subdominio Propio ({slug}.dommia.com.mx)", "price": 490}, {"code": "RFID_UHF", "name": "Antenas RFID Vehiculares", "price": 750}]'::jsonb,
            true,
            false,
            1
        ),
        (
            'STANDARD',
            'Dommia Estándar',
            'Para fraccionamientos consolidados de hasta 150 viviendas con control de visitas recurrente y pasarela de cobros.',
            2990.00,
            51,
            150,
            20.00,
            false,
            490.00,
            'standar.dommia.com.mx/{slug}',
            '["directory", "finance", "resident_pwa", "dynamic_qr", "guard_console", "notices", "incidents"]'::jsonb,
            '[{"code": "CUSTOM_DOMAIN", "name": "Subdominio Propio ({slug}.dommia.com.mx)", "price": 490}, {"code": "RFID_UHF", "name": "Antenas RFID Vehiculares", "price": 850}]'::jsonb,
            true,
            true,
            2
        ),
        (
            'PROFESSIONAL',
            'Dommia Profesional',
            'Automatización vehicular total por RFID UHF (< 0.3s), pasarela fintech Stripe/SPEI y bloqueo automático de pluma a morosos.',
            4990.00,
            151,
            300,
            18.00,
            false,
            490.00,
            'standar.dommia.com.mx/{slug}',
            '["directory", "finance", "resident_pwa", "dynamic_qr", "guard_console", "rfid_uhf", "stripe_fintech", "iot_gateway", "delinquent_block"]'::jsonb,
            '[{"code": "CUSTOM_DOMAIN", "name": "Subdominio Propio ({slug}.dommia.com.mx)", "price": 490}, {"code": "EXTRA_GATEWAY", "name": "Gateway IoT Adicional", "price": 950}]'::jsonb,
            true,
            false,
            3
        ),
        (
            'ENTERPRISE',
            'Dommia Master / Enterprise',
            'Arquitectura distribuida para macro-desarrollos de 300+ viviendas, múltiples casetas en clúster, SQLite Edge local, SLA 99.9% y subdominio propio gratis.',
            8990.00,
            301,
            1000,
            15.00,
            true,
            0.00,
            '{slug}.dommia.com.mx',
            '["directory", "finance", "resident_pwa", "dynamic_qr", "guard_console", "rfid_uhf", "stripe_fintech", "multi_gateway", "sqlite_edge", "cfdi_billing", "analytics_bi", "sla_24_7"]'::jsonb,
            '[]'::jsonb,
            true,
            false,
            4
        );
    END IF;

    -- 4.2 Seed Initial Demo Tenant
    IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE slug = 'demo') THEN
        PERFORM public.provision_tenant_schema(
            'demo',
            'Fraccionamiento Residencial Las Palmas',
            'PROFESSIONAL',
            150,
            'admin@laspalmas.dommia.com.mx'
        );
    END IF;

    -- 4.3 Seed Initial Demo Gateway
    IF NOT EXISTS (SELECT 1 FROM public.gateway_inventory WHERE uuid = 'gw-caseta-norte-laspalmas-01') THEN
        INSERT INTO public.gateway_inventory (
            uuid, tenant_id, name, status, firmware_version, ip_local, last_heartbeat, notes
        )
        SELECT 
            'gw-caseta-norte-laspalmas-01',
            t.id,
            'Gateway Caseta Principal Norte',
            'ONLINE',
            '1.2.0',
            '192.168.1.50',
            NOW(),
            'Gateway Raspberry Pi CM4 conectado a antena UHF y lector QR'
        FROM public.tenants t WHERE t.slug = 'demo' LIMIT 1;
    END IF;
END $$;

