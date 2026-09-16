import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Mic, MicOff, X, PhoneOff, MessageCircle, Minimize2, Sparkles, Sprout } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

function encode(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data, ctx, sampleRate, numChannels) {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const UniversalAgent = () => {
  const { language, t } = useLanguage();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState(null);
  const [agentState, setAgentState] = useState('idle');

  const audioContextRef = useRef(null);
  const inputSourceRef = useRef(null);
  const processorRef = useRef(null);
  const streamRef = useRef(null);
  const nextStartTimeRef = useRef(0);
  const scheduledSourcesRef = useRef(new Set());
  const sessionPromiseRef = useRef(null);
  
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(0);
  const analyserRef = useRef(null);

  const getLanguageName = () => {
    if (language === 'hi') return 'Hindi';
    if (language === 'bn') return 'Bengali';
    return 'English';
  };

  const stopAudio = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (inputSourceRef.current) {
      inputSourceRef.current.disconnect();
      inputSourceRef.current = null;
    }
    scheduledSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    scheduledSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setIsConnected(false);
    setAgentState('idle');
  }, []);

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!analyserRef.current) return;
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;

      const radius = 30 + (average / 3);
      const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.5, centerX, centerY, radius * 2);
      
      if (agentState === 'speaking') {
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.8)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
      ctx.fillStyle = agentState === 'speaking' ? '#10b981' : '#ffffff';
      ctx.fill();
    };
    draw();
  };

  const startSession = async () => {
    try {
      setError(null);
      const apiKey = import.meta.env?.VITE_GEMINI_API_KEY || process.env?.API_KEY || process.env?.GEMINI_API_KEY;
      if (!apiKey) throw new Error('API Key missing');

      const ai = new GoogleGenAI({ apiKey });
      const outCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outCtx;
      analyserRef.current = outCtx.createAnalyser();
      analyserRef.current.fftSize = 256;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            if (!streamRef.current) return;
            setIsConnected(true);
            setAgentState('listening');

            const inputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            const source = inputCtx.createMediaStreamSource(streamRef.current);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            inputSourceRef.current = source;
            processorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              if (isMuted) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32767;
              }
              const pcmData = new Uint8Array(int16.buffer);
              
              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({
                  media: {
                    mimeType: 'audio/pcm;rate=16000',
                    data: encode(pcmData),
                  },
                });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            drawVisualizer();
          },
          onmessage: async (msg) => {
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              setAgentState('speaking');
              const pcmData = decode(base64Audio);
              const audioBuffer = await decodeAudioData(pcmData, audioContextRef.current, 24000, 1);
              
              const source = audioContextRef.current.createBufferSource();
              source.buffer = audioBuffer;
              
              if (analyserRef.current) {
                source.connect(analyserRef.current);
                analyserRef.current.connect(audioContextRef.current.destination);
              } else {
                source.connect(audioContextRef.current.destination);
              }

              const now = audioContextRef.current.currentTime;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              
              scheduledSourcesRef.current.add(source);
              source.onended = () => {
                scheduledSourcesRef.current.delete(source);
                if (scheduledSourcesRef.current.size === 0) {
                  setAgentState('listening');
                }
              };
            }

            if (msg.serverContent?.interrupted) {
              scheduledSourcesRef.current.forEach(s => {
                try { s.stop(); } catch (e) {}
              });
              scheduledSourcesRef.current.clear();
              if (audioContextRef.current) nextStartTimeRef.current = audioContextRef.current.currentTime;
              setAgentState('listening');
            }
          },
          onclose: () => stopAudio(),
          onerror: (err) => {
            console.error('Universal agent error:', err);
            setError('Connection lost.');
            stopAudio();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: `You are 'Kisan Mitra AI', an enthusiastic Indian Agricultural Expert on CropShield. You speak in ${getLanguageName()}. Be concise, friendly, and practical (1-2 sentences).`,
        },
      });

      sessionPromiseRef.current = sessionPromise;
    } catch (e) {
      console.error(e);
      setError('Could not connect to voice agent.');
      setIsConnected(false);
    }
  };

  useEffect(() => {
    if (isOpen) startSession();
    else stopAudio();
    return () => stopAudio();
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-3 border-2 border-white/20 group"
      >
        <div className="relative">
          <Sparkles className="w-6 h-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-300"></span>
          </span>
        </div>
        <span className="font-bold pr-2 hidden sm:inline">Ask Kisan AI</span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isExpanded ? 'w-80 h-96' : 'w-72 h-20'}`}>
      <div className="w-full h-full bg-stone-900/90 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-white/5 flex justify-between items-center border-b border-white/5">
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-white">Kisan Mitra Live</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 text-white/60 hover:text-white">
              <Minimize2 size={16} />
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1 text-white/60 hover:text-red-400">
              <X size={16} />
            </button>
          </div>
        </div>

        {isExpanded ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <canvas ref={canvasRef} width={128} height={128} className="w-full h-full" />
              <div className="absolute flex flex-col items-center pointer-events-none">
                <span className="text-xs font-bold text-white capitalize">{agentState}</span>
                <span className="text-[10px] text-emerald-400 font-semibold">{getLanguageName()}</span>
              </div>
            </div>

            {error && <p className="text-xs text-red-400 text-center mt-2">{error}</p>}

            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-2xl transition-all ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'}`}
              >
                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold flex items-center gap-2 text-sm shadow-lg shadow-red-500/30"
              >
                <PhoneOff size={16} /> End
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-between px-4">
            <span className="text-xs text-emerald-400 font-bold capitalize">Live • {agentState}</span>
            <button onClick={() => setIsExpanded(true)} className="text-xs text-white underline">Expand</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UniversalAgent;
