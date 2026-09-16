import { ScanHistory } from '../models/ScanHistory.js';

// Fallback in-memory history cache if MongoDB is offline
const fallbackHistory = [];

export const getHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    try {
      const scans = await ScanHistory.find({ userId }).sort({ createdAt: -1 });
      return res.json({ success: true, history: scans });
    } catch (dbErr) {
      const scans = fallbackHistory.filter(s => s.userId === userId);
      return res.json({ success: true, history: scans });
    }
  } catch (error) {
    console.error('[History Controller] Get Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch scan history.' });
  }
};

export const addScan = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { crop, pest, diseaseName, confidence, severity, imagePreview, fullAnalysis } = req.body;
    const finalPest = pest || diseaseName || fullAnalysis?.identification?.name || 'Unknown Pest/Disease';
    const finalCrop = crop || fullAnalysis?.crop || 'Crop';

    if (!finalCrop || !finalPest) {
      return res.status(400).json({ success: false, message: 'Crop and pest information required.' });
    }

    try {
      const scan = await ScanHistory.create({
        userId,
        crop: finalCrop,
        pest: finalPest,
        confidence: confidence || 0.9,
        severity: severity || 'medium',
        imagePreview: imagePreview || '',
        fullAnalysis: fullAnalysis || {},
      });
      return res.status(201).json({ success: true, scan });
    } catch (dbErr) {
      const scan = {
        _id: `scan_${Date.now()}`,
        id: `scan_${Date.now()}`,
        userId,
        crop: finalCrop,
        pest: finalPest,
        confidence: confidence || 0.9,
        severity: severity || 'medium',
        imagePreview: imagePreview || '',
        fullAnalysis: fullAnalysis || {},
        date: new Date().toISOString(),
      };
      fallbackHistory.unshift(scan);
      return res.status(201).json({ success: true, scan });
    }
  } catch (error) {
    console.error('[History Controller] Add Error:', error);
    res.status(500).json({ success: false, message: 'Failed to save scan to history.' });
  }
};

export const deleteScan = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    try {
      await ScanHistory.findOneAndDelete({ _id: id, userId });
      return res.json({ success: true, message: 'Scan removed.' });
    } catch (dbErr) {
      const idx = fallbackHistory.findIndex(s => s.id === id && s.userId === userId);
      if (idx !== -1) fallbackHistory.splice(idx, 1);
      return res.json({ success: true, message: 'Scan removed (Memory).' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete scan.' });
  }
};
