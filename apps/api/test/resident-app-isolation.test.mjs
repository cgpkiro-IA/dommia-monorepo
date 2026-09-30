import assert from 'node:assert/strict';
import { rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { after, before, test } from 'node:test';
import { closeTestPool, pool, prepareGuardQa, request } from './guard-test-helpers.mjs';

const password = 'ResidentQa2026!';
const tenantA = 'guard-qa';
const tenantB = `resident-isolation-${randomUUID().slice(0, 8)}`;
const tenantBSchema = `tenant_${tenantB.replace(/-/g, '_')}`;
const deviceIds = [randomUUID(), randomUUID(), randomUUID()];
const propertyResidentEmails = [
  `isolation.a.${randomUUID()}@qa.dommia.test`,
  `isolation.b.${randomUUID()}@qa.dommia.test`,
];
let residentB;

async function cleanupIsolationFixtures() {
  const tenants = await pool.query("SELECT slug FROM public.tenants WHERE slug LIKE 'resident_isolation_%'");
  for (const tenant of tenants.rows) {
    const schema = `tenant_${tenant.slug.replace(/-/g, '_')}`;
    await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await pool.query('DELETE FROM public.tenants WHERE slug = $1', [tenant.slug]);
  }
}

async function loginApp(identifier, tenantSlug, deviceId) {
  const response = await request('/auth/app/resident/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier,
      password,
      tenantSlug,
      clientType: 'ANDROID',
      deviceId,
      deviceName: 'Isolation QA',
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 200, body.message || 'El login móvil debe ser exitoso.');
  assert.equal(body.success, true);
  return body.data;
}

async function prepareSecondTenant() {
  await pool.query(
    'SELECT public.provision_tenant_schema($1, $2, $3, $4, $5)',
    [tenantB, 'Resident Isolation QA', 'BASIC', 5, `admin.${tenantB}@qa.dommia.test`],
  );
  await pool.query('SELECT public.ensure_tenant_feature_tables($1)', [tenantB]);
  await pool.query('SELECT public.ensure_tenant_latest_guard_tables($1)', [tenantB]);
  await pool.query('SELECT public.ensure_guard_consigns_and_panic($1)', [tenantB]);
  const storedTenant = await pool.query(
    'SELECT slug FROM public.tenants WHERE LOWER(slug) IN ($1, $2) LIMIT 1',
    [tenantB, tenantB.replace(/-/g, '_')],
  );
  assert.equal(storedTenant.rowCount, 1);
  await pool.query(
    `UPDATE public.tenants SET modules = '{"ACCESS_QR": true, "dynamic_qr": true}'::jsonb WHERE slug = $1`,
    [storedTenant.rows[0].slug],
  );

  const property = await pool.query(
    `INSERT INTO ${tenantBSchema}.properties (street, exterior_number, block, lot)
     VALUES ('Calle Aislamiento', '1', 'QA', '01')
     RETURNING id`,
  );
  const resident = await pool.query(
    `INSERT INTO ${tenantBSchema}.residents
      (property_id, first_name, last_name, email, phone, role, is_primary, password_hash, must_change_password, is_active)
     VALUES ($1, 'Tenant', 'B', $2, '+525500009999', 'OWNER', TRUE, crypt($3, gen_salt('bf', 10)), FALSE, TRUE)
     RETURNING id`,
    [property.rows[0].id, `resident.b@${tenantB}.test`, password],
  );
  residentB = resident.rows[0];

  await pool.query(
    `INSERT INTO ${tenantBSchema}.notices
      (title, content, target_audience, is_published)
     VALUES ('Aviso Tenant B', 'Solo debe ser visible para Tenant B.', 'RESIDENTS', TRUE)`,
  );
  await pool.query(
    `INSERT INTO tenant_guard_qa.notices
      (title, content, target_audience, is_published)
     VALUES ('Aviso Tenant A', 'Solo debe ser visible para Tenant A.', 'RESIDENTS', TRUE)`,
  );
}

async function preparePropertyResidents() {
  await pool.query(
    `INSERT INTO tenant_guard_qa.residents
      (property_id, first_name, last_name, email, phone, role, is_primary, password_hash, must_change_password, is_active)
     SELECT p.id, seed.first_name, seed.last_name, seed.email, seed.phone, 'OWNER', TRUE,
            crypt($3, gen_salt('bf', 10)), FALSE, TRUE
     FROM (VALUES
       ('101', 'Isolation', 'A', $1, '+525500008101'),
       ('102', 'Isolation', 'B', $2, '+525500008102')
     ) AS seed(exterior_number, first_name, last_name, email, phone)
     JOIN tenant_guard_qa.properties p ON p.exterior_number = seed.exterior_number`,
    [propertyResidentEmails[0], propertyResidentEmails[1], password],
  );
}

before(async () => {
  await cleanupIsolationFixtures();
  await prepareGuardQa();
  await preparePropertyResidents();
  await prepareSecondTenant();
});

after(async () => {
  await pool.query('DELETE FROM public.resident_sessions WHERE device_id = ANY($1::uuid[])', [deviceIds]);
  await pool.query('DELETE FROM tenant_guard_qa.residents WHERE email = ANY($1::text[])', [propertyResidentEmails]);
  await cleanupIsolationFixtures();
  await rm(resolve(process.cwd(), '.local', 'resident-receipts'), { recursive: true, force: true });
  await closeTestPool();
});

test('los avisos móviles quedan aislados por tenant', async () => {
  const tenantATokens = await loginApp(propertyResidentEmails[0], tenantA, deviceIds[0]);
  const tenantBTokens = await loginApp(`resident.b@${tenantB}.test`, tenantB, deviceIds[1]);

  const noticesAResponse = await request('/auth/app/resident/notices', { token: tenantATokens.accessToken });
  const noticesBResponse = await request('/auth/app/resident/notices', { token: tenantBTokens.accessToken });
  const noticesA = (await noticesAResponse.json()).data;
  const noticesB = (await noticesBResponse.json()).data;

  assert.equal(noticesAResponse.status, 200);
  assert.equal(noticesBResponse.status, 200);
  assert.equal(noticesA.some((notice) => notice.title === 'Aviso Tenant A'), true);
  assert.equal(noticesA.some((notice) => notice.title === 'Aviso Tenant B'), false);
  assert.equal(noticesB.some((notice) => notice.title === 'Aviso Tenant B'), true);
  assert.equal(noticesB.some((notice) => notice.title === 'Aviso Tenant A'), false);
});

test('las respuestas financieras móviles usan el envelope común', async () => {
  const tokens = await loginApp(propertyResidentEmails[0], tenantA, deviceIds[0]);

  const receiptResponse = await request('/auth/app/resident/finance/receipts', {
    method: 'POST',
    token: tokens.accessToken,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentBase64: Buffer.from('%PDF-1.7\nDEV receipt').toString('base64'),
      contentType: 'application/pdf',
    }),
  });
  const receiptBody = await receiptResponse.json();
  assert.equal(receiptResponse.status, 201);
  assert.equal(receiptBody.success, true);
  assert.equal(receiptBody.data.storage, 'LOCAL_DEV');
  assert.match(receiptBody.data.receiptUrl, /^local:\/\/resident-receipts\//);

  const statusResponse = await request('/auth/app/resident/finance/status', { token: tokens.accessToken });
  const statusBody = await statusResponse.json();
  assert.equal(statusResponse.status, 200, statusBody.message || 'El estado financiero debe responder correctamente.');
  assert.equal(statusBody.success, true);
  assert.equal(statusBody.message, null);
  assert.ok(statusBody.data);

  const campaignsResponse = await request('/auth/app/resident/finance/campaigns', { token: tokens.accessToken });
  const campaignsBody = await campaignsResponse.json();
  assert.equal(campaignsResponse.status, 200, campaignsBody.message || 'Las campañas deben responder correctamente.');
  assert.equal(campaignsBody.success, true);
  assert.equal(campaignsBody.message, null);
  assert.ok(Array.isArray(campaignsBody.data));
});

test('los pases móviles quedan aislados por residente y propiedad', async () => {
  const ownerTokens = await loginApp(propertyResidentEmails[0], tenantA, deviceIds[2]);
  const otherPropertyTokens = await loginApp(propertyResidentEmails[1], tenantA, deviceIds[1]);

  const createResponse = await request('/auth/app/resident/invitations', {
    method: 'POST',
    token: ownerTokens.accessToken,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      visitorName: 'Visitante A',
      passType: 'SINGLE_USE',
      validDays: 2,
      notes: 'Pase exclusivo de la propiedad A',
    }),
  });
  const created = (await createResponse.json()).data;
  assert.equal(createResponse.status, 201);
  assert.ok(created.id);

  const ownerList = await request('/auth/app/resident/invitations', { token: ownerTokens.accessToken });
  const otherPropertyList = await request('/auth/app/resident/invitations', { token: otherPropertyTokens.accessToken });

  const ownerListBody = await ownerList.json();
  const otherPropertyListBody = await otherPropertyList.json();
  assert.equal(ownerList.status, 200, ownerListBody.message || 'El propietario debe listar sus pases.');
  assert.equal(otherPropertyList.status, 200, otherPropertyListBody.message || 'La otra propiedad debe poder consultar su lista vacía.');
  assert.equal(ownerListBody.data.some((pass) => pass.id === created.id), true);
  assert.equal(otherPropertyListBody.data.some((pass) => pass.id === created.id), false);

  const crossPropertyRevoke = await request(`/auth/app/resident/invitations/${created.id}`, {
    method: 'DELETE',
    token: otherPropertyTokens.accessToken,
  });

  assert.equal(crossPropertyRevoke.status, 404);

  const ownerRevoke = await request(`/auth/app/resident/invitations/${created.id}`, {
    method: 'DELETE',
    token: ownerTokens.accessToken,
  });
  assert.equal(ownerRevoke.status, 200);
});
