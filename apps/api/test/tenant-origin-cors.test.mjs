import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { apiBase, closeTestPool, prepareGuardQa } from './guard-test-helpers.mjs';

before(async () => prepareGuardQa());
after(async () => closeTestPool());

test('CORS accepts HTTPS first-party tenant hosts and rejects spoofed or external origins', async () => {
  const cases = [
    ['https://cumbres.dommia.com.mx', true],
    ['https://standar.dommia.com.mx', true],
    ['https://cumbres.dommia.com.mx:8443', false],
    ['http://cumbres.dommia.com.mx', false],
    ['https://cumbres.dommia.com.mx.attacker.test', false],
    ['https://customer.example', false],
  ];

  for (const [origin, allowed] of cases) {
    const response = await fetch(`${apiBase}/health`, { headers: { Origin: origin } });
    assert.equal(response.headers.get('access-control-allow-origin') === origin, allowed, origin);
  }
});