import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import soilRoutes from './routes/soilRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database Connection
connectDB();

// CORS Configuration
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((u) => u.trim())
  : '*';

app.use(cors({
  origin: allowedOrigins === '*' ? '*' : (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive fallback for multi-port dev/demo
    }
  },
  credentials: true,
}));

// Body Parsers with generous limits for high-resolution leaf images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'CropShield AI FullStack Backend',
    timestamp: new Date().toISOString(),
  });
});

// Mount Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/soil', soilRoutes);
app.use('/api/history', historyRoutes);

// Mount Centralized Error Handler Middleware (must be after routes)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`🚀 CropShield Backend Running on Port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=============================================`);
});
