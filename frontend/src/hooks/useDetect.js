import { useState, useRef } from 'react';
import { aiApi } from '../api/aiApi';
import { fetchWeather } from './useWeather';
import { useAuth } from './useAuth';
import { useLanguage } from './useLanguage';

export const useDetect = () => {
  const { isAuthenticated, addToHistory } = useAuth();
  const { language, t } = useLanguage();

  const [image, setImage] = useState(null);
  const [demoType, setDemoType] = useState(null);
  const [status, setStatus] = useState('IDLE');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) {
      setError(t('detect.error.img'));
      return;
    }
    setDemoType(null); // Custom user upload -> Live Gemini
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
      resetState();
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDemoSelect = async (e) => {
    const url = e.target.value;
    if (!url) {
      setDemoType(null);
      return;
    }

    // Determine demo category
    let type = 'potato';
    if (url.includes('shutterstock_1699161862') || url.includes('tomato') || url.includes('Hornworm')) {
      type = 'tomato';
    } else if (url.includes('corn') || url.includes('clemson.edu') || url.includes('Rust')) {
      type = 'corn';
    } else if (url.includes('potato') || url.includes('aTdWJvnG') || url.includes('Blight')) {
      type = 'potato';
    }
    setDemoType(type);

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        resetState();
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      setError('Demo sample failed to load.');
    }
  };

  const resetState = () => {
    setStatus('IDLE');
    setResult(null);
    setError(null);
  };

  const getFullLanguageName = (langCode) => {
    switch (langCode) {
      case 'hi': return 'Hindi';
      case 'bn': return 'Bengali';
      default: return 'English';
    }
  };

  const analyzeImage = async () => {
    if (!image) return;

    try {
      setStatus('ANALYZING_IMAGE');
      setError(null);

      // Fetch weather in background while calling detection
      const weatherPromise = fetchWeather(language);

      // Step 1: Detect Crop & Pest via Backend AI route (passes demoType for instant response)
      const detectRes = await aiApi.detectCrop(image, demoType);
      const identification = detectRes.identification;

      if (!identification || identification.pest_label?.toLowerCase() === 'unknown' || identification.confidence < 0.4) {
        setError(t('detect.error.id'));
        setStatus('ERROR');
        return;
      }

      // Step 2: Treatment plan
      setStatus('GENERATING_PLAN');
      const weatherData = await weatherPromise;

      const treatRes = await aiApi.getTreatmentPlan(
        identification,
        weatherData,
        getFullLanguageName(language),
        demoType
      );

      const analysisResult = {
        identification,
        treatment: treatRes.treatment,
        weather: weatherData,
      };

      setResult(analysisResult);
      setStatus('SUCCESS');

      // Auto-save to history
      if (isAuthenticated) {
        addToHistory({
          crop: identification.crop,
          pest: identification.pest_label,
          confidence: identification.confidence,
          severity: treatRes.treatment.severity,
          imagePreview: image,
          fullAnalysis: analysisResult,
        });
      }

      // Smooth scroll to results
      setTimeout(() => {
        const target = document.getElementById('analysis-results');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);

    } catch (err) {
      console.error('Detection error:', err);
      setError(err?.message || 'Analysis failed. Please check backend connection.');
      setStatus('ERROR');
    }
  };

  return {
    image,
    setImage,
    status,
    result,
    error,
    isDragging,
    setIsDragging,
    fileInputRef,
    cameraInputRef,
    handleFileChange,
    handleDemoSelect,
    processFile,
    resetState,
    analyzeImage,
  };
};
