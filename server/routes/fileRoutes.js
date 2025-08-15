import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  uploadFile,
  getFiles,
  getFileById,
  updateFile,
  deleteFile,
  exportFile
} from '../controllers/fileController.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.route('/')
  .post(protect, upload.single('file'), uploadFile) // This handles file uploads
  .get(protect, getFiles);

router.route('/:id')
  .get(protect, getFileById)
  .put(protect, updateFile)
  .delete(protect, deleteFile);

router.route('/:id/export')
  .get(protect, exportFile);

export default router;