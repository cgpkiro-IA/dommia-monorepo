import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import * as OTPAuth from 'otpauth';
import { closeTestPool, pool, prepareGuardQa, request } from './guard-test-helpers.mjs';

const email = `mfa-${randomUUID()}@qa.dommia.test`;
const password = 'MfaIntegration2026!';

before(async () => {
  await prepareGuardQa();
  await pool.query(
    `INSERT INTO public.users (email, password_hash, first_name, last_name, role)
     VALUES ($1, crypt($2, gen_salt('bf', 10)), 'MFA', 'QA', 'SUPER_ADMIN')`,
    [email, password],
  );
});

after(async () => {
  await pool.query('DELETE FROM public.users WHERE email = $1', [email]);
  await closeTestPool();
});

test('MFA es opcional, bloquea el CRM hasta TOTP y rechaza desafíos/códigos repetidos', async () => {
  const anonymousCrm = await request('/crm/metrics');
  assert.equal(anonymousCrm.status, 401);

  const loginResponse = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(loginResponse.status, 200);
  const initialSession = (await loginResponse.json()).data;
  assert.ok(initialSession.token, 'MFA desactivado conserva el login de un solo factor.');

  const statusResponse = await request('/auth/mfa/status', { token: initialSession.token });
  assert.equal(statusResponse.status, 200);
  assert.equal((await statusResponse.json()).data.enabled, false);

  const setupResponse = await request('/auth/mfa/setup', {
    token: initialSession.token,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  assert.equal(setupResponse.status, 200);
  const setup = (await setupResponse.json()).data;
  assert.match(setup.qrCodeDataUrl, /^data:image\/png;base64,/);
  assert.match(setup.secret, /^[A-Z2-7]+$/);

  const totp = new OTPAuth.TOTP({
    issuer: 'Dommia',
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(setup.secret),
  });
  const enableResponse = await request('/auth/mfa/enable', {
    token: initialSession.token,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: totp.generate() }),
  });
  assert.equal(enableResponse.status, 200);

  await pool.query('UPDATE public.users SET mfa_last_used_step = NULL WHERE email = $1', [email]);
  const mfaLoginResponse = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(mfaLoginResponse.status, 200);
  const challenge = (await mfaLoginResponse.json()).data;
  assert.equal(challenge.mfaRequired, true);
  assert.equal(typeof challenge.token, 'undefined');

  const challengeCrm = await request('/crm/metrics', { token: challenge.challengeToken });
  assert.equal(challengeCrm.status, 401);

  const code = totp.generate();
  const verifyResponse = await request('/auth/mfa/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeToken: challenge.challengeToken, code }),
  });
  assert.equal(verifyResponse.status, 200);
  const verifiedSession = (await verifyResponse.json()).data;
  assert.ok(verifiedSession.token);
  assert.equal((await request('/crm/metrics', { token: verifiedSession.token })).status, 200);

  const challengeReplay = await request('/auth/mfa/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeToken: challenge.challengeToken, code }),
  });
  assert.equal(challengeReplay.status, 401);

  const nextLoginResponse = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const nextChallenge = (await nextLoginResponse.json()).data;
  const codeReplay = await request('/auth/mfa/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeToken: nextChallenge.challengeToken, code }),
  });
  assert.equal(codeReplay.status, 401);
});