import { useState } from 'react';
import { soilApi } from '../api/soilApi';
import { useLanguage } from './useLanguage';

export const useSoilLab = () => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('satellite'); // 'satellite' | 'vision' | 'ocr' | 'manual'
  const [loading, setLoading] = useState(false);
  const [satelliteData, setSatelliteData] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const getFullLanguageName = (langCode) => {
    switch (langCode) {
      case 'hi': return 'Hindi';
      case 'bn': return 'Bengali';
      default: return 'English';
    }
  };

  const fetchSatelliteInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            const res = await soilApi.fetchSatelliteData(latitude, longitude);
            if (res.data) {
              setSatelliteData(res.data);
            }
            setLoading(false);
          },
          async () => {
            // Default coords if permission denied
            const res = await soilApi.fetchSatelliteData(28.6139, 77.2090);
            if (res.data) setSatelliteData(res.data);
            setLoading(false);
          }
        );
      } else {
        const res = await soilApi.fetchSatelliteData(28.6139, 77.2090);
        if (res.data) setSatelliteData(res.data);
        setLoading(false);
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch satellite soil data.');
      setLoading(false);
    }
  };

  const analyzeSoilData = async (mode, customData = null) => {
    setLoading(true);
    setError(null);
    try {
      const payload = customData || (mode === 'satellite' ? satelliteData : uploadedImage);
      const res = await soilApi.analyzeSoil(mode, payload, getFullLanguageName(language));
      if (res.result) {
        setReport(res.result);
      }
    } catch (err) {
      setError(err?.message || 'Soil analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    loading,
    satelliteData,
    uploadedImage,
    setUploadedImage,
    report,
    error,
    fetchSatelliteInfo,
    analyzeSoilData,
  };
};
