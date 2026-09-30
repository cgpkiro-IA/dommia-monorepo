import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { unlink } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { closeTestPool, pool, prepareGuardQa, request, signTenantToken } from './guard-test-helpers.mjs';

const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1;
const periodStart = `${year}-${String(month).padStart(2, '0')}-01`;
const periodEnd = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
const localEvidenceDirectory = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), '.local', 'financial-evidence');
const incomeFixturePrefix = `QA-MONTHLY-REPORT-${year}-${month}`;
let adminToken;
let guardToken;
let residentToken;
let reportId;
let expenseId;
let evidenceId;
let statementEvidenceId;
let privateEvidenceId;

before(async () => {
  await prepareGuardQa();
  adminToken = await signTenantToken('admin.guard-qa@dommia.test', 'TENANT_ADMIN');
  guardToken = await signTenantToken('guard.norte@qa.dommia.test', 'GUARD');
  const login = await request('/auth/resident/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'ana.rivera@qa.dommia.test', password: 'ResidentQa2026!', tenantSlug: 'guard-qa' }),
  });
  assert.equal(login.status, 200);
  residentToken = (await login.json()).data.token;

  await pool.query('DELETE FROM tenant_guard_qa.financial_expenses WHERE expense_date BETWEEN $1 AND $2', [periodStart, periodEnd]);
  await pool.query('DELETE FROM tenant_guard_qa.financial_monthly_reports WHERE period_start = $1', [periodStart]);
});

after(async () => {
  const evidence = await pool.query(`
    SELECT object_key FROM tenant_guard_qa.financial_report_evidence
    WHERE report_id IN (SELECT id FROM tenant_guard_qa.financial_monthly_reports WHERE period_start = $1)
       OR expense_id IN (SELECT id FROM tenant_guard_qa.financial_expenses WHERE report_id IN (SELECT id FROM tenant_guard_qa.financial_monthly_reports WHERE period_start = $1))
  `, [periodStart]);
  await Promise.all(evidence.rows.map((row) => unlink(join(localEvidenceDirectory, basename(row.object_key))).catch(() => undefined)));
  await pool.query('DELETE FROM tenant_guard_qa.financial_payments WHERE reference LIKE $1', [`${incomeFixturePrefix}-PAYMENT-%`]);
  await pool.query('DELETE FROM tenant_guard_qa.annual_payment_campaigns WHERE name = $1', [incomeFixturePrefix]);
  await pool.query('DELETE FROM tenant_guard_qa.financial_expenses WHERE expense_date BETWEEN $1 AND $2', [periodStart, periodEnd]);
  await pool.query('DELETE FROM tenant_guard_qa.financial_monthly_reports WHERE period_start = $1', [periodStart]);
  await closeTestPool();
});

test('solo TENANT_ADMIN gestiona una rendición y Resident consulta la publicación redactada', async () => {
  const path = '/tenants/guard-qa/finance/monthly-reports';
  assert.equal((await request(path)).status, 401);
  assert.equal((await request(path, { token: guardToken })).status, 403);
  const periodsResponse = await request(path, { token: adminToken });
  assert.equal(periodsResponse.status, 200);
  assert.equal((await periodsResponse.json()).data.some((item) => String(item.period_start).slice(0, 10) === periodStart), true);

  const draftResponse = await request(path, {
    token: adminToken,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ year, month, openingBankBalance: 1000, openingCashBalance: 0 }),
  });
  assert.equal(draftResponse.status, 201);
  reportId = (await draftResponse.json()).data.id;

  const properties = await pool.query('SELECT id FROM tenant_guard_qa.properties ORDER BY id LIMIT 2');
  assert.equal(properties.rowCount, 2, 'Se requieren dos propiedades fixture en guard-qa.');
  const campaign = await pool.query(`
    INSERT INTO tenant_guard_qa.annual_payment_campaigns (name, discount_percentage, months_covered, period_start, period_end, status)
    VALUES ($1, 0, 1, $2, $3, 'APPROVED') RETURNING id
  `, [incomeFixturePrefix, periodStart, periodEnd]);
  for (const [index, paymentMethod, amount] of [[0, 'CASH', 30], [1, 'SPEI_TRANSFER', 40]]) {
    await pool.query(`
      INSERT INTO tenant_guard_qa.annual_payment_commitments (
        campaign_id, property_id, gross_amount, discount_amount, net_amount,
        payment_method, reference, status, reviewed_at
      ) VALUES ($1,$2,$3,0,$3,$4,$5,'APPROVED',$6::date)
    `, [campaign.rows[0].id, properties.rows[index].id, amount, paymentMethod, `${incomeFixturePrefix}-ANNUAL-${index}`, periodStart]);
    await pool.query(`
      INSERT INTO tenant_guard_qa.financial_payments (property_id, amount, payment_method, reference, status, paid_at)
      VALUES ($1,$2,$3,$4,'APPROVED',$5::date)
    `, [properties.rows[index].id, (index + 1) * 10, paymentMethod, `${incomeFixturePrefix}-PAYMENT-${index}`, periodStart]);
  }

  const statementEvidence = await request(`${path}/${reportId}/evidence`, {
    token: adminToken,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: 'estado-bancario-redactado.pdf',
      contentType: 'application/pdf',
      contentBase64: Buffer.from('%PDF-1.4\\nQA').toString('base64'),
      visibility: 'RESIDENTS',
      isRedacted: true,
    }),
  });
  assert.equal(statementEvidence.status, 201);
  statementEvidenceId = (await statementEvidence.json()).data.id;

  const privateStatement = await request(`${path}/${reportId}/evidence`, {
    token: adminToken,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: 'estado-bancario-original.pdf',
      contentType: 'application/pdf',
      contentBase64: Buffer.from('%PDF-1.4\\nQA').toString('base64'),
      visibility: 'ADMIN_ONLY',
      isRedacted: false,
    }),
  });
  assert.equal(privateStatement.status, 201);
  privateEvidenceId = (await privateStatement.json()).data.id;

  const expenseResponse = await request(`${path}/${reportId}/expenses`, {
    token: adminToken,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: 'CLEANING',
      description: 'Limpieza comunal del mes',
      vendorName: 'Servicios QA',
      expenseDate: periodStart,
      amount: 100,
      paymentMethod: 'SPEI_TRANSFER',
      reference: `QA-CLEAN-${year}-${month}`,
    }),
  });
  assert.equal(expenseResponse.status, 201);
  expenseId = (await expenseResponse.json()).data.id;

  const approvalWithoutEvidence = await request(`${path}/expenses/${expenseId}/approve`, {
    token: adminToken,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  assert.equal(approvalWithoutEvidence.status, 400);

  const invalidPublicEvidence = await request(`${path}/expenses/${expenseId}/evidence`, {
    token: adminToken,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: 'factura-sin-redactar.pdf',
      contentType: 'application/pdf',
      contentBase64: Buffer.from('%PDF-1.4\nQA').toString('base64'),
      visibility: 'RESIDENTS',
      isRedacted: false,
    }),
  });
  assert.equal(invalidPublicEvidence.status, 400);

  const evidenceResponse = await request(`${path}/expenses/${expenseId}/evidence`, {
    token: adminToken,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: 'factura-redactada.pdf',
      contentType: 'application/pdf',
      contentBase64: Buffer.from('%PDF-1.4\nQA').toString('base64'),
      visibility: 'RESIDENTS',
      isRedacted: true,
    }),
  });
  assert.equal(evidenceResponse.status, 201);
  evidenceId = (await evidenceResponse.json()).data.id;

  assert.equal((await request(`${path}/expenses/${expenseId}/approve`, {
    token: adminToken,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })).status, 201);

  const publish = await request(`${path}/${reportId}/publish`, {
    token: adminToken,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportedBankBalance: 1000, reportedCashBalance: 0 }),
  });
  assert.equal(publish.status, 201);

  const residentList = await request('/auth/resident/finance/monthly-reports', { token: residentToken });
  assert.equal(residentList.status, 200);
  const reports = (await residentList.json()).data;
  assert.equal(reports.some((report) => report.id === reportId), true);
  const snapshot = reports.find((report) => report.id === reportId).report_snapshot;
  assert.equal(snapshot.reportEvidence.some((item) => item.id === statementEvidenceId), true);
  assert.equal(snapshot.reportEvidence.some((item) => item.id === privateEvidenceId), false);
  assert.deepEqual(snapshot.income.regular.map(({ paymentMethod, count, amount }) => ({ paymentMethod, count, amount })), [
    { paymentMethod: 'CASH', count: 1, amount: 10 },
    { paymentMethod: 'SPEI_TRANSFER', count: 1, amount: 20 },
  ]);
  assert.deepEqual(snapshot.income.annualAdvance.entries.map(({ paymentMethod, count, amount }) => ({ paymentMethod, count, amount })), [
    { paymentMethod: 'CASH', count: 1, amount: 30 },
    { paymentMethod: 'SPEI_TRANSFER', count: 1, amount: 40 },
  ]);

  const residentEvidence = await request(`/auth/resident/finance/monthly-reports/evidence/${evidenceId}/content`, { token: residentToken });
  assert.equal(residentEvidence.status, 200);
  assert.equal(residentEvidence.headers.get('content-type'), 'application/pdf');
  assert.equal((await request(`/auth/resident/finance/monthly-reports/evidence/${statementEvidenceId}/content`, { token: residentToken })).status, 200);
  assert.equal((await request(`/auth/resident/finance/monthly-reports/evidence/${privateEvidenceId}/content`, { token: residentToken })).status, 404);

  const review = await request(`/auth/resident/finance/monthly-reports/${reportId}/review`, { token: residentToken, method: 'POST' });
  assert.equal(review.status, 201);
  assert.equal((await request(`/auth/resident/finance/monthly-reports/${reportId}/review`, { token: residentToken, method: 'POST' })).status, 201);

  const mutatePublished = await request(`${path}/${reportId}/expenses`, {
    token: adminToken,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: 'OTHER', description: 'No permitido', expenseDate: periodStart, amount: 1, paymentMethod: 'CASH',
    }),
  });
  assert.equal(mutatePublished.status, 409);
});
