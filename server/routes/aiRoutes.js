import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { processCV, getProcessingStatus } from '../controllers/aiController.js';

const router = express.Router();

// Process CV route
router.post('/process', protect, processCV);

// Get processing status route
router.get('/status/:cvId', protect, getProcessingStatus);

export default router;