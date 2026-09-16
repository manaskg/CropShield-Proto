import mongoose from 'mongoose';

const scanHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  crop: {
    type: String,
    required: true,
  },
  pest: {
    type: String,
    required: true,
  },
  confidence: {
    type: Number,
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'Low', 'Medium', 'High', 'Healthy'],
    default: 'medium',
  },
  imagePreview: {
    type: String, // Base64 or URL
    default: '',
  },
  fullAnalysis: {
    identification: {
      type: Object,
    },
    treatment: {
      type: Object,
    },
    weather: {
      type: Object,
    },
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export const ScanHistory = mongoose.model('ScanHistory', scanHistorySchema);
