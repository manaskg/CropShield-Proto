import { ScanHistory } from '../models/ScanHistory.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

// Fallback in-memory history cache if MongoDB is offline
const fallbackHistory = [];

/**
 * 1. Fetch farmer's scan history
 */
export const getHistory = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  let scans = [];

  try {
    scans = await ScanHistory.find({ userId }).sort({ createdAt: -1 });
  } catch (dbErr) {
    scans = fallbackHistory.filter((s) => s.userId === userId);
  }

  return res.json({ success: true, history: scans });
});

/**
 * 2. Save a new crop scan diagnosis to history
 */
export const addScan = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { crop, pest, diseaseName, confidence, severity, imagePreview, fullAnalysis } = req.body;

  const finalCrop = crop || fullAnalysis?.crop || 'Crop';
  const finalPest = pest || diseaseName || fullAnalysis?.identification?.pest_label || fullAnalysis?.identification?.name || 'Healthy';

  if (!finalCrop || !finalPest) {
    return res.status(400).json({ success: false, message: 'Crop and pest information required.' });
  }

  let scan = null;
  try {
    scan = await ScanHistory.create({
      userId,
      crop: finalCrop,
      pest: finalPest,
      confidence: confidence || 0.9,
      severity: severity || 'medium',
      imagePreview: imagePreview || '',
      fullAnalysis: fullAnalysis || {},
    });
  } catch (dbErr) {
    scan = {
      _id: `scan_${Date.now()}`,
      id: `scan_${Date.now()}`,
      userId,
      crop: finalCrop,
      pest: finalPest,
      confidence: confidence || 0.9,
      severity: severity || 'medium',
      imagePreview: imagePreview || '',
      fullAnalysis: fullAnalysis || {},
      createdAt: new Date().toISOString(),
    };
    fallbackHistory.unshift(scan);
  }

  return res.status(201).json({ success: true, scan });
});

/**
 * 3. Delete a scan record from history
 */
export const deleteScan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    await ScanHistory.findOneAndDelete({ _id: id, userId });
  } catch (dbErr) {
    const idx = fallbackHistory.findIndex((s) => (s.id === id || s._id === id) && s.userId === userId);
    if (idx !== -1) fallbackHistory.splice(idx, 1);
  }

  return res.json({ success: true, message: 'Scan removed successfully.' });
});
