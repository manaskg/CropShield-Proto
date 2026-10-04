import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  X,
  PhoneOff,
  Minimize2,
  Sparkles,
  Volume2,
  Bot,
  User,
  Send,
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useVoiceAgent } from '../hooks/useVoiceAgent';

/**
 * Diagnosis-Specific Live Crop Doctor Voice Modal Agent
 */
const LiveFarmerAgent = ({ isOpen, onClose, analysisData }) => {
  const { language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(true);
  const [inputText, setInputText] = useState('');

  const crop = analysisData?.identification?.crop || 'Crop';
  const pest = analysisData?.identification?.pest_label || analysisData?.treatment?.pest_name || 'Plant Health Issue';
  const organic = analysisData?.treatment?.organic_remedy || '';
  const chemical = analysisData?.treatment?.chemical_remedy?.name || '';

  const {
    status,
    transcript,
    reply,
    error,
    isMuted,
    setTranscript,
    askAgent,
    startListening,
    stopListening,
    toggleMute,
    stopAll,
  } = useVoiceAgent({
    voiceName: 'Fenrir',
    defaultContext: {
      crop,
      pest,
      organic_remedy: organic,
      chemical_remedy: chemical,
      role: 'Agricultural Doctor assisting farmer with diagnosed crop',
    },
  });

  useEffect(() => {
    if (isOpen) {
      askAgent(`Introduce yourself as crop doctor for ${crop} affected by ${pest} in 1 polite sentence.`);
    } else {
      stopAll();
    }
  }, [isOpen, crop, pest, askAgent, stopAll]);

  if (!isOpen) return null;

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const query = inputText.trim();
    setInputText('');
    setTranscript(query);
    askAgent(query);
  };

  const quickPrompts = [
    language === 'hi' ? 'दवा की सही मात्रा क्या है?' : 'What is the exact dosage?',
    language === 'hi' ? 'क्या यह बीमारी फैलेगी?' : 'Will this infection spread?',
    language === 'hi' ? 'जैविक उपचार कैसे करें?' : 'How to apply organic remedy?',
  ];

  return (
    <aside
      aria-label="Kisan Mitra Live Doctor"
      className={`fixed bottom-6 right-6 z-[60] transition-all duration-300 ${
        isExpanded ? 'w-96 max-w-[92vw] h-[540px]' : 'w-72 h-16'
      } flex flex-col shadow-2xl`}
    >
      <div className="relative flex-1 bg-stone-900/95 backdrop-blur-2xl rounded-3xl border border-emerald-500/30 text-white flex flex-col overflow-hidden shadow-emerald-950/40">
        {/* Header */}
        <header className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-3 h-3 rounded-full ${
                status === 'listening'
                  ? 'bg-emerald-400 animate-ping'
                  : status === 'speaking'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-500'
              }`}
            />
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles size={15} className="text-emerald-400" />
                Kisan Mitra Live Doctor
              </h4>
              <p className="text-[10px] text-emerald-300/80 font-medium capitalize">
                {status === 'listening'
                  ? '🎙️ Listening...'
                  : status === 'thinking'
                  ? '⚡ Analyzing with Gemini Voice...'
                  : status === 'speaking'
                  ? '🔊 Speaking (Gemini AI Voice)...'
                  : 'Ready to help'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              title={isExpanded ? 'Minimize' : 'Expand'}
            >
              <Minimize2 size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {isExpanded && (
          <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto">
            {/* Visualizer Circle */}
            <div className="flex flex-col items-center justify-center my-2">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div
                  className={`absolute inset-0 rounded-full bg-emerald-500/20 ${
                    status === 'listening' || status === 'speaking' ? 'animate-ping duration-1000' : ''
                  }`}
                />
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
                    status === 'listening'
                      ? 'border-emerald-400 bg-emerald-950/80 shadow-lg shadow-emerald-500/30'
                      : status === 'speaking'
                      ? 'border-amber-400 bg-amber-950/80 shadow-lg shadow-amber-500/30'
                      : 'border-stone-700 bg-stone-800'
                  }`}
                >
                  {status === 'speaking' ? (
                    <Volume2 size={26} className="text-amber-400 animate-pulse" />
                  ) : (
                    <Bot size={26} className="text-emerald-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Conversation Messages */}
            <div className="space-y-2.5 my-2 text-xs flex-1 overflow-y-auto max-h-[160px] pr-1">
              {transcript && (
                <div className="flex items-start gap-2 bg-white/5 p-2.5 rounded-2xl border border-white/5 text-stone-200">
                  <User size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <p className="italic">"{transcript}"</p>
                </div>
              )}
              {reply && (
                <div className="flex items-start gap-2 bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/20 text-emerald-100 leading-relaxed">
                  <Bot size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <p>{reply}</p>
                </div>
              )}
              {error && (
                <p className="text-[11px] text-amber-300 text-center bg-amber-950/40 p-2 rounded-xl border border-amber-500/20">
                  {error}
                </p>
              )}
            </div>

            {/* Quick Questions */}
            <div className="my-1.5">
              <p className="text-[10px] text-stone-400 font-semibold mb-1">Quick questions:</p>
              <div className="flex flex-wrap gap-1">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTranscript(prompt);
                      askAgent(prompt);
                    }}
                    className="text-[11px] px-2.5 py-1 bg-stone-800 hover:bg-emerald-900/60 hover:border-emerald-500/40 border border-stone-700 rounded-full text-stone-300 hover:text-white transition-all text-left cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Dual Input Form */}
            <form onSubmit={handleTextSubmit} className="pt-2.5 border-t border-white/10 flex items-center gap-1.5">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={language === 'hi' ? 'दवा या रोग के बारे में पूछें...' : 'Ask about diagnosis or remedy...'}
                className="flex-1 bg-stone-800/90 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-emerald-500"
              />

              <button
                type="button"
                onClick={() => (status === 'listening' ? stopListening() : startListening())}
                className={`p-2 rounded-xl transition-all shadow-md cursor-pointer ${
                  status === 'listening'
                    ? 'bg-amber-500 text-stone-950 animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
                title={status === 'listening' ? 'Stop Listening' : 'Tap to Speak'}
              >
                <Mic size={15} />
              </button>

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white rounded-xl transition-colors shadow-md cursor-pointer"
                title="Send"
              >
                <Send size={15} />
              </button>

              <button
                type="button"
                onClick={toggleMute}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isMuted
                    ? 'bg-red-500/20 border-red-500/40 text-red-300'
                    : 'bg-stone-800 border-stone-700 text-stone-300 hover:text-white'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff size={15} /> : <Volume2 size={15} />}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors shadow-md cursor-pointer"
                title="End Doctor Session"
              >
                <PhoneOff size={15} />
              </button>
            </form>
          </div>
        )}

        {!isExpanded && (
          <div className="flex-1 px-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 capitalize">Kisan Mitra: {status}</span>
            <button
              onClick={() => setIsExpanded(true)}
              className="text-xs text-stone-300 hover:text-white underline cursor-pointer"
            >
              Expand
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default LiveFarmerAgent;
