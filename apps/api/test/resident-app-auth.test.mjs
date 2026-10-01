import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import { closeTestPool, pool, prepareGuardQa, request } from './guard-test-helpers.mjs';

const identifier = 'ana.rivera@qa.dommia.test';
const password = 'ResidentQa2026!';
const tenantSlug = 'guard-qa';
const deviceIds = [randomUUID(), randomUUID(), randomUUID()];
const passwordChangeDeviceIds = [randomUUID(), randomUUID()];
const concurrentRefreshDeviceId = randomUUID();

async function loginApp(clientType, deviceId, loginPassword = password) {
  const response = await request('/auth/app/resident/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password: loginPassword, tenantSlug, clientType, deviceId, deviceName: `E2E ${clientType}` }),
  });
  const body = await response.json();
  assert.equal(response.status, 200, body.message || 'El login de app debe ser exitoso.');
  assert.equal(body.success, true);
  return body.data;
}

function claimsFromJwt(token) {
  const parts = token.split('.');
  assert.equal(parts.length, 3, 'El token de app debe usar formato JWT de tres segmentos.');
  return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
}

before(async () => {
  await prepareGuardQa();
  await pool.query(
    "UPDATE tenant_guard_qa.residents SET password_hash = crypt('ResidentQa2026!', gen_salt('bf', 10)), must_change_password = FALSE WHERE email = 'ana.rivera@qa.dommia.test'",
  );
});

after(async () => {
  await pool.query('DELETE FROM public.resident_sessions WHERE device_id = ANY($1::uuid[])', [[...deviceIds, ...passwordChangeDeviceIds, concurrentRefreshDeviceId]]);
  await closeTestPool();
});

test('las apps rotan sesiones por dispositivo y conservan el bearer Resident legacy de la PWA', { concurrency: false }, async () => {
  const android = await loginApp('ANDROID', deviceIds[0]);
  const ios = await loginApp('IOS', deviceIds[1]);
  const androidClaims = claimsFromJwt(android.accessToken);

  assert.equal(android.tokenType, 'Bearer');
  assert.equal(androidClaims.iss, 'dommia-api');
  assert.equal(androidClaims.aud, 'dommia-resident-api');
  assert.equal(androidClaims.clientType, 'ANDROID');
  assert.equal(androidClaims.tenantSlug, tenantSlug);
  assert.ok(androidClaims.exp > Math.floor(Date.now() / 1000));
  assert.ok(androidClaims.exp <= Math.floor(Date.now() / 1000) + 15 * 60);

  const appProfile = await request('/auth/resident/me', { token: android.accessToken });
  assert.equal(appProfile.status, 200, 'El JWT de app puede usar recursos Resident compatibles.');

  const sessionsResponse = await request('/auth/app/resident/sessions', { token: android.accessToken });
  assert.equal(sessionsResponse.status, 200);
  const sessions = (await sessionsResponse.json()).data;
  const iosSession = sessions.find((session) => session.deviceId === deviceIds[1]);
  assert.ok(iosSession);
  assert.equal(iosSession.clientType, 'IOS');
  const androidSession = sessions.find((session) => session.deviceId === deviceIds[0]);
  assert.ok(androidSession);
  assert.equal(androidSession.isCurrent, true);

  const pushTokenResponse = await request('/auth/app/resident/devices/push-token', {
    method: 'POST',
    token: ios.accessToken,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId: deviceIds[1], token: `apns-${randomUUID()}-token-value` }),
  });
  const pushTokenBody = await pushTokenResponse.json();
  assert.equal(pushTokenResponse.status, 200);
  assert.equal(pushTokenBody.success, true);
  assert.equal(pushTokenBody.message, null);
  assert.equal(pushTokenBody.data.clientType, 'IOS');

  const revokePushTokenResponse = await request(`/auth/app/resident/devices/push-token/${deviceIds[1]}`, {
    method: 'DELETE',
    token: ios.accessToken,
  });
  const revokePushTokenBody = await revokePushTokenResponse.json();
  assert.equal(revokePushTokenResponse.status, 200);
  assert.equal(revokePushTokenBody.success, true);
  assert.equal(revokePushTokenBody.data.clientType, 'IOS');

  const revokeIos = await request(`/auth/app/resident/sessions/${iosSession.id}`, { method: 'DELETE', token: android.accessToken });
  assert.equal(revokeIos.status, 200);
  const revokedIosRefresh = await request('/auth/app/resident/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: ios.refreshToken }),
  });
  assert.equal(revokedIosRefresh.status, 401);

  const rotated = await request('/auth/app/resident/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: android.refreshToken }),
  });
  assert.equal(rotated.status, 200);
  const nextTokens = (await rotated.json()).data;
  assert.notEqual(nextTokens.refreshToken, android.refreshToken);
  assert.equal((await request('/auth/resident/me', { token: android.accessToken })).status, 200, 'El access token corto actual permanece válido hasta su expiración normal.');
  assert.equal((await request('/auth/resident/me', { token: nextTokens.accessToken })).status, 200);
  assert.equal((await request('/auth/app/resident/me', { token: nextTokens.accessToken })).status, 200);

  const replay = await request('/auth/app/resident/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: android.refreshToken }),
  });
  assert.equal(replay.status, 401, 'Reutilizar un refresh anterior se rechaza y revoca su familia.');
  assert.equal((await request('/auth/resident/me', { token: android.accessToken })).status, 401);
  assert.equal((await request('/auth/resident/me', { token: nextTokens.accessToken })).status, 401);
  const replayAudit = await pool.query(`
    SELECT 1 FROM public.audit_logs a
    JOIN public.tenants t ON t.id = a.tenant_id
    WHERE a.entity_id = $1 AND a.action = 'APP_REFRESH_REUSE_DETECTED'
      AND lower(replace(t.slug, '-', '_')) = $2
    ORDER BY a.created_at DESC LIMIT 1
  `, [androidClaims.sub, tenantSlug.replace(/-/g, '_')]);
  assert.equal(replayAudit.rowCount, 1, 'El replay queda auditado sin incluir el token.');
  const revokedFamilyRefresh = await request('/auth/app/resident/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: nextTokens.refreshToken }),
  });
  const revokedFamilyRefreshBody = await revokedFamilyRefresh.json();
  assert.equal(revokedFamilyRefresh.status, 401);
  assert.equal(revokedFamilyRefreshBody.success, false);
  assert.equal(revokedFamilyRefreshBody.data, null);
  assert.equal(revokedFamilyRefreshBody.statusCode, 401);

  const mobileSession = await loginApp('ANDROID', deviceIds[2]);
  const legacyLogin = await request('/auth/resident/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password, tenantSlug }),
  });
  assert.equal(legacyLogin.status, 200);
  const legacy = (await legacyLogin.json()).data;
  assert.equal(legacy.token.split('.').length, 3, 'El login Resident emite un JWT estándar compatible con la PWA.');
  assert.equal((await request('/auth/resident/me', { token: legacy.token })).status, 200);
  assert.equal((await request('/auth/app/resident/sessions', { token: legacy.token })).status, 401);
  assert.equal((await request('/auth/app/resident/me', { token: legacy.token })).status, 401);
  const legacyAppProfile = await request('/auth/app/resident/me', { token: legacy.token });
  const legacyAppProfileBody = await legacyAppProfile.json();
  assert.equal(legacyAppProfileBody.success, false);
  assert.equal(legacyAppProfileBody.data, null);
  assert.equal(legacyAppProfileBody.statusCode, 401);

  const mobileLogout = await request('/auth/app/resident/logout', { method: 'POST', token: mobileSession.accessToken });
  assert.equal(mobileLogout.status, 200);
  const refreshAfterLogout = await request('/auth/app/resident/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: mobileSession.refreshToken }),
  });
  assert.equal(refreshAfterLogout.status, 401);
});

test('el cambio de contraseña revoca las sesiones móviles sin cambiar el contrato legacy', { concurrency: false }, async () => {
  const nextPassword = 'ResidentQaChanged2026!';
  const session = await loginApp('IOS', passwordChangeDeviceIds[0]);
  const changeResponse = await request('/auth/app/resident/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier,
      tenantSlug,
      currentPassword: password,
      newPassword: nextPassword,
    }),
  });
  const changeBody = await changeResponse.json();

  assert.equal(changeResponse.status, 200, changeBody.message || 'El cambio de contraseña móvil debe ser exitoso.');
  assert.equal(changeBody.success, true);
  assert.equal(changeBody.data.revokedSessions >= 1, true);
  assert.equal((await request('/auth/app/resident/me', { token: session.accessToken })).status, 401);

  const revokedRefresh = await request('/auth/app/resident/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });
  assert.equal(revokedRefresh.status, 401);

  const nextSession = await loginApp('IOS', passwordChangeDeviceIds[1], nextPassword);
  assert.equal(nextSession.tokenType, 'Bearer');

  const restoreResponse = await request('/auth/app/resident/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier,
      tenantSlug,
      currentPassword: nextPassword,
      newPassword: password,
    }),
  });
  assert.equal(restoreResponse.status, 200);
});

test('la recuperación y el reset de contraseña están disponibles bajo el contrato móvil', { concurrency: false }, async () => {
  const recoveryPassword = 'ResidentQaRecovery2026!';
  const recoveryResponse = await request('/auth/app/resident/password-recovery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, tenantSlug }),
  });
  const recoveryBody = await recoveryResponse.json();
  assert.equal(recoveryResponse.status, 200, recoveryBody.message || 'La recuperación móvil debe responder correctamente.');
  assert.equal(recoveryBody.success, true);
  assert.ok(recoveryBody.data.resetToken, 'DEV debe exponer el token solo para pruebas locales.');

  const resetResponse = await request('/auth/app/resident/password-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: recoveryBody.data.resetToken, newPassword: recoveryPassword }),
  });
  const resetBody = await resetResponse.json();
  assert.equal(resetResponse.status, 200, resetBody.message || 'El reset móvil debe responder correctamente.');
  assert.equal(resetBody.success, true);
  assert.equal(resetBody.data.revokedSessions, 0);
  const recoveredSession = await loginApp('ANDROID', randomUUID(), recoveryPassword);
  assert.equal(recoveredSession.tokenType, 'Bearer');

  const restoreRecovery = await request('/auth/app/resident/password-recovery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, tenantSlug }),
  });
  const restoreRecoveryBody = await restoreRecovery.json();
  assert.ok(restoreRecoveryBody.data.resetToken);
  const restoreReset = await request('/auth/app/resident/password-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: restoreRecoveryBody.data.resetToken, newPassword: password }),
  });
  assert.equal(restoreReset.status, 200);
});

test('el refresh concurrente permite una sola rotación y revoca el replay', { concurrency: false }, async () => {
  const session = await loginApp('ANDROID', concurrentRefreshDeviceId);
  const refreshRequest = () => request('/auth/app/resident/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });

  const responses = await Promise.all([refreshRequest(), refreshRequest()]);
  const results = await Promise.all(responses.map(async (response) => ({
    status: response.status,
    body: await response.json(),
  })));
  const statuses = results.map((result) => result.status).sort((left, right) => left - right);

  assert.deepEqual(statuses, [200, 401]);
  const rejected = results.find((result) => result.status === 401);
  assert.equal(rejected.body.success, false);
  assert.equal(rejected.body.data, null);
  assert.equal(rejected.body.statusCode, 401);

  const successful = results.find((result) => result.status === 200);
  const familyRefresh = await request('/auth/app/resident/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: successful.body.data.refreshToken }),
  });
  const familyRefreshBody = await familyRefresh.json();
  assert.equal(familyRefresh.status, 401);
  assert.equal(familyRefreshBody.success, false);
  assert.equal(familyRefreshBody.data, null);
});