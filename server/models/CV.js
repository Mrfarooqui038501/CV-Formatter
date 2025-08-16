// server/models/CV.js
import mongoose from 'mongoose';

const cvSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  originalFilename: String,
  originalContent: String,
  formattedContent: String, // (legacy text preview)
  formattedStructured: { type: Object }, // NEW: extracted structured CV JSON
  registrationStructured: { type: Object }, // NEW: extracted Registration JSON
  headshot: { type: Buffer }, // NEW: uploaded headshot image
  processingStatus: { type: String, enum: ['pending','processing','completed','failed'], default: 'pending' },
  processingError: String,
  processedAt: Date,
  modelUsed: String,
  fileType: String,
  fileSize: Number
}, { timestamps: true });

export default mongoose.model('CV', cvSchema);
