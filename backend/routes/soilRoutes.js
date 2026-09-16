import express from 'express';
import { getSatelliteSoil, analyzeSoil } from '../controllers/soilController.js';
import { optionalAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/satellite', getSatelliteSoil);
router.post('/analyze', optionalAuth, analyzeSoil);

export default router;
