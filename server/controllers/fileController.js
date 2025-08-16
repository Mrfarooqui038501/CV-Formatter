// server/controllers/fileController.js
import CV from '../models/CV.js';
import { parsePDF, parseDOCX, parseExcel } from '../services/fileParser.js';
import { renderFinalCvDocx, renderRegistrationDocx } from '../services/renderService.js';

// Upload CV file
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const fileType = req.file.mimetype;
    const supported = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword'
    ];
    if (!supported.includes(fileType)) {
      return res.status(400).json({ success: false, message: 'Unsupported file type. Please upload PDF, DOCX, DOC, XLS, or XLSX files.' });
    }

    let content = '';
    if (fileType === 'application/pdf') content = await parsePDF(req.file.buffer);
    else if (fileType.includes('word')) content = await parseDOCX(req.file.buffer);
    else content = await parseExcel(req.file.buffer);

    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'The uploaded file appears to be empty or could not be read.' });
    }

    const cv = await CV.create({
      userId: req.user.id,
      originalFilename: req.file.originalname,
      originalContent: content,
      processingStatus: 'pending',
      fileType,
      fileSize: req.file.size
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      cvId: cv._id,
      filename: cv.originalFilename,
      fileType,
      fileSize: req.file.size,
      contentPreview: content.substring(0, 500)
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during file upload' });
  }
};

// ✅ Get all user files
export const getFiles = async (req, res) => {
  try {
    const cvs = await CV.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: cvs });
  } catch (e) {
    console.error('Get files error:', e);
    res.status(500).json({ success: false, message: 'Failed to fetch files' });
  }
};

// ✅ Get file by ID
export const getFileById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ success: false, message: 'Invalid file ID format' });

    const cv = await CV.findOne({ _id: id, userId: req.user.id });
    if (!cv) return res.status(404).json({ success: false, message: 'CV not found' });

    res.json({ success: true, data: cv });
  } catch (e) {
    console.error('Get file error:', e);
    res.status(500).json({ success: false, message: 'Failed to fetch file' });
  }
};

// ✅ Update file
export const updateFile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ success: false, message: 'Invalid file ID format' });

    const updated = await CV.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { $set: req.body },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: 'CV not found' });
    res.json({ success: true, data: updated });
  } catch (e) {
    console.error('Update file error:', e);
    res.status(500).json({ success: false, message: 'Failed to update file' });
  }
};

// ✅ Delete file
export const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ success: false, message: 'Invalid file ID format' });

    const cv = await CV.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!cv) return res.status(404).json({ success: false, message: 'CV not found' });

    res.json({ success: true, message: 'CV deleted successfully' });
  } catch (e) {
    console.error('Delete error:', e);
    res.status(500).json({ success: false, message: 'Failed to delete CV' });
  }
};

// ✅ Upload headshot (this was missing earlier!)
export const uploadHeadshot = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ success: false, message: 'Invalid file ID format' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });

    const cv = await CV.findOne({ _id: id, userId: req.user.id });
    if (!cv) return res.status(404).json({ success: false, message: 'CV not found' });

    cv.headshot = req.file.buffer;
    await cv.save();

    res.status(200).json({ success: true, message: 'Headshot uploaded' });
  } catch (e) {
    console.error('Headshot upload error:', e);
    res.status(500).json({ success: false, message: 'Failed to upload headshot' });
  }
};

// ✅ Export Final CV
export const exportFinalCv = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ success: false, message: 'Invalid file ID format' });

    const cv = await CV.findOne({ _id: id, userId: req.user.id });
    if (!cv) return res.status(404).json({ success: false, message: 'CV not found' });
    if (!cv.formattedStructured) return res.status(400).json({ success: false, message: 'CV not processed yet' });

    const buffer = await renderFinalCvDocx({
      cv: cv.formattedStructured,
      headshotBuffer: cv.headshot || null
    });

    const clean = cv.originalFilename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${clean}_Client_CV.docx"`);
    res.setHeader('Content-Length', buffer.length);
    return res.end(buffer);
  } catch (e) {
    console.error('Export Final CV error:', e);
    res.status(500).json({ success: false, message: 'Failed to export Final CV' });
  }
};

// ✅ Export Registration Form
export const exportRegistrationForm = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ success: false, message: 'Invalid file ID format' });

    const cv = await CV.findOne({ _id: id, userId: req.user.id });
    if (!cv) return res.status(404).json({ success: false, message: 'CV not found' });
    if (!cv.registrationStructured) return res.status(400).json({ success: false, message: 'Registration data not processed yet' });

    const buffer = await renderRegistrationDocx(cv.registrationStructured);
    const clean = cv.originalFilename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${clean}_Registration_Form.docx"`);
    res.setHeader('Content-Length', buffer.length);
    return res.end(buffer);
  } catch (e) {
    console.error('Export Registration error:', e);
    res.status(500).json({ success: false, message: 'Failed to export Registration Form' });
  }
};
