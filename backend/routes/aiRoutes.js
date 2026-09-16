import express from 'express';
import {
  detectCropPest,
  generateTreatment,
  generateAudioTTS,
  generateYieldOptimization,
  askQuestion,
} from '../controllers/aiController.js';
import { upload } from '../middlewares/uploadMiddleware.js';
import { optionalAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Detection route supports multipart upload or base64 JSON payload
router.post('/detect', upload.single('image'), detectCropPest);
router.post('/treatment-plan', generateTreatment);
router.post('/audio-tts', generateAudioTTS);
router.post('/yield-plan', generateYieldOptimization);
router.post('/ask', askQuestion);

export default router;
