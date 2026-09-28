import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { closeTestPool, pool, prepareGuardQa, request, responseData, signTenantToken, tenantSlug, uniqueId } from './guard-test-helpers.mjs';

let guardToken;

before(async () => {
  await prepareGuardQa();
  guardToken = await signTenantToken('guard.norte@qa.dommia.test', 'GUARD');
});

after(closeTestPool);

test('busca residentes/unidades, muestra pases activos y clasifica vehículos', async () => {
  const visitorName = `Guard test ${uniqueId()}`;
  const inserted = await pool.query(`
    INSERT INTO tenant_guard_qa.invitations (property_id, resident_id, visitor_name, invitation_type, valid_from, valid_until, notes)
    SELECT property_id, id, $1, 'RECURRENT', NOW(), NOW() + INTERVAL '1 day', 'Automated regression fixture'
    FROM tenant_guard_qa.residents
    WHERE email = 'ana.rivera@qa.dommia.test'
    RETURNING id
  `, [visitorName]);
  assert.equal(inserted.rowCount, 1, 'Debe crear un pase para la residente QA.');
  const invitationId = inserted.rows[0].id;

  try {
    const residentResponse = await request('/tenants/guard-qa/access/lookup?query=101', { token: guardToken });
    assert.equal(residentResponse.status, 200);
    const residentData = await responseData(residentResponse);
    const ana = residentData.residents.find(resident => resident.email === 'ana.rivera@qa.dommia.test');
    assert.ok(ana, 'La búsqueda por calle y unidad debe devolver a la residente.');
    assert.ok(ana.activePasses.some(pass => pass.id === invitationId && pass.visitorName === visitorName));

    const ownerLookup = await responseData(await request('/tenants/guard-qa/access/lookup?query=QAA-1001', { token: guardToken }));
    assert.equal(ownerLookup.vehicles.find(vehicle => vehicle.plates === 'QAA-1001')?.classification, 'OWNER');

    const frequentLookup = await responseData(await request('/tenants/guard-qa/access/lookup?query=QAF-7777', { token: guardToken }));
    assert.equal(frequentLookup.vehicles.find(vehicle => vehicle.plates === 'QAF-7777')?.classification, 'FREQUENT_VISITOR');

    const blockedLookup = await responseData(await request('/tenants/guard-qa/access/lookup?query=QAB-9999', { token: guardToken }));
    assert.equal(blockedLookup.vehicles.find(vehicle => vehicle.plates === 'QAB-9999')?.blocked, true);

    await pool.query('UPDATE tenant_guard_qa.invitations SET is_active = FALSE WHERE id = $1', [invitationId]);
    const revokedLookup = await responseData(await request('/tenants/guard-qa/access/lookup?query=Ana%20Rivera', { token: guardToken }));
    const anaAfterRevoke = revokedLookup.residents.find(resident => resident.email === 'ana.rivera@qa.dommia.test');
    assert.equal(anaAfterRevoke.activePasses.some(pass => pass.id === invitationId), false);
  } finally {
    await pool.query('DELETE FROM tenant_guard_qa.invitations WHERE id = $1', [invitationId]);
  }
});