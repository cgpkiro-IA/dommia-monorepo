import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { after, before, mock, test } from 'node:test';
import { closeTestPool, pool, prepareGuardQa, request, signCrmToken, uniqueId } from './guard-test-helpers.mjs';

const require = createRequire(import.meta.url);
const { CrmRepository } = require('../dist/modules/crm/repositories/crm.repository.js');
const { CrmService } = require('../dist/modules/crm/services/crm.service.js');
const { SaasMailService } = require('../dist/modules/crm/services/saas-mail.service.js');

const crmEmail = `contracts-${uniqueId()}@qa.dommia.test`;
let crmToken;
let tenantId;
let provisionedSlug;

before(async () => {
  await prepareGuardQa();
  await pool.query(
    `INSERT INTO public.users (email, password_hash, first_name, last_name, role)
     VALUES ($1, crypt($2, gen_salt('bf', 10)), 'Contract', 'QA', 'SUPER_ADMIN')`,
    [crmEmail, 'ContractQa2026!'],
  );
  crmToken = await signCrmToken(crmEmail);
  const tenant = await pool.query("SELECT id FROM public.tenants WHERE lower(replace(slug, '-', '_')) = 'guard_qa'");
  tenantId = tenant.rows[0].id;
});

after(async () => {
  await pool.query('DELETE FROM public.subscriptions WHERE tenant_id = $1 AND plan_tier = $2', [tenantId, 'CONTRACT_QA']);
  await pool.query("DELETE FROM public.saas_plans WHERE code = 'CONTRACT_QA'");
  if (provisionedSlug) {
    const schema = `tenant_${provisionedSlug}`;
    await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await pool.query('DELETE FROM public.tenants WHERE slug = $1', [provisionedSlug]);
  }
  await pool.query('DELETE FROM public.users WHERE email = $1', [crmEmail]);
  await closeTestPool();
});

async function insertContract({ amount = 1000, periodEnd = new Date(Date.now() + 86400000), reviewRequired = false, billingInterval = 'MONTHLY' } = {}) {
  const result = await pool.query(
    `INSERT INTO public.subscriptions (
       tenant_id, plan_tier, amount, billing_interval, has_custom_domain, active_addons,
       status, current_period_start, current_period_end, contract_review_required
    ) VALUES ($1, 'CONTRACT_QA', $2, $5, false, '[]'::jsonb,
      'ACTIVE', NOW(), $3, $4)
     RETURNING id`,
    [tenantId, amount, periodEnd, reviewRequired, billingInterval],
  );
  return result.rows[0].id;
}

async function setCatalogPrice(price) {
  await pool.query(
    `INSERT INTO public.saas_plans (code, name, monthly_price, max_properties, is_active)
     VALUES ('CONTRACT_QA', 'Contract QA', $1, 10, true)
     ON CONFLICT (code) DO UPDATE SET monthly_price = EXCLUDED.monthly_price, is_active = true`,
    [price],
  );
}

async function post(path, body = {}) {
  return request(path, {
    method: 'POST',
    token: crmToken,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('CRM contract routes reject requests without an admin token', async () => {
  const paths = [
    [`/crm/tenants/${tenantId}/contract`, 'GET'],
    [`/crm/tenants/${tenantId}/contract/renewal-notice`, 'POST'],
    [`/crm/tenants/${tenantId}/contract/renewal-notice/send`, 'POST'],
    [`/crm/tenants/${tenantId}/contract/renewal-notice/preview`, 'POST'],
    [`/crm/tenants/${tenantId}/contract/renew`, 'POST'],
  ];
  for (const [path, method] of paths) {
    const response = await request(path, { method });
    assert.equal(response.status, 401, `${method} ${path} debe exigir autenticación.`);
  }
});

test('manual CRM creation snapshots the current catalog price once', async () => {
  const existing = await pool.query(
    "SELECT id FROM public.subscriptions WHERE tenant_id = $1 AND status = 'ACTIVE'",
    [tenantId],
  );
  assert.equal(existing.rowCount, 0, 'guard-qa test tenant must not already have an active SaaS contract');
  const currentPlan = await pool.query(
    `SELECT p.monthly_price, p.custom_domain_addon_price, p.includes_custom_domain, t.has_custom_domain
     FROM public.tenants t JOIN public.saas_plans p ON UPPER(p.code) = UPPER(t.tier)
     WHERE t.id = $1 AND p.is_active = true`,
    [tenantId],
  );
  assert.equal(currentPlan.rowCount, 1);

  const response = await post(`/crm/tenants/${tenantId}/contract`);
  assert.equal(response.status, 201);
  const result = await response.json();
  assert.equal(result.created, true);
  const contractId = result.data.id;
  const expectedAmount = Number(currentPlan.rows[0].monthly_price)
    + (currentPlan.rows[0].has_custom_domain && !currentPlan.rows[0].includes_custom_domain
      ? Number(currentPlan.rows[0].custom_domain_addon_price)
      : 0);
  assert.equal(Number(result.data.amount), expectedAmount);
  assert.equal(result.data.billingInterval, 'MONTHLY');

  const repeated = await post(`/crm/tenants/${tenantId}/contract`);
  const repeatedResult = await repeated.json();
  assert.equal(repeated.status, 201);
  assert.equal(repeatedResult.created, false);
  assert.equal(repeatedResult.data.id, contractId);

  await pool.query('DELETE FROM public.subscriptions WHERE id = $1', [contractId]);
});

test('legacy contract reconciliation requires an explicit amount and paid-through date', async () => {
  const paidThrough = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const inserted = await pool.query(
    `INSERT INTO public.subscriptions (
       tenant_id, plan_tier, amount, billing_interval, status,
       current_period_start, current_period_end, contract_review_required
     ) VALUES ($1, 'BASIC', NULL, 'MONTHLY', 'ACTIVE', NOW(), $2, true)
     RETURNING id`,
    [tenantId, paidThrough],
  );
  const legacyId = inserted.rows[0].id;
  try {
    const response = await post(`/crm/tenants/${tenantId}/contract/reconcile`, {
      amount: 1875,
      currentPeriodEnd: paidThrough,
    });
    assert.equal(response.status, 201);
    const result = await response.json();
    assert.equal(Number(result.data.amount), 1875);
    assert.equal(result.data.contractReviewRequired, false);
    assert.equal(new Date(result.data.currentPeriodEnd).toISOString(), paidThrough);
  } finally {
    await pool.query('DELETE FROM public.subscriptions WHERE id = $1', [legacyId]);
  }
});

test('annual prepaid reconciliation preserves the total paid amount and paid-through date', async () => {
  const paidThrough = new Date(Date.now() + 365 * 86400000).toISOString();
  const response = await post(`/crm/tenants/${tenantId}/contract/reconcile`, {
    amount: 12000,
    billingInterval: 'ANNUAL',
    currentPeriodEnd: paidThrough,
  });
  assert.equal(response.status, 201);
  const contract = (await response.json()).data;
  try {
    assert.equal(contract.billingInterval, 'ANNUAL');
    assert.equal(Number(contract.amount), 12000);
    assert.equal(new Date(contract.currentPeriodEnd).toISOString(), paidThrough);
  } finally {
    if (contract?.id) await pool.query('DELETE FROM public.subscriptions WHERE id = $1', [contract.id]);
  }
});

test('annual legacy prepayment is verified without replacing its paid term with catalog pricing', async () => {
  const paidThrough = new Date(Date.now() + 180 * 86400000).toISOString();
  const legacy = await pool.query(
    `INSERT INTO public.subscriptions (
       tenant_id, plan_tier, amount, billing_interval, status,
       current_period_start, current_period_end, contract_review_required
     ) VALUES ($1, 'BASIC', NULL, 'ANNUAL', 'ACTIVE', NOW(), $2, true)
     RETURNING id`, [tenantId, paidThrough],
  );
  try {
    const response = await post(`/crm/tenants/${tenantId}/contract/reconcile`, {
      amount: 14700, billingInterval: 'ANNUAL', currentPeriodEnd: paidThrough,
    });
    assert.equal(response.status, 201);
    const contract = (await response.json()).data;
    assert.equal(contract.id, legacy.rows[0].id);
    assert.equal(contract.billingInterval, 'ANNUAL');
    assert.equal(Number(contract.amount), 14700);
    assert.equal(new Date(contract.currentPeriodEnd).toISOString(), paidThrough);
  } finally {
    await pool.query('DELETE FROM public.subscriptions WHERE id = $1', [legacy.rows[0].id]);
  }
});

test('annual prepaid total contributes one twelfth to CRM MRR', async () => {
  const baseline = await request('/crm/metrics', { token: crmToken });
  assert.equal(baseline.status, 200);
  const baselineMrr = Number((await baseline.json()).data.financials.mrr);
  const fallback = await pool.query(
    `SELECT p.monthly_price, t.has_custom_domain, t.tier
     FROM public.tenants t JOIN public.saas_plans p ON UPPER(p.code) = UPPER(t.tier)
     WHERE t.id = $1`, [tenantId],
  );
  const fallbackMrr = Number(fallback.rows[0].monthly_price)
    + (fallback.rows[0].has_custom_domain && fallback.rows[0].tier !== 'ENTERPRISE' ? 490 : 0);
  const id = await insertContract({ amount: 12000, billingInterval: 'ANNUAL' });
  try {
    const response = await request('/crm/metrics', { token: crmToken });
    assert.equal(response.status, 200);
    const mrr = Number((await response.json()).data.financials.mrr);
    assert.equal(mrr - baselineMrr, 1000 - fallbackMrr);
  } finally {
    await pool.query('DELETE FROM public.subscriptions WHERE id = $1', [id]);
  }
});

test('migration preserves unknown legacy amounts and marks them for reconciliation', async () => {
  const result = await pool.query(
    `INSERT INTO public.subscriptions (tenant_id, status)
     VALUES ($1, 'ACTIVE')
     RETURNING id`,
    [tenantId],
  );
  const id = result.rows[0].id;
  try {
    const migration = await readFile(
      new URL('../../../docker/migrations/026_saas_subscription_contracts.sql', import.meta.url),
      'utf8',
    );
    await pool.query(migration);
    const legacy = await pool.query(
      'SELECT amount, billing_interval, contract_review_required FROM public.subscriptions WHERE id = $1',
      [id],
    );
    assert.equal(legacy.rows[0].amount, null);
    assert.equal(legacy.rows[0].billing_interval, 'MONTHLY');
    assert.equal(legacy.rows[0].contract_review_required, true);
  } finally {
    await pool.query('DELETE FROM public.subscriptions WHERE id = $1', [id]);
  }
});

test('self-service stores a catalog-independent monthly contract snapshot', async () => {
  const catalog = await pool.query(
    "SELECT monthly_price FROM public.saas_plans WHERE code = 'BASIC'",
  );
  const originalPrice = catalog.rows[0].monthly_price;
  const agreedPrice = 2345.67;
  provisionedSlug = `contract_${uniqueId().replace(/-/g, '').slice(0, 12)}`;
  const adminEmail = `${provisionedSlug}@qa.dommia.test`;
  try {
    await pool.query("UPDATE public.saas_plans SET monthly_price = $1 WHERE code = 'BASIC'", [agreedPrice]);
    const provisioned = await request('/crm/self-service-provision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        communityName: 'Contract Snapshot QA',
        slug: provisionedSlug,
        tier: 'BASIC',
        maxProperties: 10,
        adminName: 'Contract QA',
        adminEmail,
        adminPassword: 'ContractQa2026!',
        hasCustomDomain: false,
      }),
    });
    assert.equal(provisioned.status, 201);
    const provisionedBody = await provisioned.json();
    assert.equal(provisionedBody.success, true);
    const snapshot = await pool.query(
      `SELECT s.plan_tier, s.amount, s.billing_interval, s.current_period_start,
              s.current_period_end, s.has_custom_domain, s.active_addons, s.contract_review_required
       FROM public.subscriptions s
       JOIN public.tenants t ON t.id = s.tenant_id
       WHERE t.slug = $1 AND s.status = 'ACTIVE'`,
      [provisionedSlug],
    );
    assert.equal(snapshot.rowCount, 1);
    assert.equal(snapshot.rows[0].plan_tier, 'BASIC');
    assert.equal(Number(snapshot.rows[0].amount), agreedPrice);
    assert.equal(snapshot.rows[0].billing_interval, 'MONTHLY');
    assert.ok(new Date(snapshot.rows[0].current_period_start) <= new Date());
    assert.ok(new Date(snapshot.rows[0].current_period_end) > new Date(snapshot.rows[0].current_period_start));
    assert.equal(snapshot.rows[0].has_custom_domain, false);
    assert.deepEqual(snapshot.rows[0].active_addons, []);
    assert.equal(snapshot.rows[0].contract_review_required, false);

    await pool.query("UPDATE public.saas_plans SET monthly_price = $1 WHERE code = 'BASIC'", [9999]);
    const unchanged = await pool.query(
      'SELECT amount FROM public.subscriptions WHERE tenant_id = $1 AND status = \'ACTIVE\'',
      [provisionedBody.data.tenantId],
    );
    assert.equal(Number(unchanged.rows[0].amount), agreedPrice);
  } finally {
    await pool.query("UPDATE public.saas_plans SET monthly_price = $1 WHERE code = 'BASIC'", [originalPrice]);
    const tenant = await pool.query('SELECT id FROM public.tenants WHERE slug = $1', [provisionedSlug]);
    if (tenant.rowCount) {
      await pool.query(`DROP SCHEMA IF EXISTS "tenant_${provisionedSlug}" CASCADE`);
      await pool.query('DELETE FROM public.tenants WHERE id = $1', [tenant.rows[0].id]);
    }
  }
});

test('notice snapshots catalog price without changing locked amount and does not send email', async () => {
  const id = await insertContract();
  try {
    await setCatalogPrice(1250);
    const contractResponse = await request(`/crm/tenants/${tenantId}/contract`, { token: crmToken });
    assert.equal(contractResponse.status, 200);
    assert.equal(Number((await contractResponse.json()).data.amount), 1000);
    const response = await post(`/crm/tenants/${tenantId}/contract/renewal-notice`, { recipient: 'tesoreria@qa.dommia.test', noticeSent: true });
    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.success, true);
    assert.equal(Number(body.data.amount), 1000);
    assert.equal(Number(body.data.renewalAmount), 1250);
    assert.equal(body.data.renewalNoticeTo, 'tesoreria@qa.dommia.test');
    assert.match(body.data.suggestedNoticeText, /1,250/);
    assert.equal(body.data.emailSent, false);
    const row = await pool.query('SELECT amount, renewal_amount FROM public.subscriptions WHERE id = $1', [id]);
    assert.equal(Number(row.rows[0].amount), 1000);
    assert.equal(Number(row.rows[0].renewal_amount), 1250);
  } finally {
    await pool.query('DELETE FROM public.subscriptions WHERE id = $1', [id]);
  }
});

test('renewal is blocked before expiry and without a timely price notice', async () => {
  const id = await insertContract();
  try {
    await setCatalogPrice(1250);
    const early = await post(`/crm/tenants/${tenantId}/contract/renew`);
    assert.equal(early.status, 409);
    await pool.query('UPDATE public.subscriptions SET current_period_end = NOW() - INTERVAL \'1 minute\' WHERE id = $1', [id]);
    const overdue = await post(`/crm/tenants/${tenantId}/contract/renew`);
    assert.equal(overdue.status, 409);
  } finally {
    await pool.query('DELETE FROM public.subscriptions WHERE id = $1', [id]);
  }
});

test('renewal creates a successor with the notified snapshot and legacy unknown amount requires reconciliation', async () => {
  const id = await insertContract({ periodEnd: new Date(Date.now() + 86400000) });
  try {
    await setCatalogPrice(1250);
    const blocked = await post(`/crm/tenants/${tenantId}/contract/renew`);
    assert.equal(blocked.status, 409);
    const notice = await post(`/crm/tenants/${tenantId}/contract/renewal-notice`, { recipient: 'tesoreria@qa.dommia.test', noticeSent: true });
    assert.equal(notice.status, 201);
    await pool.query(
      `UPDATE public.subscriptions
       SET current_period_end = NOW() - INTERVAL '1 minute',
           renewal_notice_sent_at = NOW() - INTERVAL '2 minutes'
       WHERE id = $1`,
      [id],
    );
    const state = await pool.query(
      'SELECT id, amount, renewal_amount, renewal_notice_sent_at, current_period_end FROM public.subscriptions WHERE id = $1',
      [id],
    );
    assert.ok(new Date(state.rows[0].renewal_notice_sent_at) < new Date(state.rows[0].current_period_end));
    const renewed = await post(`/crm/tenants/${tenantId}/contract/renew`);
    const body = await renewed.json();
    assert.equal(renewed.status, 201, `${body.message} ${JSON.stringify(state.rows[0])}`);
    assert.equal(Number(body.data.amount), 1250);
    assert.equal(body.data.status, 'ACTIVE');
    assert.equal(body.data.contractReviewRequired, false);
    const old = await pool.query('SELECT status FROM public.subscriptions WHERE id = $1', [id]);
    assert.equal(old.rows[0].status, 'RENEWED');

    const legacyId = await insertContract({ amount: null, periodEnd: new Date(Date.now() - 60000), reviewRequired: true });
    const legacyRenewal = await post(`/crm/tenants/${tenantId}/contract/renew`);
    assert.equal(legacyRenewal.status, 409);
    assert.match((await legacyRenewal.json()).message, /reconciliar/i);
    await pool.query('DELETE FROM public.subscriptions WHERE id = $1', [legacyId]);
  } finally {
    await pool.query("DELETE FROM public.subscriptions WHERE tenant_id = $1 AND plan_tier = 'CONTRACT_QA'", [tenantId]);
    await pool.query("DELETE FROM public.saas_plans WHERE code = 'CONTRACT_QA'");
  }
});

test('CRM annual creation snapshots twelve monthly payments for one year', async () => {
  const currentPlan = await pool.query(
    `SELECT p.monthly_price, p.custom_domain_addon_price, p.includes_custom_domain, t.has_custom_domain
     FROM public.tenants t JOIN public.saas_plans p ON UPPER(p.code) = UPPER(t.tier)
     WHERE t.id = $1 AND p.is_active = true`,
    [tenantId],
  );
  const response = await post(`/crm/tenants/${tenantId}/contract`, { billingInterval: 'ANNUAL' });
  assert.equal(response.status, 201);
  const contract = (await response.json()).data;
  try {
    const plan = currentPlan.rows[0];
    const monthlyAmount = Number(plan.monthly_price)
      + (plan.has_custom_domain && !plan.includes_custom_domain ? Number(plan.custom_domain_addon_price) : 0);
    assert.equal(contract.billingInterval, 'ANNUAL');
    assert.equal(Number(contract.amount), monthlyAmount * 12);
    assert.equal(new Date(contract.currentPeriodEnd).getUTCFullYear(), new Date(contract.currentPeriodStart).getUTCFullYear() + 1);
  } finally {
    if (contract?.id) await pool.query('DELETE FROM public.subscriptions WHERE id = $1', [contract.id]);
  }
});

test('annual notice and renewal use period totals and advance one year', async () => {
  const id = await insertContract({ amount: 12000, billingInterval: 'ANNUAL' });
  try {
    await setCatalogPrice(1250);
    const current = await request(`/crm/tenants/${tenantId}/contract`, { token: crmToken });
    assert.equal(Number((await current.json()).data.catalogRenewalAmount), 15000);
    const notice = await post(`/crm/tenants/${tenantId}/contract/renewal-notice`, {
      recipient: 'tesoreria@qa.dommia.test', noticeSent: true,
    });
    assert.equal(notice.status, 201);
    const noticeBody = (await notice.json()).data;
    assert.equal(Number(noticeBody.renewalAmount), 15000);
    assert.match(noticeBody.suggestedNoticeText, /tarifa anual/);
    await pool.query(
      `UPDATE public.subscriptions
       SET current_period_end = NOW() - INTERVAL '1 minute',
           renewal_notice_sent_at = NOW() - INTERVAL '2 minutes'
       WHERE id = $1`, [id],
    );
    const renewed = await post(`/crm/tenants/${tenantId}/contract/renew`);
    const renewedBody = await renewed.json();
    assert.equal(renewed.status, 201, JSON.stringify(renewedBody));
    const successor = renewedBody.data;
    assert.equal(successor.billingInterval, 'ANNUAL');
    assert.equal(Number(successor.amount), 15000);
    const start = new Date(successor.currentPeriodStart);
    const end = new Date(successor.currentPeriodEnd);
    assert.equal(end.getUTCFullYear(), start.getUTCFullYear() + 1);
    assert.equal(end.getUTCMonth(), start.getUTCMonth());
  } finally {
    await pool.query("DELETE FROM public.subscriptions WHERE tenant_id = $1 AND plan_tier = 'CONTRACT_QA'", [tenantId]);
    await pool.query("DELETE FROM public.saas_plans WHERE code = 'CONTRACT_QA'");
  }
});

test('SMTP failure never registers a notice and accepted delivery cannot be resent', async () => {
  const id = await insertContract({ amount: 12000, billingInterval: 'ANNUAL' });
  const recipient = 'tesoreria@qa.dommia.test';
  const messages = [];
  const database = {
    query: (sql, params) => pool.query(sql, params),
    withTransaction: async (callback) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
  };
  let failDelivery = true;
  const mailer = { sendRenewalNotice: async (...message) => {
    messages.push(message);
    if (failDelivery) throw new Error('SMTP unavailable');
  } };
  const service = new CrmService(new CrmRepository(database), null, mailer);
  try {
    await setCatalogPrice(1250);
    await assert.rejects(service.sendRenewalNotice(tenantId, recipient), /SMTP unavailable/);
    const failed = await pool.query('SELECT renewal_amount, renewal_notice_sent_at FROM public.subscriptions WHERE id = $1', [id]);
    assert.equal(failed.rows[0].renewal_amount, null);
    assert.equal(failed.rows[0].renewal_notice_sent_at, null);

    failDelivery = false;
    const notice = await service.sendRenewalNotice(tenantId, recipient);
    assert.equal(notice.emailSent, true);
    assert.equal(Number(notice.renewalAmount), 15000);
    assert.equal(notice.renewalNoticeTo, recipient);
    assert.equal(messages[1][1].currentAmount, 12000);
    assert.equal(messages[1][1].renewalAmount, 15000);
    assert.equal(messages[1][1].billingInterval, 'ANNUAL');
    await assert.rejects(service.sendRenewalNotice(tenantId, recipient), /ya fue enviado/);
    assert.equal(messages.length, 2);
    const beforePreview = await pool.query('SELECT renewal_amount, renewal_notice_sent_at, renewal_notice_to FROM public.subscriptions WHERE id = $1', [id]);
    const preview = await service.previewRenewalNotice(tenantId, recipient);
    assert.equal(preview.preview, true);
    assert.equal(messages[2][1].preview, true);
    const afterPreview = await pool.query('SELECT renewal_amount, renewal_notice_sent_at, renewal_notice_to FROM public.subscriptions WHERE id = $1', [id]);
    assert.deepEqual(afterPreview.rows, beforePreview.rows);
  } finally {
    await pool.query('DELETE FROM public.subscriptions WHERE id = $1', [id]);
    await pool.query("DELETE FROM public.saas_plans WHERE code = 'CONTRACT_QA'");
  }
});

test('SaaS sender requires configured SMTP and accepts only confirmed recipients', async () => {
  const keys = ['SAAS_SMTP_HOST', 'SAAS_SMTP_PORT', 'SAAS_SMTP_USER', 'SAAS_SMTP_PASSWORD', 'SAAS_SMTP_FROM'];
  const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  const nodemailer = require('nodemailer');
  const createTransport = nodemailer.createTransport;
  const sent = [];
  let acceptRecipient = true;
  const transport = mock.method(nodemailer, 'createTransport', (options) => {
    sent.push({ options });
    return { sendMail: async (message) => {
      sent.push({ message });
      return { accepted: acceptRecipient ? [message.to] : [], rejected: acceptRecipient ? [] : [message.to] };
    } };
  });
  const sender = new SaasMailService();
  const notice = {
    tenantName: 'Residencial <Cumbres & Valle>',
    currentAmount: 12000,
    renewalAmount: 15000,
    billingInterval: 'ANNUAL',
    currentPeriodEnd: new Date('2027-07-23T18:00:00.000Z'),
  };
  try {
    for (const key of keys) delete process.env[key];
    await assert.rejects(sender.sendRenewalNotice('tesoreria@qa.dommia.test', notice), /Configura el SMTP/);
    assert.equal(sent.length, 0);

    Object.assign(process.env, {
      SAAS_SMTP_HOST: 'smtp.porkbun.com',
      SAAS_SMTP_PORT: '587',
      SAAS_SMTP_USER: 'billing@example.test',
      SAAS_SMTP_PASSWORD: 'test-only',
      SAAS_SMTP_FROM: 'billing@example.test',
    });
    await sender.sendRenewalNotice('tesoreria@qa.dommia.test', notice);
    assert.equal(sent[0].options.requireTLS, true);
    assert.equal(sent[0].options.secure, false);
    assert.equal(sent[1].message.to, 'tesoreria@qa.dommia.test');
    assert.equal(sent[1].message.from, 'billing@example.test');
    assert.match(sent[1].message.text, /tarifa anual será de \$15,000\.00 MXN/);
    assert.match(sent[1].message.html, /Residencial &lt;Cumbres &amp; Valle&gt;/);
    assert.match(sent[1].message.html, /\$12,000\.00 MXN/);
    assert.match(sent[1].message.html, /\$15,000\.00 MXN/);
    assert.match(sent[1].message.html, /cid:dommia-logo@dommia/);
    const logo = await readFile(sent[1].message.attachments[0].path);
    assert.equal(logo.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    const serialized = await createTransport({ streamTransport: true, buffer: true }).sendMail(sent[1].message);
    assert.match(serialized.message.toString(), /Content-ID: <dommia-logo@dommia>/);

    process.env.SAAS_SMTP_PORT = '465';
    await sender.sendRenewalNotice('tesoreria@qa.dommia.test', notice);
    assert.equal(sent[2].options.secure, true);
    await sender.sendRenewalNotice('tesoreria@qa.dommia.test', {
      ...notice, currentAmount: 1000, renewalAmount: 1250, billingInterval: 'MONTHLY',
    });
    assert.match(sent[5].message.text, /tarifa mensual será de \$1,250\.00 MXN/);
    assert.match(sent[5].message.html, /Periodicidad:<\/strong> mensual/);
    await sender.sendRenewalNotice('tesoreria@qa.dommia.test', { ...notice, preview: true });
    assert.match(sent[7].message.subject, /^\[Prueba\]/);
    assert.match(sent[7].message.text, /VISTA PREVIA/);
    assert.match(sent[7].message.html, /VISTA PREVIA/);
    acceptRecipient = false;
    await assert.rejects(sender.sendRenewalNotice('tesoreria@qa.dommia.test', notice), /No se pudo entregar/);
  } finally {
    transport.mock.restore();
    for (const key of keys) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  }
});

test('SMTP notice route rejects invalid recipients before contacting a server', async () => {
  const response = await post(`/crm/tenants/${tenantId}/contract/renewal-notice/send`, { recipient: 'not-an-email' });
  assert.equal(response.status, 400);
  const preview = await post(`/crm/tenants/${tenantId}/contract/renewal-notice/preview`, { recipient: 'not-an-email' });
  assert.equal(preview.status, 400);
});