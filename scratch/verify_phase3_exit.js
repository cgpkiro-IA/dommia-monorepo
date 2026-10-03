const API = 'http://localhost:4000/api/v1';

const request = async (path, options = {}) => {
  const response = await fetch(`${API}${path}`, options);
  const json = await response.json().catch(() => ({}));
  return { response, json };
};

const run = async () => {
  const noToken = await request('/tenants/demo/finance/billing/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ year: 2036, month: 1, dryRun: true }),
  });
  if (noToken.response.status !== 401) throw new Error(`Expected 401 without token, got ${noToken.response.status}`);

  const login = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@laspalmas.dommia.com.mx', password: 'LasPalmas2026!', tenantSlug: 'demo' }),
  });
  if (!login.json.data?.token) throw new Error('Admin login failed');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${login.json.data.token}` };

  const generated = await request('/tenants/demo/finance/billing/generate', {
    method: 'POST', headers, body: JSON.stringify({ year: 2036, month: 1, dryRun: false }),
  });
  let charge = generated.json.data?.charges?.[0];
  if (!charge) {
    const existing = await request('/tenants/demo/finance/charges?year=2036&month=1');
    charge = existing.json.data?.find((item) => ['PENDING', 'PARTIAL'].includes(item.status));
  }
  if (!charge) throw new Error('No fixture charge generated');
  const reference = `PHASE3-OVERPAY-${Date.now()}`;
  const before = await request(`/tenants/demo/finance/payments?propertyId=${charge.property_id}`);
  const overpay = await request('/tenants/demo/finance/payments', {
    method: 'POST', headers,
    body: JSON.stringify({ propertyId: charge.property_id, chargeId: charge.id, amount: Number(charge.balance_due) + 1, paymentMethod: 'CASH', reference }),
  });
  const after = await request(`/tenants/demo/finance/payments?propertyId=${charge.property_id}`);
  if (overpay.response.status !== 400 || after.json.data.some((payment) => payment.reference === reference) || after.json.data.length !== before.json.data.length) {
    throw new Error('Payment rollback assertion failed');
  }

  const campaign = await request('/tenants/demo/finance/annual-campaigns', {
    method: 'POST', headers,
    body: JSON.stringify({ name: `Phase 3 Exit ${Date.now()}`, discountPercentage: 10, monthsCovered: 12, periodStart: '2037-01-01', periodEnd: '2037-12-31' }),
  });
  const quote = await request(`/tenants/demo/finance/annual-campaigns/${campaign.json.data.id}/quote`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ propertyId: charge.property_id }),
  });
  const submitted = await request(`/tenants/demo/finance/annual-campaigns/${campaign.json.data.id}/submissions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ propertyId: charge.property_id, amount: quote.json.data.netAmount, reference: `PHASE3-ANNUAL-${Date.now()}`, receiptUrl: 'data:application/pdf;base64,JVBERi0xLjQK' }),
  });
  const review = await request(`/tenants/demo/finance/annual-commitments/${submitted.json.data.commitment.id}/review`, {
    method: 'PATCH', headers, body: JSON.stringify({ status: 'APPROVED', reviewedByName: 'Phase 3 Test' }),
  });
  const commitments = await request(`/tenants/demo/finance/annual-campaigns/${campaign.json.data.id}/commitments`);
  const approved = commitments.json.data.find((item) => item.id === review.json.data.id);
  if (review.response.status !== 200 || approved.status !== 'APPROVED' || approved.allocation_count !== 12 || !approved.ledger_recorded) {
    throw new Error('Annual ledger/allocation assertion failed');
  }

  console.log('PHASE3_GUARD=PASS');
  console.log('PHASE3_ROLLBACK=PASS');
  console.log('PHASE3_ANNUAL_LEDGER=PASS');
};

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});