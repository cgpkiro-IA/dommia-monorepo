const API = 'http://localhost:4000/api/v1';

const request = async (path, options = {}) => {
  const response = await fetch(`${API}${path}`, options);
  const json = await response.json().catch(() => ({}));
  return { response, json };
};

const verifyAtomicPayment = async () => {
  const login = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@laspalmas.dommia.com.mx',
      password: 'LasPalmas2026!',
      tenantSlug: 'demo',
    }),
  });
  if (!login.json.data?.token) throw new Error('Admin login failed');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${login.json.data.token}`,
  };
  const period = { year: 2035, month: 12, dryRun: false };
  const generated = await request('/tenants/demo/finance/billing/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify(period),
  });
  if (!generated.json.data?.charges?.length) throw new Error('No fixture charge was generated');

  const charge = generated.json.data.charges[0];
  const reference = `ATOMIC-OVERPAY-${Date.now()}`;
  const before = await request(`/tenants/demo/finance/payments?propertyId=${charge.property_id}`);
  const payment = await request('/tenants/demo/finance/payments', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      propertyId: charge.property_id,
      chargeId: charge.id,
      amount: Number(charge.balance_due) + 1,
      paymentMethod: 'CASH',
      reference,
    }),
  });
  const after = await request(`/tenants/demo/finance/payments?propertyId=${charge.property_id}`);
  const persisted = after.json.data?.some((item) => item.reference === reference);
  const countDelta = (after.json.count || 0) - (before.json.count || 0);

  console.log(`OVERPAY_STATUS=${payment.response.status}`);
  console.log(`REFERENCE_PERSISTED=${persisted}`);
  console.log(`COUNT_DELTA=${countDelta}`);

  if (payment.response.status !== 400 || persisted || countDelta !== 0) {
    process.exitCode = 1;
  }
};

verifyAtomicPayment().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
