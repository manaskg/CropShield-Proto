import { useState, useRef, useCallback, useEffect } from 'react';
import { aiApi } from '../api/aiApi';
import { useLanguage } from './useLanguage';

/**
 * Custom hook to manage conversational AI voice interaction,
 * speech recognition (Web Speech API), and audio synthesis playback.
 *
 * @param {object} options
 * @param {string} [options.voiceName='Kore'] - Gemini TTS prebuilt voice
 * @param {object} [options.defaultContext={}] - Default context payload for the AI
 * @param {boolean} [options.autoWelcome=false] - Whether to speak a greeting upon mount
 * @param {string} [options.welcomeMessage] - Custom greeting message
 */
export function useVoiceAgent(options = {}) {
  const {
    voiceName = 'Kore',
    defaultContext = {},
    autoWelcome = false,
    welcomeMessage = '',
  } = options;

  const { language } = useLanguage();

  const [status, setStatus] = useState('idle'); // 'idle' | 'listening' | 'thinking' | 'speaking'
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const isSpeakingRef = useRef(false);

  // Map app language code to BCP-47 locale
  const getLangLocale = useCallback(() => {
    if (language === 'hi') return 'hi-IN';
    if (language === 'bn') return 'bn-IN';
    return 'en-IN';
  }, [language]);

  // Language name string for LLM prompts
  const getLangName = useCallback(() => {
    if (language === 'hi') return 'Hindi';
    if (language === 'bn') return 'Bengali';
    return 'English';
  }, [language]);

  /**
   * Browser SpeechSynthesis fallback
   */
  const speakWithBrowserTTS = useCallback((text) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLangLocale();
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setStatus('speaking');
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
      setStatus('idle');
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      setStatus('idle');
    };

    window.speechSynthesis.speak(utterance);
  }, [isMuted, getLangLocale]);

  /**
   * Play generated base64 / WAV audio URL with SpeechSynthesis fallback
   */
  const playAudio = useCallback((audioUrl, fallbackText = '') => {
    if (isMuted) return;

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }

    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;
      setStatus('speaking');
      isSpeakingRef.current = true;

      audio.onplay = () => setStatus('speaking');
      audio.onended = () => {
        setStatus('idle');
        isSpeakingRef.current = false;
      };
      audio.onerror = () => {
        setStatus('idle');
        isSpeakingRef.current = false;
        if (fallbackText) speakWithBrowserTTS(fallbackText);
      };
      audio.play().catch(() => {
        if (fallbackText) speakWithBrowserTTS(fallbackText);
      });
    } else if (fallbackText) {
      speakWithBrowserTTS(fallbackText);
    }
  }, [isMuted, speakWithBrowserTTS]);

  /**
   * Send question to backend Voice Advisor endpoint
   */
  const askAgent = useCallback(async (questionText, customContext = {}) => {
    if (!questionText?.trim()) return;

    setStatus('thinking');
    setError(null);
    setTranscript(questionText);

    try {
      const mergedContext = { ...defaultContext, ...customContext };
      const response = await aiApi.askVoice(
        questionText,
        mergedContext,
        getLangName(),
        voiceName
      );

      const aiText = response?.text || (
        language === 'hi'
          ? 'फसल की नियमित निगरानी रखें और संतुलित पोषण दें।'
          : 'Inspect your crops regularly and maintain balanced nutrition.'
      );

      setReply(aiText);

      if (response?.audioUrl) {
        playAudio(response.audioUrl, aiText);
      } else {
        speakWithBrowserTTS(aiText);
      }
      return response;
    } catch (err) {
      console.warn('[useVoiceAgent] Voice advice fallback:', err.message);
      const fallback = language === 'hi'
        ? 'मैं आपकी फसल और मिट्टी की देखभाल के लिए यहाँ हूँ। कृपया अपना प्रश्न पूछें।'
        : 'I am here to assist with your crop and soil advisory. How can I help?';
      setReply(fallback);
      speakWithBrowserTTS(fallback);
      return { text: fallback, audioUrl: '' };
    }
  }, [defaultContext, getLangName, language, playAudio, speakWithBrowserTTS, voiceName]);

  /**
   * Start microphone listening via Web Speech Recognition
   */
  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError(
        language === 'hi'
          ? 'ब्राउज़र में ध्वनि पहचान समर्थित नहीं है। आप नीचे टाइप कर सकते हैं।'
          : 'Speech recognition is not supported in this browser. Please type your query.'
      );
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
    }

    const recognition = new SpeechRecognition();
    recognition.lang = getLangLocale();
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setStatus('listening');
      setError(null);
    };

    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;
      setTranscript(text);
      if (event.results[current].isFinal) {
        askAgent(text);
      }
    };

    recognition.onerror = (e) => {
      if (e.error === 'network') {
        setError(language === 'hi' ? 'इंटरनेट धीमा है। आप नीचे प्रश्न टाइप कर सकते हैं।' : 'Voice recognition offline (network). You can type below.');
      } else if (e.error === 'not-allowed') {
        setError(language === 'hi' ? 'कृपया माइक्रोफ़ोन अनुमति दें या नीचे लिखें।' : 'Microphone permission needed. You can type below.');
      }
      if (!isSpeakingRef.current) {
        setStatus('idle');
      }
    };

    recognition.onend = () => {
      if (!isSpeakingRef.current && status === 'listening') {
        setStatus('idle');
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      console.warn('[useVoiceAgent] Recognition start notice:', err.message);
    }
  }, [askAgent, getLangLocale, language, status]);

  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }
    if (status === 'listening') {
      setStatus('idle');
    }
  }, [status]);

  /**
   * Cleanly stop all active audio playback and recognition
   */
  const stopAll = useCallback(() => {
    stopListening();
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;
    setStatus('idle');
  }, [stopListening]);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        if (audioPlayerRef.current) audioPlayerRef.current.pause();
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        setStatus('idle');
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (autoWelcome && welcomeMessage) {
      setReply(welcomeMessage);
      speakWithBrowserTTS(welcomeMessage);
    }
    return () => stopAll();
  }, [autoWelcome, welcomeMessage, speakWithBrowserTTS, stopAll]);

  return {
    status,
    transcript,
    reply,
    error,
    isMuted,
    setTranscript,
    setReply,
    setError,
    askAgent,
    startListening,
    stopListening,
    playAudio,
    stopAll,
    toggleMute,
  };
}

export default useVoiceAgent;
