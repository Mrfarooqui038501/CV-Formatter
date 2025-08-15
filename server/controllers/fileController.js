import CV from '../models/CV.js';
import { parsePDF, parseDOCX, parseExcel } from '../services/fileParser.js';
import { generateDOCX } from '../services/docGenerator.js';

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded' 
      });
    }

    let content;
    const fileType = req.file.mimetype;

    // Validate file type first
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword' // Added support for .doc files
    ];

    if (!supportedTypes.includes(fileType)) {
      return res.status(400).json({ 
        success: false,
        message: 'Unsupported file type. Please upload PDF, DOCX, DOC, XLS, or XLSX files.' 
      });
    }

    // Parse file based on type
    try {
      if (fileType === 'application/pdf') {
        content = await parsePDF(req.file.buffer);
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileType === 'application/msword') {
        content = await parseDOCX(req.file.buffer);
      } else if (fileType === 'application/vnd.ms-excel' || fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        content = await parseExcel(req.file.buffer);
      }
    } catch (parseError) {
      console.error('File parsing error:', parseError);
      return res.status(400).json({ 
        success: false,
        message: 'Failed to parse the uploaded file. Please ensure the file is not corrupted.' 
      });
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'The uploaded file appears to be empty or could not be read.' 
      });
    }

    const cv = new CV({
      userId: req.user.id,
      originalFilename: req.file.originalname,
      originalContent: content,
      processingStatus: 'pending',
      fileType: fileType,
      fileSize: req.file.size
    });

    await cv.save();

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      cvId: cv._id,
      filename: cv.originalFilename,
      fileType: fileType,
      fileSize: req.file.size,
      contentPreview: content.substring(0, 500) // Return first 500 chars for preview
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during file upload'
    });
  }
};

export const getFiles = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const cvs = await CV.find({ userId: req.user.id })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-originalContent -formattedContent'); // Exclude large content fields

    const total = await CV.countDocuments({ userId: req.user.id });

    return res.status(200).json({
      success: true,
      count: cvs.length,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: cvs
    });
  } catch (error) {
    console.error('Get files error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve files'
    });
  }
};

export const getFileById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file ID format'
      });
    }

    const cv = await CV.findOne({ 
      _id: id, 
      userId: req.user.id 
    });

    if (!cv) {
      return res.status(404).json({
        success: false,
        message: 'CV not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: cv
    });
  } catch (error) {
    console.error('Get file error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve file'
    });
  }
};

export const updateFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { formattedContent } = req.body;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file ID format'
      });
    }

    if (!formattedContent || formattedContent.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Formatted content is required and cannot be empty'
      });
    }

    const cv = await CV.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { 
        formattedContent: formattedContent.trim(),
        updatedAt: new Date(),
        processingStatus: 'completed'
      },
      { new: true, runValidators: true }
    );

    if (!cv) {
      return res.status(404).json({
        success: false,
        message: 'CV not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'CV updated successfully',
      data: cv
    });
  } catch (error) {
    console.error('Update error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update CV'
    });
  }
};

export const deleteFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file ID format'
      });
    }

    const cv = await CV.findOneAndDelete({ 
      _id: id, 
      userId: req.user.id 
    });

    if (!cv) {
      return res.status(404).json({
        success: false,
        message: 'CV not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'CV deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete CV'
    });
  }
};

export const exportFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file ID format'
      });
    }

    const cv = await CV.findOne({ 
      _id: id, 
      userId: req.user.id 
    });

    if (!cv) {
      return res.status(404).json({
        success: false,
        message: 'CV not found'
      });
    }

    const contentToExport = cv.formattedContent || cv.originalContent;
    
    if (!contentToExport || contentToExport.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No content available for export'
      });
    }

    try {
      const buffer = await generateDOCX(contentToExport);
      
      // Clean filename for export
      const cleanFilename = cv.originalFilename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}_formatted.docx"`);
      res.setHeader('Content-Length', buffer.length);
      
      return res.end(buffer);
    } catch (generateError) {
      console.error('Document generation error:', generateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate document for export'
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to export file'
    });
  }
};