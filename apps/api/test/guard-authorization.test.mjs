import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { closeTestPool, pool, prepareGuardQa, request, responseData, signTenantToken, tenantUserId, uniqueId } from './guard-test-helpers.mjs';

let guardToken;
let secondGuardToken;
let adminToken;

before(async () => {
  await prepareGuardQa();
  guardToken = await signTenantToken('guard.norte@qa.dommia.test', 'GUARD');
  secondGuardToken = await signTenantToken('guard.sur@qa.dommia.test', 'GUARD');
  adminToken = await signTenantToken('admin.guard-qa@dommia.test', 'TENANT_ADMIN');
});

after(closeTestPool);

test('protege incidencias administrativas y mantiene aislamiento tenant', async () => {
  const anonymous = await request('/tenants/guard-qa/guard/history');
  assert.equal(anonymous.status, 401);

  for (const path of [
    '/tenants/guard-qa/finance/fees',
    '/tenants/guard-qa/notices',
    '/tenants/guard-qa/vehicles',
  ]) {
    const response = await request(path);
    assert.equal(response.status, 401, `${path} debe exigir autenticación.`);
  }
  const unavailableGuestPass = await request('/tenants/guard-qa/access/invitations/00000000-0000-4000-8000-000000000001/pass');
  assert.equal(unavailableGuestPass.status, 404, 'El enlace compartible mantiene acceso público sin devolver pases inexistentes.');

  const publicTenantMetadata = await request('/tenants/guard-qa');
  assert.equal(publicTenantMetadata.status, 200, 'Resident puede consultar metadatos públicos del tenant.');

  const tenantAdminCrmAccess = await request('/crm/metrics', { token: adminToken });
  assert.equal(tenantAdminCrmAccess.status, 403, 'Una cuenta TENANT_ADMIN no debe entrar al CRM SaaS.');

  const tenantAdminEnumeration = await request('/tenants', { token: adminToken });
  assert.equal(tenantAdminEnumeration.status, 403, 'Un tenant admin no debe enumerar todos los tenants.');

  const guardAdminList = await request('/tenants/guard-qa/guard/incidents?status=OPEN', { token: guardToken });
  assert.equal(guardAdminList.status, 403);

  const ownLookup = await request('/tenants/guard-qa/access/lookup?query=QAA-1001', { token: guardToken });
  assert.equal(ownLookup.status, 200);
  assert.equal((await responseData(ownLookup)).vehicles[0].plates, 'QAA-1001');

  const guardConsigns = await request('/tenants/guard-qa/notices?audience=GUARDS', { token: guardToken });
  assert.equal(guardConsigns.status, 200);
  const restrictedNotices = await request('/tenants/guard-qa/notices', { token: guardToken });
  assert.equal(restrictedNotices.status, 403);

  const crossTenantLookup = await request('/tenants/demo/access/lookup?query=101', { token: guardToken });
  assert.equal(crossTenantLookup.status, 403);

  const ownAdminList = await request('/tenants/guard-qa/guard/incidents?status=OPEN', { token: adminToken });
  assert.equal(ownAdminList.status, 200);

  const crossTenantAdminList = await request('/tenants/demo/guard/incidents?status=OPEN', { token: adminToken });
  assert.equal(crossTenantAdminList.status, 403);
});

test('confirma consignas por identidad autenticada y conserva pendientes por guardia', async () => {
  let noticeId;
  try {
    const createResponse = await request('/tenants/guard-qa/notices', {
      method: 'POST',
      token: adminToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Consigna E2E de caseta',
        content: 'Confirmar lectura en cada turno.',
        category: 'GUARD_CONSIGN',
        targetAudience: 'GUARDS',
      }),
    });
    assert.equal(createResponse.status, 201);
    noticeId = (await responseData(createResponse)).id;

    const beforeResponse = await request('/tenants/guard-qa/notices?audience=GUARDS', { token: guardToken });
    const before = (await responseData(beforeResponse)).find((notice) => notice.id === noticeId);
    assert.equal(before.is_acknowledged_by_current_guard, false);

    const acknowledgeResponse = await request(`/tenants/guard-qa/notices/${noticeId}/acknowledge-guard`, {
      method: 'POST',
      token: guardToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guardUserId: 'spoofed-guard-id', guardName: 'Guardia falso' }),
    });
    assert.equal(acknowledgeResponse.status, 201);
    const acknowledgement = await responseData(acknowledgeResponse);
    assert.equal(acknowledgement.acknowledged_guards[0].guard_id, await tenantUserId('guard.norte@qa.dommia.test', 'GUARD'));
    assert.notEqual(acknowledgement.acknowledged_guards[0].guard_name, 'Guardia falso');

    const firstGuardResponse = await request('/tenants/guard-qa/notices?audience=GUARDS', { token: guardToken });
    const firstGuardNotice = (await responseData(firstGuardResponse)).find((notice) => notice.id === noticeId);
    assert.equal(firstGuardNotice.is_acknowledged_by_current_guard, true);

    const secondGuardResponse = await request('/tenants/guard-qa/notices?audience=GUARDS', { token: secondGuardToken });
    const secondGuardNotice = (await responseData(secondGuardResponse)).find((notice) => notice.id === noticeId);
    assert.equal(secondGuardNotice.is_acknowledged_by_current_guard, false);
  } finally {
    if (noticeId) await request(`/tenants/guard-qa/notices/${noticeId}`, { method: 'DELETE', token: adminToken });
  }
});

test('acepta correo o celular como identificador y rechaza contactos inválidos o ausentes', async () => {
  const property = await pool.query('SELECT id FROM tenant_guard_qa.properties ORDER BY exterior_number LIMIT 1');
  assert.equal(property.rowCount, 1);
  const createdIds = [];
  const submitResident = async (email, phone) => request('/tenants/guard-qa/residents', {
    method: 'POST',
    token: adminToken,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      propertyId: property.rows[0].id,
      firstName: 'Telefono',
      lastName: 'QA',
      email,
      phone,
      role: 'FAMILY_MEMBER',
      isPrimary: false,
    }),
  });

  try {
    assert.equal((await submitResident('', '123456789')).status, 400, 'Debe rechazar nueve dígitos.');
    assert.equal((await submitResident('', '12345678901')).status, 400, 'Debe rechazar once dígitos.');
    assert.equal((await submitResident('', '')).status, 400, 'Debe exigir al menos un dato de contacto.');

    const email = `email-only-${uniqueId()}@dommia.test`;
    for (const [emailInput, phoneInput] of [[email, ''], ['', '5512345678']]) {
      const response = await submitResident(emailInput, phoneInput);
      const body = await response.json();
      assert.equal(response.status, 201, JSON.stringify(body));
      createdIds.push(body.data.id);
    }

    const residentLogin = await request('/auth/resident/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '5512345678', password: 'Dommia2026!', tenantSlug: 'guard-qa' }),
    });
    assert.equal(residentLogin.status, 200, 'El residente solo con celular debe poder usarlo como identificador de login.');
  } finally {
    if (createdIds.length) {
      await pool.query('DELETE FROM tenant_guard_qa.residents WHERE id = ANY($1::uuid[])', [createdIds]);
    }
  }
});