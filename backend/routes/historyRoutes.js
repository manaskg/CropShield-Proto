import express from 'express';
import { getHistory, addScan, deleteScan } from '../controllers/historyController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(requireAuth); // Protect all history endpoints

router.get('/', getHistory);
router.post('/', addScan);
router.delete('/:id', deleteScan);

export default router;
