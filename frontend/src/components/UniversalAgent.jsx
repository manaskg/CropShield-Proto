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
  Sprout,
  Send,
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useVoiceAgent } from '../hooks/useVoiceAgent';

/**
 * Universal Kisan AI Voice & Chat Advisor Floating Widget
 */
const UniversalAgent = () => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [inputText, setInputText] = useState('');

  const welcomeMessage =
    language === 'hi'
      ? 'नमस्ते किसान भाई! मैं किसान मित्र हूँ। फसल, मिट्टी या मौसम के बारे में बोलकर या लिखकर पूछें।'
      : 'Hello Farmer! I am Kisan Mitra AI. Ask me anything about your crops, soil, or weather!';

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
    voiceName: 'Kore',
    defaultContext: {
      role: 'Indian Agricultural Expert assisting farmers with crops, soil, fertilizers, and weather advisories',
    },
  });

  // Handle open/close state transitions
  useEffect(() => {
    if (isOpen) {
      askAgent('Introduce yourself to the farmer briefly in 1 warm sentence.');
    } else {
      stopAll();
    }
  }, [isOpen, askAgent, stopAll]);

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const query = inputText.trim();
    setInputText('');
    setTranscript(query);
    askAgent(query);
  };

  const quickPrompts = [
    language === 'hi' ? 'गेहूं के लिए सबसे अच्छी खाद कौन सी है?' : 'Best fertilizer for wheat?',
    language === 'hi' ? 'मिट्टी की जांच कैसे करें?' : 'How to test soil health?',
    language === 'hi' ? 'कीटों से बचाव के उपाय?' : 'How to prevent crop pests?',
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-3 border-2 border-white/20 group cursor-pointer"
        aria-label="Open Kisan AI Advisor"
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
    <aside
      aria-label="Kisan Mitra Voice Advisor"
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
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
                <Sprout size={16} className="text-emerald-400" />
                Kisan Mitra Live Advisor
              </h4>
              <p className="text-[10px] text-emerald-300/80 font-medium capitalize">
                {status === 'listening'
                  ? '🎙️ Listening...'
                  : status === 'thinking'
                  ? '⚡ Consulting Gemini Voice...'
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
              onClick={() => setIsOpen(false)}
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

            {/* Quick Prompts */}
            <div className="my-1.5">
              <p className="text-[10px] text-stone-400 font-semibold mb-1">Quick prompts:</p>
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

            {/* Dual Input Form: Text Box + Mic + Mute + Close */}
            <form onSubmit={handleTextSubmit} className="pt-2.5 border-t border-white/10 flex items-center gap-1.5">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={language === 'hi' ? 'प्रश्न यहाँ लिखें या माइक दबाएं...' : 'Type question or tap mic...'}
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
                onClick={() => setIsOpen(false)}
                className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors shadow-md cursor-pointer"
                title="End"
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

export default UniversalAgent;
