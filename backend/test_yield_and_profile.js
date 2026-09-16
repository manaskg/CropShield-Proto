import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

function request(options, data) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.setHeader('Content-Type', 'application/json');
      req.setHeader('Content-Length', Buffer.byteLength(postData));
      req.write(postData);
    }
    req.end();
  });
}

async function testYieldAndProfile() {
  console.log('--- Testing 1: Smart Farm Yield Optimization API ---');
  const yieldRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ai/yield-plan',
      method: 'POST',
    },
    {
      crop: 'Wheat',
      acres: '5',
      season: 'Rabi',
      language: 'English',
    }
  );
  console.log('Yield Plan Status:', yieldRes.status);
  console.log('Expected Yield:', yieldRes.data?.plan?.expectedYield || yieldRes.data?.yieldPlan?.expectedYield);
  console.log('Timeline stages:', (yieldRes.data?.plan?.timeline || yieldRes.data?.yieldPlan?.timeline)?.length);

  console.log('\n--- Testing 2: Register User & Save Profile Picture to MongoDB Atlas ---');
  const uniqueEmail = `farmer_${Date.now()}@atlas.com`;
  const regRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
    },
    {
      name: 'Rohan Sharma',
      email: uniqueEmail,
      password: 'password123',
      farmLocation: 'Haryana',
      farmSize: 7,
      primaryCrops: 'Mustard, Wheat',
    }
  );
  console.log('Register Status:', regRes.status, 'User ID:', regRes.data?.user?.id);
  const token = regRes.data?.token;

  console.log('\n--- Testing 3: Upload Profile Picture (PUT /api/auth/profile) ---');
  const mockImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const updateRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/profile',
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    {
      profileImage: mockImage,
      farmLocation: 'Haryana (Updated)',
    }
  );
  console.log('Profile Update Status:', updateRes.status, 'Message:', updateRes.data?.message);
  console.log('Profile Image Stored in MongoDB:', updateRes.data?.user?.profileImage?.substring(0, 30) + '...');

  console.log('\n--- Testing 4: Refresh Profile (GET /api/auth/me) to verify DB persistence ---');
  const meRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  console.log('GetMe Status:', meRes.status);
  console.log('Fetched Profile Image from MongoDB:', meRes.data?.user?.profileImage?.substring(0, 30) + '...');
  console.log('Fetched Location from MongoDB:', meRes.data?.user?.farmLocation);

  if (meRes.data?.user?.profileImage === mockImage) {
    console.log('\n✅ VERIFIED: Profile picture is 100% saved in MongoDB Atlas and persists on refresh!');
  } else {
    console.error('\n❌ Profile picture did not match stored value.');
  }
}

testYieldAndProfile().catch(console.error);
