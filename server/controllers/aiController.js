// server/controllers/aiController.js
import CV from '../models/CV.js';
import { formatWithGPT4, formatWithClaude, formatWithGemini } from '../services/aiService.js';

export const processCV = async (req, res, next) => {
  try {
    const { cvId, model } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!cvId || !model) {
      return res.status(400).json({ 
        success: false,
        message: 'CV ID and model are required' 
      });
    }

    // Validate ObjectId format
    if (!cvId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid CV ID format'
      });
    }

    // Validate model selection
    const supportedModels = ['gpt4', 'claude', 'gemini'];
    if (!supportedModels.includes(model)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid model selected. Supported models: ' + supportedModels.join(', ')
      });
    }

    const cv = await CV.findOne({ _id: cvId, userId });
    if (!cv) {
      return res.status(404).json({ 
        success: false,
        message: 'CV not found' 
      });
    }

    // Check if CV has content to process
    if (!cv.originalContent || cv.originalContent.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'CV has no content to process' 
      });
    }

    // Update processing status
    cv.processingStatus = 'processing';
    await cv.save();

    let result;
    try {
      console.log(`Processing CV ${cvId} with ${model}...`);
      
      switch (model) {
        case 'gpt4':
          result = await formatWithGPT4(cv.originalContent);
          break;
        case 'claude':
          result = await formatWithClaude(cv.originalContent);
          break;
        case 'gemini':
          result = await formatWithGemini(cv.originalContent);
          break;
      }

      // Validate formatted content
      if (!result || !result.cvStructured || !result.registrationStructured) {
        throw new Error('AI service returned incomplete data');
      }

      // Update CV with all processed data
      cv.formattedContent = result.formattedContent || JSON.stringify(result.cvStructured, null, 2);
      cv.formattedStructured = result.cvStructured;
      cv.registrationStructured = result.registrationStructured;
      cv.processingStatus = 'completed';
      cv.processedAt = new Date();
      cv.modelUsed = model;
      await cv.save();

      console.log(`Successfully processed CV ${cvId} with ${model}`);

      res.status(200).json({
        success: true,
        message: 'CV processed successfully',
        data: {
          cvId: cv._id,
          modelUsed: model,
          formattedContent: cv.formattedContent,
          previewHtml: result.previewHtml || '',
          processedAt: cv.processedAt,
          cvStructured: result.cvStructured,
          registrationStructured: result.registrationStructured
        }
      });
    } catch (aiError) {
      console.error(`${model} processing error:`, aiError);
      
      // Update CV status to failed
      cv.processingStatus = 'failed';
      cv.processingError = aiError.message;
      await cv.save();

      return res.status(500).json({
        success: false,
        message: `Failed to process CV with ${model}. ${aiError.message}`,
        error: aiError.message
      });
    }
  } catch (error) {
    console.error('Process CV error:', error);
    
    // Try to update CV status if cvId is available
    if (req.body.cvId) {
      try {
        await CV.findOneAndUpdate(
          { _id: req.body.cvId, userId: req.user?.id },
          { 
            processingStatus: 'failed',
            processingError: error.message 
          }
        );
      } catch (updateError) {
        console.error('Failed to update CV status:', updateError);
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error during CV processing'
    });
  }
};

// Get processing status
export const getProcessingStatus = async (req, res, next) => {
  try {
    const { cvId } = req.params;
    const userId = req.user.id;

    // Validate ObjectId format
    if (!cvId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid CV ID format'
      });
    }

    const cv = await CV.findOne({ _id: cvId, userId })
      .select('processingStatus processingError processedAt modelUsed');

    if (!cv) {
      return res.status(404).json({ 
        success: false,
        message: 'CV not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        cvId: cv._id,
        processingStatus: cv.processingStatus,
        processingError: cv.processingError,
        processedAt: cv.processedAt,
        modelUsed: cv.modelUsed
      }
    });
  } catch (error) {
    console.error('Get processing status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get processing status'
    });
  }
};