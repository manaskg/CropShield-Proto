import mongoose from 'mongoose';
import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

async function testDatabases() {
  console.log('Testing MongoDB Atlas connection...');
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Atlas connected to cluster host:', conn.connection.host);
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('✅ Existing collections:', collections.map(c => c.name));
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ MongoDB Atlas Error:', err.message);
  }

  console.log('\nTesting Redis Cloud connection...');
  try {
    const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1, connectTimeout: 5000 });
    await redis.set('cropshield:test_key', 'live_connection_successful', 'EX', 60);
    const val = await redis.get('cropshield:test_key');
    console.log('✅ Redis Cloud read/write success! Value:', val);
    await redis.quit();
  } catch (err) {
    console.log('Retrying with rediss:// (TLS)...');
    try {
      const tlsUrl = process.env.REDIS_URL.replace('redis://', 'rediss://');
      const redisTLS = new Redis(tlsUrl, { maxRetriesPerRequest: 1, connectTimeout: 5000 });
      await redisTLS.set('cropshield:test_key', 'live_connection_successful', 'EX', 60);
      const val = await redisTLS.get('cropshield:test_key');
      console.log('✅ Redis Cloud (TLS) read/write success! Value:', val);
      await redisTLS.quit();
    } catch (tlsErr) {
      console.error('❌ Redis Cloud Error:', tlsErr.message);
    }
  }
}

testDatabases();
