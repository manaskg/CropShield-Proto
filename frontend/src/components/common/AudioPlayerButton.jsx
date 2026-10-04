import React, { useState, useRef } from 'react';
import { Volume2, Pause, Play, Loader2 } from 'lucide-react';
import { aiApi } from '../../api/aiApi';
import { useLanguage } from '../../hooks/useLanguage';

/**
 * Reusable Audio Player Button for generating and listening to Gemini TTS explanations
 */
export const AudioPlayerButton = ({ identification, treatment, weather, className = '' }) => {
  const { language, t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const audioRef = useRef(null);

  const handlePlayAudio = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioUrl && audioRef.current) {
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
      return;
    }

    try {
      setIsLoading(true);
      const langName = language === 'hi' ? 'Hindi' : language === 'bn' ? 'Bengali' : 'English';
      const res = await aiApi.getAudioTTS(identification, treatment, weather, langName);

      if (res?.audioData) {
        setAudioUrl(res.audioData);
        const audio = new Audio(res.audioData);
        audioRef.current = audio;

        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setIsPlaying(false);
          setIsLoading(false);
        };

        await audio.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.warn('[AudioPlayerButton] Audio playback warning:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePlayAudio}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-sm transition-all shadow-xs active:scale-95 disabled:opacity-60 ${className}`}
      title={isPlaying ? 'Pause Audio' : 'Listen to Spoken Explanation'}
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin text-emerald-600" />
      ) : isPlaying ? (
        <Pause size={16} className="text-emerald-700" />
      ) : (
        <Volume2 size={16} className="text-emerald-700" />
      )}
      <span>{isPlaying ? 'Pause' : isLoading ? 'Loading...' : 'Listen (Audio AI)'}</span>
    </button>
  );
};

export default AudioPlayerButton;
