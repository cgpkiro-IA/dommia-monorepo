import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { closeTestPool, pool, prepareGuardQa } from './guard-test-helpers.mjs';

let tenantId;
let originalTenant;
let originalPlan;
const fixtureSubdomain = `guard-qa-${Date.now()}.dommia.com`;

before(async () => {
  await prepareGuardQa();
  const tenant = await pool.query(
    "SELECT id, subdomain, custom_domain, access_url FROM public.tenants WHERE lower(replace(slug, '-', '_')) = 'guard_qa'",
  );
  assert.equal(tenant.rowCount, 1);
  tenantId = tenant.rows[0].id;
  originalTenant = tenant.rows[0];
  const plan = await pool.query(
    "SELECT standard_domain_pattern, available_addons FROM public.saas_plans WHERE code = 'BASIC'",
  );
  assert.equal(plan.rowCount, 1);
  originalPlan = plan.rows[0];
});

after(async () => {
  if (tenantId && originalTenant) {
    await pool.query(
      `UPDATE public.tenants SET subdomain = $2, custom_domain = $3, access_url = $4 WHERE id = $1`,
      [tenantId, originalTenant.subdomain, originalTenant.custom_domain, originalTenant.access_url],
    );
  }
  if (originalPlan) {
    await pool.query(
      `UPDATE public.saas_plans SET standard_domain_pattern = $1, available_addons = $2 WHERE code = 'BASIC'`,
      [originalPlan.standard_domain_pattern, JSON.stringify(originalPlan.available_addons)],
    );
  }
  await closeTestPool();
});

test('domain migration updates first-party hosts, preserves external domains, and is idempotent', async () => {
  await pool.query(
    `UPDATE public.tenants
     SET subdomain = $2, custom_domain = 'portal.customer.example', access_url = 'https://standar.dommia.com/guard-qa'
     WHERE id = $1`,
    [tenantId, fixtureSubdomain],
  );
  await pool.query(
    `UPDATE public.saas_plans
     SET standard_domain_pattern = 'standar.dommia.com/{slug}',
         available_addons = '[{"name":"{slug}.dommia.com"}]'::jsonb
     WHERE code = 'BASIC'`,
  );

  const migration = await readFile(new URL('../../../docker/migrations/027_dommia_domain_mx.sql', import.meta.url), 'utf8');
  try {
    await pool.query(migration);
    const tenant = await pool.query(
      'SELECT subdomain, custom_domain, access_url FROM public.tenants WHERE id = $1', [tenantId],
    );
    assert.equal(tenant.rows[0].subdomain, `${fixtureSubdomain}.mx`);
    assert.equal(tenant.rows[0].custom_domain, 'portal.customer.example');
    assert.equal(tenant.rows[0].access_url, 'https://standar.dommia.com.mx/guard-qa');

    const plan = await pool.query(
      "SELECT standard_domain_pattern, available_addons FROM public.saas_plans WHERE code = 'BASIC'",
    );
    assert.equal(plan.rows[0].standard_domain_pattern, 'standar.dommia.com.mx/{slug}');
    assert.deepEqual(plan.rows[0].available_addons, [{ name: '{slug}.dommia.com.mx' }]);

    await pool.query(migration);
    const repeated = await pool.query(
      'SELECT subdomain, custom_domain, access_url FROM public.tenants WHERE id = $1', [tenantId],
    );
    assert.deepEqual(repeated.rows[0], tenant.rows[0]);
  } finally {
    await pool.query(
      `UPDATE public.tenants SET subdomain = $2, custom_domain = $3, access_url = $4 WHERE id = $1`,
      [tenantId, originalTenant.subdomain, originalTenant.custom_domain, originalTenant.access_url],
    );
    await pool.query(
      `UPDATE public.saas_plans SET standard_domain_pattern = $1, available_addons = $2 WHERE code = 'BASIC'`,
      [originalPlan.standard_domain_pattern, JSON.stringify(originalPlan.available_addons)],
    );
  }
});
