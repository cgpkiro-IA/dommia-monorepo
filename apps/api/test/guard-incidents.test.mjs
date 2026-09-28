import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { closeTestPool, pool, prepareGuardQa, request, responseData, signTenantToken, tenantSlug, uniqueId } from './guard-test-helpers.mjs';

let guardToken;
let adminToken;

before(async () => {
  await prepareGuardQa();
  guardToken = await signTenantToken('guard.norte@qa.dommia.test', 'GUARD');
  adminToken = await signTenantToken('admin.guard-qa@dommia.test', 'TENANT_ADMIN');
});

after(closeTestPool);

test('reporta, muestra, resuelve y registra una incidencia en el historial del tenant', async () => {
  const description = `Automated Guard incident ${uniqueId()}`;
  let incidentId;
  try {
    const createdResponse = await request('/tenants/guard-qa/guard/incidents', {
      method: 'POST',
      token: guardToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'SECURITY',
        priority: 'URGENT',
        description,
        propertyAddress: 'Circuito QA 101',
        vehiclePlates: 'QAA-1001',
      }),
    });
    assert.equal(createdResponse.status, 201);
    const created = await responseData(createdResponse);
    incidentId = created.id;
    assert.equal(created.status, 'OPEN');

    const openIncidents = await responseData(await request('/tenants/guard-qa/guard/incidents?status=OPEN', { token: adminToken }));
    const openIncident = openIncidents.find(incident => incident.id === incidentId);
    assert.ok(openIncident, 'La incidencia debe aparecer en la bandeja administrativa.');
    assert.equal(openIncident.priority, 'URGENT');
    assert.equal(openIncident.created_by_name, 'Elena Guardia Norte');
    assert.ok(openIncident.created_at);

    const history = await responseData(await request('/tenants/guard-qa/guard/history?type=INCIDENT&property=Circuito%20QA', { token: guardToken }));
    assert.ok(history.some(event => event.id === incidentId && event.actor_name === 'Elena Guardia Norte'));

    const resolved = await request(`/tenants/guard-qa/guard/incidents/${incidentId}/resolve`, { method: 'PATCH', token: adminToken });
    assert.equal(resolved.status, 200);
    assert.equal((await responseData(resolved)).status, 'RESOLVED');

    const resolvedIncidents = await responseData(await request('/tenants/guard-qa/guard/incidents?status=RESOLVED', { token: adminToken }));
    const resolvedIncident = resolvedIncidents.find(incident => incident.id === incidentId);
    assert.ok(resolvedIncident);
    assert.equal(resolvedIncident.resolved_by_name, 'Admin QA Guard');
    assert.ok(resolvedIncident.resolved_at);
  } finally {
    if (incidentId) await pool.query('DELETE FROM tenant_guard_qa.guard_incidents WHERE id = $1', [incidentId]);
  }
});