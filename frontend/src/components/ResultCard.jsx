import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, Volume2, Sprout, Shield, 
  ShoppingBag, IndianRupee, Pause, Play, Loader2, 
  Send, MapPin, ExternalLink, CloudRain, CloudSun, 
  Sparkles, PhoneCall, CheckCircle2, Leaf, Pill,
  Info, ChevronDown, ChevronUp, AlertCircle, Share2, Printer, Check, Search, Droplets, Wind
} from 'lucide-react';
import { aiApi } from '../api/aiApi';
import { useLanguage } from '../hooks/useLanguage';
import LiveFarmerAgent from './LiveFarmerAgent';

// Audio Utils
function decodeBase64(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

function pcmToWav(pcmData) {
  const buffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(buffer);
  const writeString = (off, str) => { 
    for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); 
  };
  writeString(0, 'RIFF'); 
  view.setUint32(4, 36 + pcmData.length, true); 
  writeString(8, 'WAVE');
  writeString(12, 'fmt '); 
  view.setUint32(16, 16, true); 
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); 
  view.setUint32(24, 24000, true); 
  view.setUint32(28, 48000, true);
  view.setUint16(32, 2, true); 
  view.setUint16(34, 16, true); 
  writeString(36, 'data');
  view.setUint32(40, pcmData.length, true);
  new Uint8Array(buffer, 44).set(pcmData);
  return new Blob([buffer], { type: 'audio/wav' });
}

const ResultCard = ({ data, variant = 'default' }) => {
  const { identification, treatment, weather } = data;
  const { t, language } = useLanguage();
  
  // UI State
  const [expandedSection, setExpandedSection] = useState(null);
  const [activeRemedyTab, setActiveRemedyTab] = useState('organic');
  const [isLiveAgentOpen, setIsLiveAgentOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(null);

  // Audio State
  const [audioUrl, setAudioUrl] = useState(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Chat State
  const [chatQuery, setChatQuery] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);

  // Shops State
  const [shops, setShops] = useState([]);
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const [showOnlineLinks, setShowOnlineLinks] = useState(false);

  useEffect(() => {
    const greet = language === 'hi' 
      ? `नमस्ते! मैं आपकी ${treatment.pest_name_local || treatment.pest_name} समस्या के बारे में जानता हूँ। कुछ पूछें?` 
      : language === 'bn' 
      ? `নমস্কার! আমি আপনার ${treatment.pest_name_local || treatment.pest_name} সমস্যা সম্পর্কে জানি। জিজ্ঞাসা করুন!` 
      : `Hello! I'm here to help with ${treatment.pest_name}. Ask me anything!`;
    setMessages([{ id: '1', sender: 'ai', text: greet }]);
  }, [treatment.pest_name, language, treatment.pest_name_local]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  const handleGenerateAudio = async () => {
    try {
      setIsGeneratingAudio(true);
      const lang = language === 'hi' ? 'Hindi' : language === 'bn' ? 'Bengali' : 'English';
      const res = await aiApi.getAudioTTS(identification, treatment, weather, lang);
      
      if (!res.audioData) throw new Error('No audio data received');

      const blob = pcmToWav(decodeBase64(res.audioData));
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setIsGeneratingAudio(false);
      setIsPlaying(true);

      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(() => setIsPlaying(false));
        }
      }, 100);
    } catch (e) {
      console.error('Audio Generation Error:', e);
      setIsGeneratingAudio(false);
      setIsPlaying(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;
    const q = chatQuery; 
    setChatQuery('');
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: q }]);
    setIsChatLoading(true);
    try {
      const lang = language === 'hi' ? 'Hindi' : language === 'bn' ? 'Bengali' : 'English';
      const res = await aiApi.askQuestion(q, { 
        crop: identification.crop, 
        pest: treatment.pest_name, 
        remedy: treatment.organic_remedy, 
        chemical: treatment.chemical_remedy?.name 
      }, lang);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'ai', text: res.text, sources: res.sourceUrls }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: 'err', sender: 'ai', text: 'Sorry, could not process your question.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const findShops = () => {
    setIsLoadingShops(true);
    setTimeout(() => {
      setShowOnlineLinks(true);
      setIsLoadingShops(false);
    }, 800);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `CropShield Report: ${identification.crop} - ${treatment.pest_name_local || treatment.pest_name}`,
        text: `Diagnosis: ${identification.crop} has ${treatment.pest_name_local || treatment.pest_name}. Recommended: ${treatment.organic_remedy}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShareFeedback(t('result.copied'));
      setTimeout(() => setShareFeedback(null), 3000);
    }
  };

  const isHealthy = identification.pest_label?.toLowerCase() === 'healthy';

  return (
    <div id="analysis-results" className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      {/* 1. HERO REPORT HEADER */}
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-xl shadow-stone-200/50 border border-stone-100 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
              {t('result.report_header')}
            </span>
            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
              isHealthy ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-800'
            }`}>
              {t('result.confidence')}: {Math.round(identification.confidence * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className="p-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center gap-2 text-sm font-bold"
            >
              {shareFeedback ? <Check size={16} className="text-emerald-600" /> : <Share2 size={16} />}
              <span className="hidden sm:inline">{shareFeedback || t('result.share')}</span>
            </button>
            <button 
              onClick={() => window.print()}
              className="p-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center gap-2 text-sm font-bold"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">{t('result.print')}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-4xl sm:text-5xl font-black text-stone-900 tracking-tight mb-2">
              {identification.crop}
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-emerald-600 mb-4">
              {treatment.pest_name_local || treatment.pest_name}
            </h3>
            <p className="text-stone-600 leading-relaxed text-base sm:text-lg mb-6">
              {identification.notes}
            </p>

            {/* ACTION BUTTONS: LIVE EXPERT */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setIsLiveAgentOpen(true)}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-black text-base shadow-xl shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all"
              >
                <PhoneCall size={22} className="animate-bounce" />
                <span>{t('result.live_expert')} (Live Voice AI)</span>
              </button>
            </div>
          </div>

          {/* WEATHER CONTEXT PANEL */}
          {weather && (
            <div className="bg-gradient-to-br from-emerald-50 to-stone-50 rounded-3xl p-6 border border-emerald-100/60 shadow-inner">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 mb-4 flex items-center gap-2">
                <CloudSun size={18} /> {t('result.field_env')}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-stone-100">
                  <span className="text-xs text-stone-400 font-bold block">{t('result.temp')}</span>
                  <span className="text-2xl font-black text-stone-800">{weather.temperature}°C</span>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-stone-100">
                  <span className="text-xs text-stone-400 font-bold block">{t('result.humidity')}</span>
                  <span className="text-2xl font-black text-stone-800">{weather.humidity}%</span>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-stone-100">
                  <span className="text-xs text-stone-400 font-bold block">{t('result.condition')}</span>
                  <span className="text-base font-bold text-stone-800 truncate">{weather.condition}</span>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-stone-100">
                  <span className="text-xs text-stone-400 font-bold block">{t('result.wind')}</span>
                  <span className="text-base font-bold text-stone-800">{weather.windSpeed}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. REMEDIES TABS (Organic vs Chemical) */}
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-xl shadow-stone-200/50 border border-stone-100">
        <div className="flex border-b border-stone-100 pb-4 mb-8 gap-4">
          <button
            onClick={() => setActiveRemedyTab('organic')}
            className={`flex items-center gap-2 pb-2 text-lg font-black transition-all border-b-2 ${
              activeRemedyTab === 'organic'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            <Leaf size={20} /> {t('result.organic_title')}
          </button>
          <button
            onClick={() => setActiveRemedyTab('chemical')}
            className={`flex items-center gap-2 pb-2 text-lg font-black transition-all border-b-2 ${
              activeRemedyTab === 'chemical'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            <Pill size={20} /> {t('result.market_title')}
          </button>
        </div>

        {activeRemedyTab === 'organic' ? (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 block mb-2">
                {t('result.organic_cost')}
              </span>
              <p className="text-stone-800 text-lg leading-relaxed font-medium">
                {treatment.organic_remedy}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-amber-50/60 border border-amber-100 space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-700 block">
                    {t('result.active_molecule')}
                  </span>
                  <h4 className="text-2xl font-black text-stone-900">
                    {treatment.chemical_remedy?.name}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-700 block">
                    {t('result.market_price')}
                  </span>
                  <span className="text-xl font-black text-emerald-700">
                    {treatment.chemical_remedy?.estimated_cost_inr}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-amber-200/50">
                <div>
                  <span className="text-xs text-stone-400 font-bold block">{t('result.usage_guide')}</span>
                  <p className="font-bold text-stone-800">{treatment.chemical_remedy?.dosage_ml_per_litre}</p>
                </div>
                <div>
                  <span className="text-xs text-stone-400 font-bold block">{t('result.frequency')}</span>
                  <p className="font-bold text-stone-800">{treatment.chemical_remedy?.frequency_days}</p>
                </div>
              </div>

              {/* Find Shops Button */}
              <div className="pt-4">
                <button
                  onClick={findShops}
                  disabled={isLoadingShops}
                  className="w-full py-3 bg-white border border-amber-300 hover:bg-amber-100 text-stone-900 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  {isLoadingShops ? <Loader2 className="animate-spin" size={18} /> : <MapPin size={18} />}
                  <span>{t('result.find_shops')}</span>
                </button>
              </div>

              {showOnlineLinks && (
                <div className="mt-4 p-4 bg-white rounded-2xl border border-stone-200 space-y-2 animate-fade-in">
                  <h5 className="font-bold text-stone-800 text-sm">Verified Indian Agri Suppliers:</h5>
                  <div className="flex flex-col gap-2">
                    <a 
                      href={`https://www.bighaat.com/search?q=${encodeURIComponent(treatment.chemical_remedy?.name || '')}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-emerald-700 text-sm font-semibold flex items-center justify-between p-2 rounded-xl hover:bg-emerald-50"
                    >
                      <span>BigHaat (Online Delivery)</span>
                      <ExternalLink size={14} />
                    </a>
                    <a 
                      href={`https://www.agribegri.com/search.php?search=${encodeURIComponent(treatment.chemical_remedy?.name || '')}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-emerald-700 text-sm font-semibold flex items-center justify-between p-2 rounded-xl hover:bg-emerald-50"
                    >
                      <span>AgriBegri Seeds & Pesticides</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vital Safety Rule */}
        {treatment.safety && (
          <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <div>
              <h5 className="text-xs font-black uppercase tracking-wider text-red-900">
                {t('result.safety_rule')}
              </h5>
              <p className="text-red-800 font-medium text-sm mt-1">{treatment.safety}</p>
            </div>
          </div>
        )}
      </div>

      {/* 3. KISAN MITRA AI Q&A CHAT */}
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-xl shadow-stone-200/50 border border-stone-100">
        <h4 className="text-xl font-black text-stone-900 mb-1 flex items-center gap-2">
          <Sparkles className="text-emerald-600" size={20} /> {t('result.chat_title')}
        </h4>
        <p className="text-stone-400 text-sm mb-6">{t('result.chat_sub')}</p>

        <div className="h-64 overflow-y-auto space-y-4 mb-4 p-4 bg-stone-50 rounded-2xl border border-stone-100">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-md p-4 rounded-2xl text-sm ${
                m.sender === 'user'
                  ? 'bg-emerald-600 text-white font-medium rounded-br-none'
                  : 'bg-white text-stone-800 font-medium border border-stone-200/80 shadow-sm rounded-bl-none'
              }`}>
                <p>{m.text}</p>
              </div>
            </div>
          ))}
          {isChatLoading && (
            <div className="flex justify-start">
              <div className="bg-white p-3 rounded-2xl border border-stone-200 flex items-center gap-2 text-stone-400 text-sm">
                <Loader2 className="animate-spin" size={16} /> Thinking...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={chatQuery}
            onChange={(e) => setChatQuery(e.target.value)}
            placeholder={t('result.chat_placeholder')}
            className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!chatQuery.trim() || isChatLoading}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-2xl font-bold transition-all shadow-md"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* LIVE EXPERT AGENT MODAL */}
      <LiveFarmerAgent
        isOpen={isLiveAgentOpen}
        onClose={() => setIsLiveAgentOpen(false)}
        analysisData={data}
      />
    </div>
  );
};

export default ResultCard;
