import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Mic, MicOff, X, PhoneOff, Loader2, Volume2, Maximize2, Minimize2 } from 'lucide-react';
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

const LiveFarmerAgent = ({ isOpen, onClose, analysisData }) => {
  const { language, t } = useLanguage();
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState(null);
  
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
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20 + (average / 4), 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(16, 185, 129, ${0.4 + (average / 255)})`;
      ctx.fill();

      for (let i = 0; i < bufferLength; i++) {
        const angle = (i / bufferLength) * Math.PI * 2;
        const h = dataArray[i] / 2;
        const x = centerX + Math.cos(angle) * (25 + h);
        const y = centerY + Math.sin(angle) * (25 + h);
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
        ctx.fill();
      }
    };
    draw();
  };

  const startSession = async () => {
    try {
      setError(null);
      const apiKey = import.meta.env?.VITE_GEMINI_API_KEY || process.env?.API_KEY || process.env?.GEMINI_API_KEY;
      if (!apiKey) throw new Error('Gemini API key is required');
      const ai = new GoogleGenAI({ apiKey });
      
      const outCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outCtx;
      analyserRef.current = outCtx.createAnalyser();
      analyserRef.current.fftSize = 64;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const contextData = `
      CROP: ${analysisData?.identification?.crop || 'Crop'}
      DIAGNOSIS: ${analysisData?.treatment?.pest_name_local || analysisData?.treatment?.pest_name || 'Healthy Crop'}
      SEVERITY: ${analysisData?.treatment?.severity || 'Normal'}
      ORGANIC REMEDY: ${analysisData?.treatment?.organic_remedy || 'Maintain good watering and organic compost'}
      CHEMICAL REMEDY: ${analysisData?.treatment?.chemical_remedy?.name || 'None required'} (${analysisData?.treatment?.chemical_remedy?.dosage_ml_per_litre || ''})
      `;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            if (!streamRef.current) return;
            setIsConnected(true);

            const inCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            inputSourceRef.current = inCtx.createMediaStreamSource(streamRef.current);
            processorRef.current = inCtx.createScriptProcessor(4096, 1, 1);
            
            processorRef.current.onaudioprocess = (e) => {
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
                    data: encode(pcmData)
                  }
                });
              });
            };

            inputSourceRef.current.connect(processorRef.current);
            processorRef.current.connect(inCtx.destination);
            drawVisualizer();
          },
          onmessage: async (msg) => {
            const base64 = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64 && audioContextRef.current) {
              const pcm = decode(base64);
              const audioBuffer = await decodeAudioData(pcm, audioContextRef.current, 24000, 1);
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
              source.onended = () => scheduledSourcesRef.current.delete(source);
            }

            if (msg.serverContent?.interrupted) {
              scheduledSourcesRef.current.forEach(s => {
                try { s.stop(); } catch (e) {}
              });
              scheduledSourcesRef.current.clear();
              if (audioContextRef.current) nextStartTimeRef.current = audioContextRef.current.currentTime;
            }
          },
          onclose: () => stopAudio(),
          onerror: (err) => {
            console.error('Session error', err);
            setError('Connection issue. Retrying...');
            stopAudio();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } }
          },
          systemInstruction: `You are 'Kisan Mitra', a respectful, caring, and wise Indian agricultural doctor. The farmer is looking at their crop diagnosis. Speak ONLY in ${getLanguageName()}. Give polite, reassuring, direct 1-3 sentence guidance. CONTEXT: ${contextData}`
        }
      });
      sessionPromiseRef.current = sessionPromise;

    } catch (e) {
      console.error(e);
      setError(e.message || 'Could not connect to microphone.');
      setIsConnected(false);
    }
  };

  useEffect(() => {
    if (isOpen) startSession();
    else stopAudio();
    return () => stopAudio();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-[60] transition-all duration-500 transform ${isExpanded ? 'w-80 h-[420px]' : 'w-20 h-20'} flex flex-col`}>
      <div className="relative flex-1 bg-stone-900/90 backdrop-blur-xl rounded-[2.5rem] border border-white/20 shadow-2xl overflow-hidden flex flex-col group">
        
        {/* Header/Toggle Bar */}
        <div className="p-4 flex justify-between items-center bg-white/5">
          <div className={`flex items-center gap-3 transition-opacity ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-bold text-white uppercase tracking-wider">Expert Live</span>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10">
              {isExpanded ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-full text-white/60 hover:text-red-400 hover:bg-red-500/10">
              <X size={16}/>
            </button>
          </div>
        </div>

        {isExpanded ? (
          <div className="flex-1 flex flex-col p-6 animate-fade-in">
            <div className="flex-1 relative flex items-center justify-center">
              <canvas ref={canvasRef} width={200} height={200} className="w-full h-full opacity-60" />
              <div className="absolute flex flex-col items-center">
                <div className={`w-24 h-24 rounded-full border-4 ${isConnected ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-stone-700'} overflow-hidden bg-stone-800 transition-all`}>
                  <img src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=60" alt="Expert" className="w-full h-full object-cover" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-white">Kisan Sahayak</h3>
                <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">{getLanguageName()}</p>
              </div>
            </div>

            {error && <p className="text-center text-xs text-red-400 mb-2">{error}</p>}

            <div className="mt-6 flex items-center justify-center gap-4">
              <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-2xl transition-all ${isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}>
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button onClick={onClose} className="px-8 py-4 bg-red-500 rounded-2xl text-white shadow-lg shadow-red-500/30 hover:bg-red-600 active:scale-95 transition-all flex items-center gap-2">
                <PhoneOff size={20} fill="currentColor" />
                <span className="font-bold">End Call</span>
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setIsExpanded(true)} className="absolute inset-0 flex items-center justify-center animate-pulse">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/40">
              <Volume2 size={24} />
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default LiveFarmerAgent;
