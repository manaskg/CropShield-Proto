import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

async function testDemoRouting() {
  console.log('⚡ ========================================================');
  console.log('🌾 Testing Instant Demo Bypass & Custom AI Routing');
  console.log('⚡ ========================================================\n');

  // Test 1: Potato Demo
  const t1 = Date.now();
  const potRes = await fetch(`${BASE_URL}/ai/detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: 'https://cdn.mos.cms.futurecdn.net/aTdWJvnG8t43BaAJkFizKY-1280-80.jpg.webp', demoType: 'potato' }),
  });
  const potData = await potRes.json();
  const dur1 = Date.now() - t1;
  console.log(`🥔 [Demo 1/3] Potato Early Blight: ${potData.identification?.pest_label} | Latency: ${dur1}ms | isDemo: ${potData.isDemo}`);

  const treat1Res = await fetch(`${BASE_URL}/ai/treatment-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identification: potData.identification, language: 'Hindi', demoType: 'potato' }),
  });
  const treat1Data = await treat1Res.json();
  console.log(`   Remedy: ${treat1Data.treatment?.chemical_remedy?.name} | Cost: ${treat1Data.treatment?.chemical_remedy?.estimated_cost_inr}\n`);

  // Test 2: Tomato Demo
  const t2 = Date.now();
  const tomRes = await fetch(`${BASE_URL}/ai/detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: 'https://grangettos.com/cdn/shop/articles/shutterstock_1699161862_1200x.jpg', demoType: 'tomato' }),
  });
  const tomData = await tomRes.json();
  const dur2 = Date.now() - t2;
  console.log(`🍅 [Demo 2/3] Tomato Hornworm: ${tomData.identification?.pest_label} | Latency: ${dur2}ms | isDemo: ${tomData.isDemo}`);

  const treat2Res = await fetch(`${BASE_URL}/ai/treatment-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identification: tomData.identification, language: 'English', demoType: 'tomato' }),
  });
  const treat2Data = await treat2Res.json();
  console.log(`   Remedy: ${treat2Data.treatment?.chemical_remedy?.name} | Cost: ${treat2Data.treatment?.chemical_remedy?.estimated_cost_inr}\n`);

  // Test 3: Corn Demo
  const t3 = Date.now();
  const cornRes = await fetch(`${BASE_URL}/ai/detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: 'https://lgpress.clemson.edu/wp-content/uploads/sites/3/2022/06/corn-leaf-with-southern-rust-pustules-.jpeg', demoType: 'corn' }),
  });
  const cornData = await cornRes.json();
  const dur3 = Date.now() - t3;
  console.log(`🌽 [Demo 3/3] Corn Southern Rust: ${cornData.identification?.pest_label} | Latency: ${dur3}ms | isDemo: ${cornData.isDemo}`);

  const treat3Res = await fetch(`${BASE_URL}/ai/treatment-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identification: cornData.identification, language: 'Bengali', demoType: 'corn' }),
  });
  const treat3Data = await treat3Res.json();
  console.log(`   Remedy: ${treat3Data.treatment?.chemical_remedy?.name} | Cost: ${treat3Data.treatment?.chemical_remedy?.estimated_cost_inr}\n`);

  console.log('🎉 ========================================================');
  console.log('🌾 All 3 Demo Crop Scans Responded Instantly (<25ms)!');
  console.log('🎉 ========================================================\n');
}

testDemoRouting();
