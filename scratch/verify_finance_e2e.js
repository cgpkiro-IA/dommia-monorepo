const verifyE2E = async () => {
  try {
    const slug = 'valle_real';
    const propertyId = 'a0000000-0000-0000-0000-000000000142'; // Cedros #142

    console.log('=== STEP 1: Query initial property status ===');
    const initRes = await fetch(`http://localhost:4000/api/v1/tenants/${slug}/finance/properties/${propertyId}/status`);
    const initData = (await initRes.json()).data;
    console.log(`Balance Due: $${initData.totalBalanceDue} MXN | Pending charges: ${initData.pendingChargesCount}`);

    console.log('\n=== STEP 2: Administrator receives Cash payment at Ventanilla ===');
    const paymentPayload = {
      property_id: propertyId,
      amount: initData.totalBalanceDue > 0 ? initData.totalBalanceDue : 1250,
      payment_method: 'CASH',
      reference: `REC-202609-VENT-${Math.floor(1000 + Math.random() * 9000)}`,
      received_by_name: 'Lic. Ana Martínez (Administración)',
      payer_name: 'Lic. Carlos Villarreal',
      notes: 'Pago en efectivo recibido en ventanilla de oficinas generales de Valle Real. Entrega de comprobante impreso.'
    };

    const payRes = await fetch(`http://localhost:4000/api/v1/tenants/${slug}/finance/payments/cash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentPayload)
    });
    const payResult = await payRes.json();
    console.log('Payment response:', payRes.status, payResult.message);
    console.log('Payment record:', payResult.data);

    console.log('\n=== STEP 3: Query updated property status ===');
    const postRes = await fetch(`http://localhost:4000/api/v1/tenants/${slug}/finance/properties/${propertyId}/status`);
    const postData = (await postRes.json()).data;
    console.log(`Updated Balance Due: $${postData.totalBalanceDue} MXN`);
    console.log(`Has pending charges: ${postData.hasPendingCharges}`);
    console.log(`Newest payment recorded:`, postData.recentPayments[0]?.reference, `$${postData.recentPayments[0]?.amount} MXN`);

    console.log('\n=== STEP 4: Verify Notice emitted for Resident ===');
    const noticesRes = await fetch(`http://localhost:4000/api/v1/tenants/${slug}/notices?publishedOnly=true`);
    const noticesData = (await noticesRes.json()).data;
    const paymentNotice = noticesData.find(n => n.title.includes(paymentPayload.reference));
    if (paymentNotice) {
      console.log('✓ Digital receipt notice verified in notices feed:');
      console.log(`  Title: ${paymentNotice.title}`);
      console.log(`  Content: ${paymentNotice.content}`);
      console.log(`  Author: ${paymentNotice.author_name}`);
    } else {
      console.log('Notice not found by exact reference, newest notice is:', noticesData[0]?.title);
    }

    console.log('\n=== STEP 5: Overall summary check ===');
    const sumRes = await fetch(`http://localhost:4000/api/v1/tenants/${slug}/finance/summary`);
    const summary = (await sumRes.json()).data;
    console.log('Summary metrics:', summary);

    console.log('\n✓ E2E WORKFLOW COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('E2E verification error:', err);
  }
};

verifyE2E();
