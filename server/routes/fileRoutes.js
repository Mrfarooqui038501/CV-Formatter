// server/routes/fileRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';
import {
  uploadFile,
  getFiles,
  getFileById,
  updateFile,
  deleteFile
} from '../controllers/fileController.js';
import { exportFinalCv, exportRegistrationForm, uploadHeadshot } from '../controllers/fileController.js';

const upload = multer({ storage: multer.memoryStorage() });
const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/image\/(png|jpe?g|webp)/.test(file.mimetype)) return cb(new Error('Only PNG/JPG/WEBP images allowed'));
    cb(null, true);
  }
});

const router = express.Router();

router.route('/')
  .post(protect, upload.single('file'), uploadFile)
  .get(protect, getFiles);

router.route('/:id')
  .get(protect, getFileById)
  .put(protect, updateFile)
  .delete(protect, deleteFile);

router.post('/:id/headshot', protect, photoUpload.single('photo'), uploadHeadshot);

router.get('/:id/export/cv', protect, exportFinalCv);
router.get('/:id/export/registration', protect, exportRegistrationForm);

export default router;
