import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { closeTestPool, prepareGuardQa, request, responseData, signTenantToken } from './guard-test-helpers.mjs';

let guardToken;
let adminToken;

before(async () => {
  await prepareGuardQa();
  guardToken = await signTenantToken('guard.norte@qa.dommia.test', 'GUARD');
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