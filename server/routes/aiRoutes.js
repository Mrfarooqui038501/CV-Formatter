import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { processCV } from '../controllers/aiController.js';

const router = express.Router();

router.post('/process', protect, processCV);

export default router;