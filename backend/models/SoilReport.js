import mongoose from 'mongoose';

const soilReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  source: {
    type: String,
    enum: ['satellite', 'vision', 'ocr', 'manual'],
    required: true,
  },
  soilType: {
    type: String,
    required: true,
  },
  phLevel: {
    type: String,
  },
  organicCarbon: {
    type: String,
  },
  moisture: {
    type: String,
  },
  deficiencies: [{
    type: String,
  }],
  recommendations: [{
    type: String,
  }],
  suitableCrops: [{
    type: String,
  }],
}, {
  timestamps: true,
});

export const SoilReport = mongoose.model('SoilReport', soilReportSchema);
