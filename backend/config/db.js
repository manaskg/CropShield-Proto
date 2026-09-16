import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cropshield';
    const conn = await mongoose.connect(uri);
    console.log(`[MongoDB Atlas] Connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`[MongoDB] Connection Warning: ${error.message}`);
    console.warn('[MongoDB] Server will use in-memory store if MongoDB is offline.');
    return false;
  }
};

