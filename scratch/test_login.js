const testLogin = async () => {
  try {
    console.log('--- Testing Resident App Login ---');
    const res = await fetch('http://localhost:4000/api/v1/auth/app/resident/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'carlos.mendoza@gmail.com',
        password: 'Residente2026!',
        tenantSlug: 'demo',
        clientType: 'ANDROID'
      })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Login test error:', err);
  }
};

testLogin();
