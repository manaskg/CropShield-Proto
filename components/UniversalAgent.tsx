
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, X, PhoneOff, MessageCircle, Minimize2, Sparkles, Sprout } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Helper functions for Audio Processing
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

const UniversalAgent: React.FC = () => {
  const { language, t } = useLanguage();
  
  // UI State
  const [isOpen, setIsOpen] = useState(false); // Is the widget visible/active?
  const [isExpanded, setIsExpanded] = useState(true); // Is it maximized or minimized pill?
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentState, setAgentState] = useState<'idle' | 'listening' | 'speaking'>('idle');

  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  
  // Visualizer Refs
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
      
      // Calculate energy
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;

      // Dynamic Aura
      const radius = 30 + (average / 3); // Base radius + reaction
      const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.5, centerX, centerY, radius * 2);
      
      if (agentState === 'speaking') {
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.8)'); // Emerald
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
      } else {
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)'); // White idle
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
      ctx.fillStyle = agentState === 'speaking' ? '#10b981' : '#ffffff';
      ctx.fill();
      
      // Particles for visual flair
      if (average > 10) {
        for (let i = 0; i < 8; i++) {
           const angle = (Date.now() / 1000) + (i * (Math.PI * 2) / 8);
           const dist = radius + 10;
           const px = centerX + Math.cos(angle) * dist;
           const py = centerY + Math.sin(angle) * dist;
           ctx.beginPath();
           ctx.arc(px, py, 2, 0, Math.PI * 2);
           ctx.fillStyle = 'rgba(255,255,255,0.6)';
           ctx.fill();
        }
      }
    };
    draw();
  };

  const startSession = async () => {
    try {
      setError(null);
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key missing");

      const ai = new GoogleGenAI({ apiKey });
      
      // Output Audio Context
      const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
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

            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const source = inputCtx.createMediaStreamSource(streamRef.current);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            inputSourceRef.current = source;
            processorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              if (isMuted) return;
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Simple VAD visualization logic for local user
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += Math.abs(inputData[i]);
              if (sum/inputData.length > 0.01) setAgentState('listening');

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
              setAgentState('speaking');
              const ctx = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(analyserRef.current!);
              analyserRef.current!.connect(ctx.destination);
              source.onended = () => {
                 scheduledSourcesRef.current.delete(source);
                 if (scheduledSourcesRef.current.size === 0) setAgentState('listening');
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              scheduledSourcesRef.current.add(source);
            }

            if (msg.serverContent?.interrupted) {
              scheduledSourcesRef.current.forEach(s => { try { s.stop(); } catch (e) {} });
              scheduledSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setAgentState('listening');
            }
          },
          onclose: () => {
              setIsConnected(false);
              setAgentState('idle');
          },
          onerror: (e) => setError("Connection failed.")
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { 
            // 'Kore' is a good, calm, friendly voice for a universal assistant
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } 
          },
          systemInstruction: `
          You are 'Kisan Mitra' (Farmer's Friend), a universal agricultural expert voice assistant.
          
          YOUR PERSONA:
          - You are friendly, talkative, and highly knowledgeable about farming in India.
          - You treat the farmer like a close friend or brother. 
          - You are patient and explain things in detail. Don't be brief; give tips, tricks, and context.
          
          YOUR KNOWLEDGE BASE:
          - General farming advice (crops, soil, water).
          - Market trends and prices (Mandi rates).
          - Weather impacts on agriculture.
          - Government schemes for farmers.
          - Pest and disease management (general advice).
          
          RULES:
          1. LANGUAGE: Speak ONLY in ${getLanguageName()}. This is mandatory.
          2. TONE: Warm, encouraging, respectful. Use phrases like "My dear friend", "Listen brother", "Don't worry".
          3. SCOPE: Answer any agriculture-related question. If asked about non-agri topics, politely steer back to farming.
          `
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (e) {
      setError("Microphone access denied.");
      console.error(e);
    }
  };

  const handleToggle = () => {
      if (isOpen) {
          // Close
          setIsOpen(false);
          stopAudio();
      } else {
          // Open
          setIsOpen(true);
          setIsExpanded(true);
          startSession();
      }
  };

  // If closed, show the FAB
  if (!isOpen) {
      return (
          <button 
            onClick={handleToggle}
            className="fixed bottom-6 right-6 z-50 group flex items-center gap-2 pr-6 pl-2 py-2 bg-stone-900 text-white rounded-full shadow-2xl shadow-emerald-900/40 hover:scale-105 transition-all duration-300 border border-emerald-500/30"
          >
              <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-white opacity-20 rounded-full animate-ping"></div>
                  <MessageCircle size={24} className="relative z-10" />
              </div>
              <div className="text-left">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Ask AI</div>
                  <div className="text-sm font-bold leading-none">Kisan Mitra</div>
              </div>
          </button>
      );
  }

  // Expanded/Minimized Window
  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isExpanded ? 'w-[350px] h-[500px]' : 'w-[300px] h-[80px]'} bg-stone-900/95 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col`}>
        
        {/* Header (Visible in both states) */}
        <div className={`flex items-center justify-between px-6 py-4 ${isExpanded ? 'border-b border-white/5' : 'h-full'}`}>
             <div className="flex items-center gap-3">
                 <div className={`w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shrink-0 ${isConnected ? 'animate-pulse' : ''}`}>
                     <Sprout size={20} className="text-white" />
                 </div>
                 <div>
                     <h3 className="font-bold text-white leading-tight">Kisan Mitra</h3>
                     <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">{isConnected ? 'Online' : 'Connecting...'}</p>
                 </div>
             </div>
             
             <div className="flex items-center gap-2">
                 {isExpanded ? (
                     <button onClick={() => setIsExpanded(false)} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                         <Minimize2 size={18} />
                     </button>
                 ) : (
                     <button onClick={() => setIsExpanded(true)} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                         <MessageCircle size={18} />
                     </button>
                 )}
                 <button onClick={handleToggle} className="p-2 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors">
                     <X size={18} />
                 </button>
             </div>
        </div>

        {/* Main Body (Only when expanded) */}
        {isExpanded && (
            <div className="flex-1 flex flex-col relative">
                {/* Visualizer Area */}
                <div className="flex-1 relative flex items-center justify-center bg-black/20">
                    <canvas ref={canvasRef} width={300} height={300} className="absolute inset-0 w-full h-full opacity-60" />
                    
                    {/* Status Text Overlay */}
                    <div className="relative z-10 text-center space-y-2 pointer-events-none">
                        <div className={`text-2xl font-black transition-colors duration-300 ${agentState === 'speaking' ? 'text-emerald-400' : 'text-stone-500'}`}>
                            {agentState === 'speaking' ? 'Speaking...' : agentState === 'listening' ? 'Listening...' : 'Connecting...'}
                        </div>
                        <div className="text-xs text-stone-400 font-medium px-8">
                            Ask me about crops, weather, or prices in {getLanguageName()}.
                        </div>
                    </div>
                </div>

                {/* Controls Area */}
                <div className="p-6 bg-stone-900/50">
                    {error && <div className="mb-4 text-center text-red-400 text-xs bg-red-900/20 py-2 rounded-lg">{error}</div>}

                    <div className="flex items-center justify-center gap-6">
                        <button 
                            onClick={() => setIsMuted(!isMuted)} 
                            className={`p-4 rounded-full transition-all duration-300 border ${isMuted ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                        >
                            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                        </button>
                        
                        <button 
                            onClick={handleToggle} 
                            className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold shadow-lg shadow-red-600/30 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <PhoneOff size={20} />
                            <span>End Chat</span>
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default UniversalAgent;
