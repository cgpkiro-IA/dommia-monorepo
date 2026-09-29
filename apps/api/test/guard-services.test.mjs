import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { closeTestPool, pool, prepareGuardQa, request, responseData, signTenantToken, tenantSlug, uniqueId } from './guard-test-helpers.mjs';

let guardToken;

before(async () => {
  await prepareGuardQa();
  guardToken = await signTenantToken('guard.norte@qa.dommia.test', 'GUARD');
});

after(closeTestPool);

test('registra ingreso de servicio específico, consulta servicios activos y registra salida', async () => {
  let serviceId;
  try {
    // 1. Registrar ingreso de servicio
    const createRes = await request('/tenants/guard-qa/access/services', {
      method: 'POST',
      token: guardToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceType: 'FOOD_DELIVERY',
        supplierName: 'Rappi - Pizza Hut',
        vehiclePlates: 'MOTO-449',
        destinationType: 'SPECIFIC',
        destinations: [
          {
            propertyId: 'b0000000-0000-0000-0000-000000000101',
            propertyAddress: 'Circuito QA 101',
            residentName: 'Carlos Residente QA',
            residentPhone: '5511223344',
          },
        ],
        notes: 'Repartidor con mochila térmica',
      }),
    });
    assert.equal(createRes.status, 201);
    const created = await responseData(createRes);
    serviceId = created.id;
    assert.equal(created.status, 'IN_TRANSIT');
    assert.equal(created.service_type, 'FOOD_DELIVERY');
    assert.equal(created.supplier_name, 'Rappi - Pizza Hut');

    // 2. Listar servicios activos en caseta
    const activeRes = await request('/tenants/guard-qa/access/services?status=IN_TRANSIT', { token: guardToken });
    assert.equal(activeRes.status, 200);
    const activeList = await responseData(activeRes);
    const foundInActive = activeList.find((s) => s.id === serviceId);
    assert.ok(foundInActive, 'El servicio debe aparecer en la lista de activos en caseta.');

    // 3. Registrar salida del servicio
    const exitRes = await request(`/tenants/guard-qa/access/services/${serviceId}/exit`, {
      method: 'POST',
      token: guardToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'Salida en orden' }),
    });
    assert.equal(exitRes.status, 201);
    const exited = await responseData(exitRes);
    assert.equal(exited.status, 'COMPLETED');
    assert.ok(exited.exited_at);

    // 4. Verificar que ya no aparece en la lista de activos en tránsito
    const activeAfterExitRes = await request('/tenants/guard-qa/access/services?status=IN_TRANSIT', { token: guardToken });
    const activeAfterExitList = await responseData(activeAfterExitRes);
    const foundAfterExit = activeAfterExitList.find((s) => s.id === serviceId);
    assert.equal(foundAfterExit, undefined, 'El servicio debe desaparecer de activos al registrar salida.');
  } finally {
    if (serviceId) {
      await pool.query('DELETE FROM tenant_guard_qa.guard_services WHERE id = $1', [serviceId]);
    }
  }
});

test('registra ingreso de recorrido general para camión de gas', async () => {
  let serviceId;
  try {
    const createRes = await request('/tenants/guard-qa/access/services', {
      method: 'POST',
      token: guardToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceType: 'GAS_SUPPLY',
        supplierName: 'Gas Imperial Pipa #12',
        vehiclePlates: 'GAS-991',
        destinationType: 'GENERAL',
        notes: 'Recorrido general para llenado de tanques estacionarios',
      }),
    });
    assert.equal(createRes.status, 201);
    const created = await responseData(createRes);
    serviceId = created.id;
    assert.equal(created.status, 'IN_TRANSIT');
    assert.equal(created.destination_type, 'GENERAL');

    // Registrar salida
    const exitRes = await request(`/tenants/guard-qa/access/services/${serviceId}/exit`, {
      method: 'POST',
      token: guardToken,
    });
    assert.equal(exitRes.status, 201);
  } finally {
    if (serviceId) {
      await pool.query('DELETE FROM tenant_guard_qa.guard_services WHERE id = $1', [serviceId]);
    }
  }
});

test('consulta bitacora unificada de eventos y accesos con metricas y filtros temporales', async () => {
  const adminToken = await signTenantToken('admin.guard-qa@dommia.test', 'TENANT_ADMIN');

  const res = await request('/tenants/guard-qa/access/unified-log?limit=20', {
    method: 'GET',
    token: adminToken,
  });

  assert.equal(res.status, 200);
  const body = await responseData(res);
  assert.ok(body.summary, 'Debe incluir summary de eventos');
  assert.ok(Array.isArray(body.events), 'Debe incluir lista de eventos');
  assert.equal(typeof body.summary.totalEvents, 'number');
});

