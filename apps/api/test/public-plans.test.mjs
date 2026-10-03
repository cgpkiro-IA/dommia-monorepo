import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { closeTestPool, prepareGuardQa, request } from './guard-test-helpers.mjs';

before(async () => {
  await prepareGuardQa();
});

after(async () => {
  await closeTestPool();
});

test('public plan catalog is readable without authentication and exposes only sales fields', async () => {
  const response = await request('/crm/public-plans');
  assert.equal(response.status, 200);

  const result = await response.json();
  assert.equal(result.success, true);
  assert.ok(Array.isArray(result.data));

  const basicPlan = result.data.find((plan) => plan.code === 'BASIC');
  assert.ok(basicPlan, 'the active basic plan should be in the public catalog');
  assert.equal(typeof basicPlan.minProperties, 'number');
  assert.equal(typeof basicPlan.maxProperties, 'number');
  assert.ok(basicPlan.minProperties <= basicPlan.maxProperties);
  assert.ok(Number.isFinite(Number(basicPlan.monthlyPrice)));
  assert.equal(typeof basicPlan.includesCustomDomain, 'boolean');
  assert.equal('includedModules' in basicPlan, false);
  assert.equal('availableAddons' in basicPlan, false);
  assert.equal('isActive' in basicPlan, false);
});