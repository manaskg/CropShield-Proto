
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, X, PhoneOff, Loader2, Volume2, Maximize2, Minimize2 } from 'lucide-react';
import { AnalysisResult } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface LiveFarmerAgentProps {
  isOpen: boolean;
  onClose: () => void;
  analysisData: AnalysisResult;
}

// Guideline-compliant manual encode/decode
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
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

const LiveFarmerAgent: React.FC<LiveFarmerAgentProps> = ({ isOpen, onClose, analysisData }) => {
  const { language, t } = useLanguage();
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);

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
      ctx.fillStyle = `rgba(16, 185, 129, ${0.1 + (average / 255)})`;
      ctx.fill();

      for (let i = 0; i < bufferLength; i++) {
        const angle = (i / bufferLength) * Math.PI * 2;
        const h = (dataArray[i] / 255) * 30;
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
      const apiKey = process.env.API_KEY;
      const ai = new GoogleGenAI({ apiKey: apiKey! });
      
      const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outCtx;
      analyserRef.current = outCtx.createAnalyser();
      analyserRef.current.fftSize = 64;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Prepare rich context for the AI
      const contextData = `
      CROP: ${analysisData.identification.crop}
      DIAGNOSIS: ${analysisData.treatment.pest_name_local} (${analysisData.treatment.pest_name})
      SEVERITY: ${analysisData.treatment.severity}
      
      ORGANIC REMEDY (Home): ${analysisData.treatment.organic_remedy}
      
      CHEMICAL REMEDY (Market):
      - Name: ${analysisData.treatment.chemical_remedy.name}
      - Dosage: ${analysisData.treatment.chemical_remedy.dosage_ml_per_litre}
      - Frequency: ${analysisData.treatment.chemical_remedy.frequency_days}
      - Cost: ${analysisData.treatment.chemical_remedy.estimated_cost_inr}
      
      SAFETY: ${analysisData.treatment.safety}
      
      WEATHER CONDITIONS:
      - Temp: ${analysisData.weather?.temperature}°C
      - Condition: ${analysisData.weather?.condition}
      - Advice: ${analysisData.treatment.weather_advice}
      `;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            if (!streamRef.current) return;
            setIsConnected(true);
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const source = inputCtx.createMediaStreamSource(streamRef.current);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            inputSourceRef.current = source;
            processorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              if (isMuted) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const base64 = encode(new Uint8Array(int16.buffer));
              sessionPromise.then(s => s.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            drawVisualizer();
          },
          onmessage: async (msg: LiveServerMessage) => {
            const base64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64 && audioContextRef.current) {
              const ctx = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(analyserRef.current!);
              analyserRef.current!.connect(ctx.destination);
              source.onended = () => scheduledSourcesRef.current.delete(source);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              scheduledSourcesRef.current.add(source);
            }
            if (msg.serverContent?.interrupted) {
              scheduledSourcesRef.current.forEach(s => { try { s.stop(); } catch (e) {} });
              scheduledSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => setIsConnected(false),
          onerror: (e) => setError("Connection failed.")
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { 
            // 'Fenrir' is typically a deeper, warmer male voice
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } 
          },
          systemInstruction: `
          You are 'Kisan Mitra', a friendly, wise, and practical 'Big Brother' figure to the farmer.
          
          PERSONA:
          - Voice: Warm, manly, encouraging, and detailed.
          - Vibe: Like a knowledgeable village elder holding the farmer's hand.
          - Detail Level: High. Don't give short answers. Explain *how* and *why*.
          
          STRICT RULES:
          1. **Language**: Speak ONLY in ${getLanguageName()}.
          2. **Scope**: Answer ONLY questions related to agriculture, the specific crop, pest, weather, or market. If asked about politics, movies, or other topics, politely decline and steer back to farming.
          3. **No Hallucinations**: Stick strictly to the diagnosis and remedies provided in the CONTEXT DATA below. Do not invent new pests or chemicals.
          4. **Empathy**: Always be reassuring. Tell them the crop can be saved.
          
          CONTEXT DATA (Use this for all answers):
          ${contextData}
          `
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (e) {
      setError("Microphone access denied.");
    }
  };

  useEffect(() => { if (isOpen) startSession(); else stopAudio(); return () => stopAudio(); }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div id="live-expert-widget" className={`fixed bottom-6 right-6 z-[60] transition-all duration-500 ease-in-out transform ${isExpanded ? 'w-80 h-[480px]' : 'w-16 h-16'} flex flex-col shadow-2xl rounded-[2rem] overflow-hidden border border-white/20 bg-stone-900/95 backdrop-blur-xl`}>
        
        {/* Minimized State Button */}
        {!isExpanded && (
            <button onClick={() => setIsExpanded(true)} className="w-full h-full flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 transition-colors relative group">
                <div className="absolute inset-0 rounded-full bg-emerald-500 opacity-20 animate-ping"></div>
                <Volume2 className="text-white relative z-10" size={24} />
            </button>
        )}

        {/* Expanded State */}
        {isExpanded && (
            <div className="flex flex-col h-full animate-fade-in">
                {/* Header */}
                <div className="p-4 flex justify-between items-center bg-white/5 border-b border-white/5">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-xs font-bold text-white uppercase tracking-widest">{t('result.live_expert')}</span>
                     </div>
                     <div className="flex gap-1">
                        <button onClick={() => setIsExpanded(false)} className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                            <Minimize2 size={14}/>
                        </button>
                        <button onClick={onClose} className="p-1.5 rounded-full text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                            <X size={14}/>
                        </button>
                     </div>
                </div>

                <div className="flex-1 flex flex-col p-6 relative">
                    <div className="flex-1 relative flex items-center justify-center">
                        <canvas ref={canvasRef} width={200} height={200} className="w-full h-full opacity-60 absolute inset-0" />
                        <div className="relative z-10 flex flex-col items-center">
                             <div className={`w-24 h-24 rounded-full border-4 ${isConnected ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'border-stone-700'} overflow-hidden bg-stone-800 transition-all duration-500`}>
                                <img src="https://img.freepik.com/free-vector/farmer-mascot-logo-design-vector_10308-46.jpg" alt="Expert" className="w-full h-full object-cover" />
                             </div>
                             <h3 className="mt-4 text-lg font-bold text-white">Kisan Mitra</h3>
                             <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">{getLanguageName()}</p>
                        </div>
                    </div>

                    {error && <div className="text-red-400 text-xs text-center mt-2 bg-red-900/20 py-1 rounded-lg">{error}</div>}

                    <div className="flex items-center justify-center gap-4 mt-6">
                        <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/10 text-white border border-white/10 hover:bg-white/20'}`}>
                            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                        <button onClick={onClose} className="px-6 py-3 bg-red-600 rounded-full text-white shadow-lg shadow-red-600/20 hover:bg-red-500 active:scale-95 transition-all flex items-center gap-2">
                            <PhoneOff size={18} fill="currentColor" />
                            <span className="font-bold text-xs uppercase tracking-wide">End Call</span>
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default LiveFarmerAgent;
