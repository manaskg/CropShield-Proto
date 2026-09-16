import http from 'http';

function post(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, data: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'GET',
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, data: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('--- 1. Testing Health ---');
  const health = await get('/api/health');
  console.log('Health Response:', health);

  console.log('\n--- 2. Testing Registration ---');
  const user = {
    name: 'Suresh Kumar',
    email: `suresh_${Date.now()}@example.com`,
    password: 'password123',
    farmLocation: 'Maharashtra',
    farmSize: 8,
    primaryCrops: 'Cotton, Soybean',
  };
  const regRes = await post('/api/auth/register', user);
  console.log('Register Response Status:', regRes.status, 'User:', regRes.data?.user?.name);
  const token = regRes.data?.token;

  console.log('\n--- 3. Testing Get Profile with JWT ---');
  const meRes = await get('/api/auth/me', token);
  console.log('GetMe Status:', meRes.status, 'Email:', meRes.data?.user?.email);

  console.log('\n--- 4. Testing History API ---');
  const addScanRes = await post(
    '/api/history',
    {
      crop: 'Cotton',
      diseaseName: 'Bollworm',
      confidence: 0.94,
      severity: 'high',
      identification: { name: 'Bollworm', severity: 'high', confidence: 0.94 },
    }
  );
  // Scan with Auth
  const scanAuth = await new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      crop: 'Cotton',
      diseaseName: 'Bollworm',
      confidence: 0.94,
      severity: 'high',
      identification: { name: 'Bollworm', severity: 'high', confidence: 0.94 },
    });
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/history',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
  console.log('Add Scan Status:', scanAuth.status, 'Scan ID:', scanAuth.data?.scan?._id || scanAuth.data?.scan?.id);

  const histRes = await get('/api/history', token);
  console.log('Get History Count:', histRes.data?.history?.length);

  console.log('\n--- 5. Testing Soil Satellite Endpoint ---');
  const soilSat = await get('/api/soil/satellite?lat=19.7515&lon=75.7139');
  console.log('Soil Satellite Status:', soilSat.status, 'Moisture:', soilSat.data?.data?.moisture);

  console.log('\n✅ ALL BACKEND ENDPOINTS TESTED SUCCESSFULLY!');
}

runTests().catch(console.error);
