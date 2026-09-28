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

  const crossTenantLookup = await request('/tenants/demo/access/lookup?query=101', { token: guardToken });
  assert.equal(crossTenantLookup.status, 403);

  const ownAdminList = await request('/tenants/guard-qa/guard/incidents?status=OPEN', { token: adminToken });
  assert.equal(ownAdminList.status, 200);

  const crossTenantAdminList = await request('/tenants/demo/guard/incidents?status=OPEN', { token: adminToken });
  assert.equal(crossTenantAdminList.status, 403);
});