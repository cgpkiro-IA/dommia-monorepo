const testFinance = async () => {
  try {
    console.log('--- 1. Testing Health ---');
    const healthRes = await fetch('http://localhost:4000/api/v1/health');
    console.log('Health:', healthRes.status, await healthRes.json());

    console.log('\n--- 2. Testing Charges for Valle Real ---');
    const chargesRes = await fetch('http://localhost:4000/api/v1/tenants/valle_real/finance/charges');
    const charges = await chargesRes.json();
    console.log('Charges status:', chargesRes.status, 'Total charges found:', charges.data?.length || 0);

    console.log('\n--- 3. Testing Generate Billing (Dry Run) ---');
    const dryRunRes = await fetch('http://localhost:4000/api/v1/tenants/valle_real/finance/billing/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        year: 2026,
        month: 9,
        dryRun: true
      })
    });
    console.log('DryRun status:', dryRunRes.status, await dryRunRes.json());

    console.log('\n--- 4. Testing Generate Billing (Actual) ---');
    const genRes = await fetch('http://localhost:4000/api/v1/tenants/valle_real/finance/billing/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        year: 2026,
        month: 9,
        dryRun: false
      })
    });
    console.log('Gen status:', genRes.status, await genRes.json());

    console.log('\n--- 5. Testing Property Financial Status (Cedros #142) ---');
    const propStatusRes = await fetch('http://localhost:4000/api/v1/tenants/valle_real/finance/properties/a0000000-0000-0000-0000-000000000142/status');
    const propStatus = await propStatusRes.json();
    console.log('Property status:', propStatusRes.status, JSON.stringify(propStatus, null, 2));

  } catch (err) {
    console.error('Test error:', err);
  }
};

testFinance();
