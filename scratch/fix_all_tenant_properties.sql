DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%' LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.schema_name) || '.properties ADD COLUMN IF NOT EXISTS lot_size_m2 NUMERIC(10,2) DEFAULT 150.00;';
        EXECUTE 'ALTER TABLE ' || quote_ident(r.schema_name) || '.properties ADD COLUMN IF NOT EXISTS building_size_m2 NUMERIC(10,2) DEFAULT 180.00;';
    END LOOP;
END $$;

INSERT INTO tenant_valle_oriente.properties (street, exterior_number, block, lot, lot_size_m2, building_size_m2, is_delinquent) VALUES
('Av. Valle Oriente', '102', 'Mza 1', 'Lote 02', 170.00, 210.00, false),
('Av. Valle Oriente', '103', 'Mza 1', 'Lote 03', 180.00, 220.00, false),
('Paseo de la Sierra', '201', 'Mza 2', 'Lote 01', 190.00, 240.00, true),
('Paseo de la Sierra', '202', 'Mza 2', 'Lote 02', 175.00, 215.00, false);

DO $$
DECLARE
    v_prop_id UUID;
    v_res_id UUID;
BEGIN
    SELECT id INTO v_prop_id FROM tenant_valle_oriente.properties WHERE exterior_number = '102' LIMIT 1;
    IF v_prop_id IS NOT NULL THEN
        INSERT INTO tenant_valle_oriente.residents (property_id, first_name, last_name, email, phone, role, is_primary, password_hash)
        VALUES (v_prop_id, 'Lic. Mónica', 'Treviño', 'monica.trevino@valleoriente.com', '+52 81 8300 5555', 'OWNER', true, crypt('Dommia2026!', gen_salt('bf', 8)))
        RETURNING id INTO v_res_id;

        INSERT INTO tenant_valle_oriente.vehicles (property_id, resident_id, plates, brand, model, color)
        VALUES (v_prop_id, v_res_id, 'NL-VO-102', 'Mercedes-Benz', 'GLC 300', 'Gris Selenita');

        INSERT INTO tenant_valle_oriente.rfid_tags (property_id, tag_code, description)
        VALUES (v_prop_id, 'TAG-VO-102', 'Tag Parabrisas Mercedes GLC 300');
    END IF;
END $$;

INSERT INTO tenant_valle_oriente.fee_configurations (name, fee_type, base_amount, currency, due_day_of_month, late_fee_type, late_fee_value, grace_days)
VALUES ('Cuota Mantenimiento Valle Oriente', 'FIXED_RECURRENT', 1650.00, 'MXN', 10, 'PERCENTAGE', 10.00, 5)
ON CONFLICT DO NOTHING;

INSERT INTO tenant_valle_oriente.notices (title, content, category, priority, author_name)
VALUES ('Campaña de Actualización de Datos y Tags RFID', 'Favor de pasar a administración a validar los tags de sus vehículos nuevos.', 'GENERAL', 'MEDIUM', 'Administración Valle Oriente')
ON CONFLICT DO NOTHING;
