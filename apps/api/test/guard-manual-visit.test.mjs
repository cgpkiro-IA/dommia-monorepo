import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { closeTestPool, pool, prepareGuardQa, request, responseData, signTenantToken, uniqueId } from './guard-test-helpers.mjs';

let guardToken;

before(async () => {
  await prepareGuardQa();
  guardToken = await signTenantToken('guard.norte@qa.dommia.test', 'GUARD');
});

after(closeTestPool);

test('sugiere domicilios registrados de forma aislada y sin datos personales', async () => {
  const anonymous = await request('/tenants/guard-qa/access/manual-visits/properties?query=Circuito');
  assert.equal(anonymous.status, 401);

  const response = await request('/tenants/guard-qa/access/manual-visits/properties?query=Circuito', { token: guardToken });
  assert.equal(response.status, 200);
  const result = await responseData(response);
  const property = result.suggestions.find((suggestion) => suggestion.propertyAddress === 'Circuito del Roble #101 Norte Lote 01');
  assert.ok(property, 'Debe sugerir la dirección registrada en el tenant.');
  assert.equal(Object.hasOwn(property, 'email'), false);
  assert.equal(Object.hasOwn(property, 'phone'), false);

  const noMatch = await request('/tenants/guard-qa/access/manual-visits/properties?query=DireccionInexistente', { token: guardToken });
  assert.deepEqual((await responseData(noMatch)).suggestions, []);
});

test('autoriza visita sin QR solo con INE verificada y llamada confirmada, registra auditoría y consume pase SINGLE', async () => {
  const visitorName = `Visita manual ${uniqueId()}`;
  const inserted = await pool.query(`
    INSERT INTO tenant_guard_qa.invitations (property_id, resident_id, visitor_name, invitation_type, valid_from, valid_until, notes)
    SELECT property_id, id, $1, 'SINGLE', NOW(), NOW() + INTERVAL '1 day', 'Manual access integration test'
    FROM tenant_guard_qa.residents
    WHERE email = 'ana.rivera@qa.dommia.test'
    RETURNING id
  `, [visitorName]);
  assert.equal(inserted.rowCount, 1, 'Debe crear un pase SINGLE para la residente QA.');
  const invitationId = inserted.rows[0].id;

  try {
    const anonymousLookup = await request('/tenants/guard-qa/access/manual-visits?query=101');
    assert.equal(anonymousLookup.status, 401);

    const lookup = await request('/tenants/guard-qa/access/manual-visits?query=101', { token: guardToken });
    assert.equal(lookup.status, 200);
    const candidates = await responseData(lookup);
    const candidate = candidates.candidates.find(item => item.invitationId === invitationId);
    assert.ok(candidate, 'Debe encontrar la visita programada por domicilio.');
    assert.equal(candidate.visitorName, visitorName);
    assert.equal(candidate.propertyAddress, 'Circuito del Roble #101 Norte Lote 01');
    assert.equal(candidate.isCurrentlyValid, true);
    assert.equal(Object.hasOwn(candidate, 'totpSecret'), false, 'No debe exponer el secreto QR.');

    const withoutCallConfirmation = await request(`/tenants/guard-qa/access/manual-visits/${invitationId}/authorize`, {
      token: guardToken,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identityVerified: true, callConfirmed: false }),
    });
    assert.equal(withoutCallConfirmation.status, 400);

    const beforeAuthorization = await pool.query(
      'SELECT id FROM tenant_guard_qa.access_logs WHERE identifier = $1',
      [invitationId],
    );
    assert.equal(beforeAuthorization.rowCount, 0, 'No debe auditar acceso concedido si falta confirmación telefónica.');

    const authorization = await request(`/tenants/guard-qa/access/manual-visits/${invitationId}/authorize`, {
      token: guardToken,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identityVerified: true, callConfirmed: true }),
    });
    assert.equal(authorization.status, 201);
    const result = await responseData(authorization);
    assert.equal(result.authorized, true);
    assert.equal(result.manualAccess, true);
    assert.equal(result.authorizationMethod, 'CALL_CONFIRMED');
    assert.equal(result.visitorName, visitorName);

    const audit = await pool.query(`
      SELECT id, access_type, is_granted, manual_reason, guard_user_id
      FROM tenant_guard_qa.access_logs WHERE identifier = $1
    `, [invitationId]);
    assert.equal(audit.rowCount, 1);
    assert.equal(audit.rows[0].access_type, 'MANUAL_GUARD');
    assert.equal(audit.rows[0].is_granted, true);
    assert.match(audit.rows[0].manual_reason, /INE_VERIFICADA/);
    assert.match(audit.rows[0].manual_reason, /AUTORIZADA_POR_LLAMADA/);
    assert.equal(audit.rows[0].guard_user_id, await pool.query(`
      SELECT u.id FROM public.users u WHERE lower(u.email) = lower($1)
    `, ['guard.norte@qa.dommia.test']).then(response => response.rows[0].id));

    const consumed = await pool.query('SELECT is_active, used_at FROM tenant_guard_qa.invitations WHERE id = $1', [invitationId]);
    assert.equal(consumed.rows[0].is_active, false);
    assert.ok(consumed.rows[0].used_at);

    const historyResponse = await request('/tenants/guard-qa/guard/history?type=ACCESS&property=Circuito', { token: guardToken });
    assert.equal(historyResponse.status, 200);
    const history = await responseData(historyResponse);
    const manualEvent = history.find(event => event.id === audit.rows[0].id);
    assert.equal(manualEvent?.title, 'Acceso manual autorizado por llamada');
    assert.match(manualEvent?.details || '', /INE_VERIFICADA/);
    assert.match(manualEvent?.details || '', /AUTORIZADA_POR_LLAMADA/);

    const repeatedAuthorization = await request(`/tenants/guard-qa/access/manual-visits/${invitationId}/authorize`, {
      token: guardToken,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identityVerified: true, callConfirmed: true }),
    });
    assert.equal(repeatedAuthorization.status, 409);
  } finally {
    await pool.query('DELETE FROM tenant_guard_qa.access_logs WHERE identifier = $1', [invitationId]);
    await pool.query('DELETE FROM tenant_guard_qa.invitations WHERE id = $1', [invitationId]);
  }
});