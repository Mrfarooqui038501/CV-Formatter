// server/routes/aiRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { processCV, getProcessingStatus } from '../controllers/aiController.js';

const router = express.Router();

router.post('/process', protect, processCV);
router.get('/status/:cvId', protect, getProcessingStatus);

export default router;
