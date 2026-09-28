-- Script de creación de fee_configurations y campos de metraje para Fase 3 (Dommia Finance)

-- 1. Agregar columnas de metraje a properties si no existen
ALTER TABLE tenant_demo.properties ADD COLUMN IF NOT EXISTS lot_size_m2 NUMERIC(10,2) DEFAULT 150.00;
ALTER TABLE tenant_demo.properties ADD COLUMN IF NOT EXISTS building_size_m2 NUMERIC(10,2) DEFAULT 180.00;

-- 2. Crear tabla fee_configurations en tenant_demo
CREATE TABLE IF NOT EXISTS tenant_demo.fee_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    fee_type VARCHAR(32) NOT NULL DEFAULT 'FIXED_RECURRENT', -- FIXED_RECURRENT, VARIABLE_LOT_SIZE, EXTRAORDINARY
    base_amount NUMERIC(12,2) NOT NULL,
    frequency VARCHAR(32) NOT NULL DEFAULT 'MONTHLY', -- MONTHLY, BI_MONTHLY, ANNUAL, ONE_TIME
    due_day INT NOT NULL DEFAULT 10,
    grace_days INT NOT NULL DEFAULT 5,
    late_fee_type VARCHAR(32) NOT NULL DEFAULT 'PERCENTAGE', -- NONE, PERCENTAGE, FIXED
    late_fee_amount NUMERIC(12,2) NOT NULL DEFAULT 10.00,
    early_bird_discount_type VARCHAR(32) NOT NULL DEFAULT 'FIXED', -- NONE, PERCENTAGE, FIXED
    early_bird_discount_amount NUMERIC(12,2) NOT NULL DEFAULT 100.00,
    early_bird_deadline_day INT DEFAULT 5,
    applies_to_all_properties BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Agregar referencia opcional en financial_charges
ALTER TABLE tenant_demo.financial_charges ADD COLUMN IF NOT EXISTS fee_config_id UUID REFERENCES tenant_demo.fee_configurations(id) ON DELETE SET NULL;

-- 4. Sembrar estructuras oficiales de cuotas para el Fraccionamiento Residencial Las Palmas
INSERT INTO tenant_demo.fee_configurations (
    name, fee_type, base_amount, frequency, due_day, grace_days,
    late_fee_type, late_fee_amount, early_bird_discount_type, early_bird_discount_amount, early_bird_deadline_day,
    applies_to_all_properties, is_active, description
) VALUES 
(
    'Cuota de Mantenimiento Ordinario Mensual',
    'FIXED_RECURRENT',
    1250.00,
    'MONTHLY',
    10,
    5,
    'PERCENTAGE',
    10.00,
    'FIXED',
    100.00,
    5,
    true,
    true,
    'Cubre vigilancia 24/7 en Caseta Principal, jardinería de áreas comunes, alumbrado y recolección de basura.'
),
(
    'Cuota Indiviso por Metraje de Lote (m²)',
    'VARIABLE_LOT_SIZE',
    6.50,
    'MONTHLY',
    10,
    5,
    'PERCENTAGE',
    5.00,
    'NONE',
    0.00,
    NULL,
    true,
    true,
    'Cálculo proporcional al metraje total del lote para mantenimiento de vialidades e infraestructura hidráulica.'
),
(
    'Fondo Extraordinario Modernización Plumas RFID',
    'EXTRAORDINARY',
    600.00,
    'ONE_TIME',
    28,
    0,
    'FIXED',
    50.00,
    'NONE',
    0.00,
    NULL,
    true,
    true,
    'Cuota especial aprobada en asamblea general para reemplazo de motores de plumas y antenas UHF de largo alcance.'
)
ON CONFLICT DO NOTHING;
