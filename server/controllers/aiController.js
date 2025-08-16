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

    // Update processing status and save
    cv.processingStatus = 'processing';
    cv.processingError = null; // Clear any previous errors
    await cv.save();
    
    // Run the AI formatting process asynchronously without blocking the response
    (async () => {
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
          default:
            throw new Error(`Unsupported model: ${model}`);
        }

        // Validate formatted content
        if (!result || !result.cvStructured || !result.registrationStructured) {
          throw new Error('AI service returned incomplete data');
        }

        // Update CV with all processed data
        cv.formattedContent = result.formattedContent || JSON.stringify(result.cvStructured, null, 2);
        cv.formattedStructured = result.cvStructured;
        cv.registrationStructured = result.registrationStructured;
        cv.previewHtml = result.previewHtml;
        cv.processingStatus = 'completed';
        cv.processedAt = new Date();
        cv.modelUsed = model;
        cv.processingError = null; // Clear any errors
        await cv.save();

        console.log(`Successfully processed CV ${cvId} with ${model}`);
      } catch (aiError) {
        console.error(`${model} processing error:`, aiError);
        
        // Update CV status to failed
        try {
          cv.processingStatus = 'failed';
          cv.processingError = aiError.message;
          await cv.save();
        } catch (saveError) {
          console.error('Failed to save error status:', saveError);
        }
      }
    })();

    // Send an immediate 202 response to the client
    res.status(202).json({
      success: true,
      message: 'CV processing started',
      data: {
        cvId: cv._id,
        processingStatus: 'processing'
      }
    });

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
    if (!cvId || !cvId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid CV ID format'
      });
    }

    const cv = await CV.findOne({ _id: cvId, userId })
      .select('processingStatus processingError processedAt modelUsed previewHtml formattedContent formattedStructured registrationStructured');

    if (!cv) {
      return res.status(404).json({ 
        success: false,
        message: 'CV not found or access denied' 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        cvId: cv._id,
        processingStatus: cv.processingStatus,
        processingError: cv.processingError,
        processedAt: cv.processedAt,
        modelUsed: cv.modelUsed,
        previewHtml: cv.previewHtml,
        formattedContent: cv.formattedContent,
        formattedStructured: cv.formattedStructured,
        registrationStructured: cv.registrationStructured,
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