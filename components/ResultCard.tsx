
import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult } from '../types';
import { 
  AlertTriangle, Volume2, Sprout, Shield, 
  ShoppingBag, IndianRupee, Pause, Play, Loader2, 
  Send, MapPin, ExternalLink, CloudRain, CloudSun, 
  Sparkles, PhoneCall, CheckCircle2, Leaf, Pill,
  Info, ChevronDown, ChevronUp, AlertCircle, Share2, Printer, Check, Search, Droplets, Wind
} from 'lucide-react';
import { generatePestAudioExplanation, askFollowUpQuestion, findNearbyShops } from '../services/geminiService';
import { useLanguage } from '../context/LanguageContext';
import LiveFarmerAgent from './LiveFarmerAgent';

interface ResultCardProps {
  data: AnalysisResult;
  variant?: 'default' | 'modal';
}

interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    sources?: string[];
}

interface ShopResult {
    title: string;
    uri: string;
}

// Audio Utils
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

function pcmToWav(pcmData: Uint8Array): Blob {
  const buffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(buffer);
  const writeString = (off: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
  writeString(0, 'RIFF'); view.setUint32(4, 36 + pcmData.length, true); writeString(8, 'WAVE');
  writeString(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, 24000, true); view.setUint32(28, 48000, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); writeString(36, 'data');
  view.setUint32(40, pcmData.length, true);
  new Uint8Array(buffer, 44).set(pcmData);
  return new Blob([buffer], { type: 'audio/wav' });
}

const ResultCard: React.FC<ResultCardProps> = ({ data, variant = 'default' }) => {
  const { identification, treatment, weather } = data;
  const { t, language } = useLanguage();
  
  // UI State
  const [expandedSection, setExpandedSection] = useState<'explanation' | null>(null); // Collapsed by default
  const [activeRemedyTab, setActiveRemedyTab] = useState<'organic' | 'chemical'>('organic');
  const [isLiveAgentOpen, setIsLiveAgentOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Audio State
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Chat State
  const [chatQuery, setChatQuery] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Shops State
  const [shops, setShops] = useState<ShopResult[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const [shopError, setShopError] = useState<string | null>(null);
  const [showOnlineLinks, setShowOnlineLinks] = useState(false);

  useEffect(() => {
      const greet = language === 'hi' ? `नमस्ते! मैं आपकी ${treatment.pest_name_local || treatment.pest_name} समस्या के बारे में जानता हूँ। कुछ पूछें?` : language === 'bn' ? `নমস্কার! আমি আপনার ${treatment.pest_name_local || treatment.pest_name} সমস্যা সম্পর্কে জানি। জিজ্ঞাসা করুন!` : `Hello! I'm here to help with ${treatment.pest_name}. Ask me anything!`;
      setMessages([{ id: '1', sender: 'ai', text: greet }]);
  }, [treatment.pest_name, language, treatment.pest_name_local]);

  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages, isChatLoading]);

  const handleGenerateAudio = async () => {
    try {
        setIsGeneratingAudio(true);
        const lang = language === 'hi' ? 'Hindi' : language === 'bn' ? 'Bengali' : 'English';
        const base64 = await generatePestAudioExplanation(identification, treatment, weather, lang);
        
        if (!base64) {
             throw new Error("No audio generated");
        }

        const blob = pcmToWav(decodeBase64(base64));
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        setIsGeneratingAudio(false);
        setIsPlaying(true);
        
        // Wait slightly for React to update DOM with new src
        setTimeout(() => {
            if (audioRef.current) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.error("Audio Playback Interrupted:", error);
                        setIsPlaying(false);
                    });
                }
            }
        }, 100);

    } catch (e) { 
        console.error("Audio Generation Error:", e);
        setIsGeneratingAudio(false); 
        setIsPlaying(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;
    const q = chatQuery; setChatQuery('');
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: q }]);
    setIsChatLoading(true);
    try {
        const lang = language === 'hi' ? 'Hindi' : language === 'bn' ? 'Bengali' : 'English';
        const res = await askFollowUpQuestion(q, { crop: identification.crop, pest: treatment.pest_name, remedy: treatment.organic_remedy, chemical: treatment.chemical_remedy.name }, lang);
        setMessages(prev => [...prev, { id: (Date.now()+1).toString(), sender: 'ai', text: res.text, sources: res.sourceUrls }]);
    } catch (e) { setMessages(prev => [...prev, { id: 'err', sender: 'ai', text: "Error." }]); }
    finally { setIsChatLoading(false); }
  };

  const findShops = async () => {
    if (shops.length > 0 || showOnlineLinks) return;
    
    setIsLoadingShops(true);
    setShopError(null);

    try {
      // 1. Get Location
      let position: GeolocationPosition;
      try {
         position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
         });
      } catch (locErr) {
         // Location denied or unavailable, fall back to online
         console.warn("Location denied, showing online shops.");
         setShowOnlineLinks(true);
         setIsLoadingShops(false);
         return;
      }

      // 2. Call Gemini API
      const res = await findNearbyShops(position.coords.latitude, position.coords.longitude, treatment.chemical_remedy.name);
      
      if (res.shops && res.shops.length > 0) {
        setShops(res.shops);
      } else {
        // No local shops found
        setShopError("No local shops found nearby.");
        setShowOnlineLinks(true);
      }
    } catch (e) {
      console.error("Shop search failed", e);
      setShopError("Could not search local area.");
      setShowOnlineLinks(true);
    } finally {
      setIsLoadingShops(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any default button behavior
    e.stopPropagation();

    const reportText = `
🌱 CROP SHIELD REPORT
---------------------
Crop: ${identification.crop}
Problem: ${treatment.pest_name_local || treatment.pest_name}
Severity: ${treatment.severity.toUpperCase()}

💊 REMEDY
Organic: ${treatment.organic_remedy}
Chemical: ${treatment.chemical_remedy.name}
Dosage: ${treatment.chemical_remedy.dosage_ml_per_litre}/L

Get full details on CropShield app.
    `.trim();

    // 1. Try Native Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: `CropShield: ${identification.crop}`,
          text: reportText,
          url: window.location.href,
        });
        return;
      } catch (err) {
        // Share cancelled or failed, continue to clipboard
      }
    }

    // 2. Clipboard API Fallback
    try {
      await navigator.clipboard.writeText(reportText);
      setShareFeedback(t('result.copied'));
      setTimeout(() => setShareFeedback(null), 3000);
    } catch (err) {
      // 3. Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = reportText;
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setShareFeedback(t('result.copied'));
        setTimeout(() => setShareFeedback(null), 3000);
      } catch (e) {
        alert("Please screenshot this page to share.");
      }
      document.body.removeChild(textArea);
    }
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.print();
  };

  const toggleSection = (s: typeof expandedSection) => setExpandedSection(expandedSection === s ? null : s);

  const theme = treatment.severity.toLowerCase() === 'high' ? 'red' : treatment.severity.toLowerCase() === 'medium' ? 'amber' : 'emerald';
  const themeStyles = {
    red: "from-red-600 to-rose-700 shadow-red-500/20 text-red-100 border-red-400/30",
    amber: "from-amber-500 to-orange-600 shadow-amber-500/20 text-amber-100 border-amber-400/30",
    emerald: "from-emerald-500 to-teal-600 shadow-emerald-500/20 text-emerald-100 border-emerald-400/30"
  }[theme];

  return (
    <>
    {/* --- DEDICATED PRINTABLE REPORT (Hidden on Screen) --- */}
    <div id="printable-report" className="p-8 font-serif bg-white text-black">
        {/* Header */}
        <div className="flex justify-between items-end border-b-2 border-black pb-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">CropShield</h1>
                <p className="text-sm text-gray-600 mt-1">Diagnosis & Field Report</p>
            </div>
            <div className="text-right">
                <p className="text-xs text-gray-500 uppercase font-bold">Generated On</p>
                <p className="font-bold">{new Date().toLocaleDateString()}</p>
            </div>
        </div>

        {/* Diagnosis Summary */}
        <div className="mb-8 grid grid-cols-2 gap-8">
            <div className="p-4 border border-gray-300 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Crop</p>
                <p className="text-2xl font-bold">{identification.crop}</p>
            </div>
            <div className="p-4 border border-gray-300 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Disease / Pest</p>
                <p className="text-2xl font-bold text-red-700">{treatment.pest_name_local || treatment.pest_name}</p>
                <p className="text-sm italic text-gray-600">({treatment.pest_name})</p>
            </div>
        </div>

        {/* Organic Solution */}
        <div className="mb-8">
            <h3 className="text-lg font-bold border-b border-gray-200 pb-2 mb-4 flex items-center gap-2">
                <span className="text-green-700">🌱</span> Organic Solution
            </h3>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-lg leading-relaxed">
                {treatment.organic_remedy}
            </div>
        </div>

        {/* Chemical Solution */}
        <div className="mb-8">
            <h3 className="text-lg font-bold border-b border-gray-200 pb-2 mb-4 flex items-center gap-2">
                <span className="text-amber-700">💊</span> Chemical Solution
            </h3>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Recommended Chemical</p>
                        <p className="text-xl font-bold">{treatment.chemical_remedy.name}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Dosage</p>
                        <p className="text-lg">{treatment.chemical_remedy.dosage_ml_per_litre} per litre</p>
                    </div>
                </div>
                
                <div>
                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Available Brands</p>
                    <div className="flex flex-wrap gap-2">
                        {treatment.chemical_remedy.product_brands.map((brand, i) => (
                            <span key={i} className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm font-medium">
                                {brand}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-400">
            <p>Generated by CropShield AI • Empowering Farmers with Technology</p>
        </div>
    </div>

    {/* --- INTERACTIVE DASHBOARD (Hidden on Print) --- */}
    <div className={`w-full max-w-[1400px] mx-auto px-4 pb-32 animate-fade-in-up ${variant === 'modal' ? 'pt-8' : ''} no-print`} id="analysis-results">
      <LiveFarmerAgent isOpen={isLiveAgentOpen} onClose={() => setIsLiveAgentOpen(false)} analysisData={data} />

      {/* --- STICKY FIELD REPORT HEADER --- */}
      <div className={`${variant === 'modal' ? '' : 'sticky top-24'} z-40 bg-gradient-to-r ${themeStyles} rounded-[2rem] p-6 md:p-8 border backdrop-blur-md shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 group transition-all`}>
          <div className="flex items-center gap-6">
               <div className="relative">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 rounded-3xl border border-white/40 flex items-center justify-center backdrop-blur-sm">
                      <Sprout size={48} className="text-white opacity-90" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-white text-stone-900 rounded-full p-1.5 shadow-lg">
                      {theme === 'red' ? <AlertTriangle size={16} className="text-red-500" /> : <CheckCircle2 size={16} className="text-emerald-500" />}
                  </div>
               </div>
               <div>
                  <div className="flex items-center gap-2 mb-1">
                      <span className="bg-black/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">{t('result.report_header')}</span>
                      <span className="w-1 h-1 rounded-full bg-white/40"></span>
                      <span className="text-xs font-medium text-white/80">{identification.crop}</span>
                  </div>
                  <h1 className="text-2xl md:text-4xl font-black leading-none drop-shadow-md">
                      {treatment.pest_name_local || identification.pest_label}
                  </h1>
                  <p className="text-sm md:text-lg text-white/70 font-medium italic mt-1">({identification.pest_label})</p>
               </div>
          </div>

          <div className="flex flex-wrap justify-center md:justify-end gap-3 w-full md:w-auto">
              <div className="bg-white/10 border border-white/20 px-4 py-3 rounded-2xl backdrop-blur-md text-center min-w-[100px]">
                  <div className="text-[10px] font-bold uppercase text-white/60 mb-1">{t('result.confidence')}</div>
                  <div className="text-xl font-black">{Math.round(identification.confidence * 100)}%</div>
              </div>
              <button 
                type="button"
                onClick={() => setIsLiveAgentOpen(true)}
                className="bg-white text-stone-900 px-6 py-3 rounded-2xl font-black flex items-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all group/btn no-print"
              >
                  <div className="p-2 bg-red-500 rounded-lg text-white group-hover/btn:animate-pulse">
                      <PhoneCall size={20} fill="currentColor" />
                  </div>
                  <div className="text-left leading-none">
                      <div className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">{t('result.live_expert')}</div>
                      <div className="text-sm">{t('result.call_assistant')}</div>
                  </div>
              </button>
          </div>
      </div>

      {/* --- DASHBOARD GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDEBAR (Span 4) */}
          <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-stone-100 relative overflow-hidden group transition-all hover:border-emerald-200 no-print">
                  <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                         {isGeneratingAudio ? <Loader2 className="animate-spin" /> : <Volume2 size={24}/>}
                      </div>
                      <div>
                          <h3 className="font-black text-stone-800 tracking-tight">{t('result.listen_learn')}</h3>
                          <p className="text-xs text-stone-400 font-bold uppercase">{t('result.audio_guide')}</p>
                      </div>
                  </div>
                  
                  {!audioUrl ? (
                      <button onClick={handleGenerateAudio} disabled={isGeneratingAudio} className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-stone-800 shadow-lg shadow-stone-900/10 transition-all">
                          {isGeneratingAudio ? '...' : <><Play size={18} fill="currentColor"/> {t('result.generate_voice')}</>}
                      </button>
                  ) : (
                      <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 flex items-center gap-4">
                          <button onClick={() => { isPlaying ? audioRef.current?.pause() : audioRef.current?.play(); setIsPlaying(!isPlaying); }} className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-transform active:scale-90">
                              {isPlaying ? <Pause size={20} fill="currentColor"/> : <Play size={20} fill="currentColor" className="ml-1"/>}
                          </button>
                          <div className="flex-1 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                              <div className={`h-full bg-emerald-500 transition-all ${isPlaying ? 'w-full duration-[60s] ease-linear' : 'w-0'}`}></div>
                          </div>
                          <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                      </div>
                  )}
              </div>

              {weather && (
                  <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-stone-100">
                       <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4">{t('result.field_env')}</h3>
                       <div className="grid grid-cols-2 gap-4">
                            {/* Condition */}
                            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <CloudRain size={20} className="text-blue-500 mb-2"/>
                                <div className="text-lg font-black text-stone-800 break-words leading-tight">{weather.condition}</div>
                                <div className="text-[10px] font-bold text-blue-400 uppercase mt-1">{t('result.condition')}</div>
                            </div>
                            {/* Temp */}
                            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                                <CloudSun size={20} className="text-orange-500 mb-2"/>
                                <div className="text-lg font-black text-stone-800">{weather.temperature}°C</div>
                                <div className="text-[10px] font-bold text-orange-400 uppercase mt-1">{t('result.temp')}</div>
                            </div>
                            {/* Humidity (New) */}
                            <div className="p-4 bg-cyan-50 rounded-2xl border border-cyan-100">
                                <Droplets size={20} className="text-cyan-500 mb-2"/>
                                <div className="text-lg font-black text-stone-800">{weather.humidity}%</div>
                                <div className="text-[10px] font-bold text-cyan-400 uppercase mt-1">{t('result.humidity')}</div>
                            </div>
                             {/* Wind (New) */}
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <Wind size={20} className="text-slate-500 mb-2"/>
                                <div className="text-lg font-black text-stone-800 leading-tight">{weather.windSpeed} <span className="text-xs font-bold text-stone-500">km/h</span> <span className="text-sm">{weather.windDirection}</span></div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">{t('result.wind')}</div>
                            </div>
                       </div>
                       <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-3">
                           <AlertCircle size={18} className="text-amber-600 shrink-0" />
                           <p className="text-[10px] font-bold text-amber-900 leading-tight uppercase">{treatment.weather_advice}</p>
                       </div>
                  </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 no-print">
                  <button 
                    type="button"
                    onClick={handleShare}
                    className="flex flex-col items-center justify-center gap-2 p-6 bg-white rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-md transition-all text-stone-400 hover:text-stone-900 group"
                  >
                      {shareFeedback ? <Check size={24} className="text-emerald-500" /> : <Share2 size={24} className="group-hover:scale-110 transition-transform" />}
                      <span className={`text-[10px] font-bold uppercase ${shareFeedback ? 'text-emerald-500' : ''}`}>
                         {shareFeedback || t('result.share')}
                      </span>
                  </button>
                  <button 
                    type="button"
                    onClick={handlePrint} 
                    className="flex flex-col items-center justify-center gap-2 p-6 bg-white rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-md transition-all text-stone-400 hover:text-stone-900 group"
                  >
                      <Printer size={24} className="group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold uppercase">Save PDF / Print</span>
                  </button>
              </div>
          </div>

          {/* MAIN CONTENT (Span 8) */}
          <div className="lg:col-span-8 space-y-4">
              
              {/* Collapsible Deep Dive */}
              <div className={`bg-white rounded-[2.5rem] shadow-xl border border-stone-100 overflow-hidden transition-all duration-500 ${expandedSection === 'explanation' ? 'ring-2 ring-emerald-500/20' : ''}`}>
                  <button onClick={() => toggleSection('explanation')} className="w-full px-8 py-6 flex items-center justify-between group hover:bg-stone-50 transition-colors no-print">
                      <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl transition-colors ${expandedSection === 'explanation' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-400 group-hover:bg-emerald-50 group-hover:text-emerald-600'}`}>
                              <Shield size={24}/>
                          </div>
                          <div className="text-left">
                              <h3 className="text-lg font-black text-stone-800 tracking-tight">{t('result.diagnosis_title')}</h3>
                              <p className="text-xs text-stone-400 font-bold uppercase">{t('result.diagnosis_sub')}</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-2 text-stone-400">
                          <span className="text-xs font-bold uppercase hidden md:block">{expandedSection === 'explanation' ? t('result.collapse') : t('result.expand')}</span>
                          {expandedSection === 'explanation' ? <ChevronUp size={24}/> : <ChevronDown size={24}/>}
                      </div>
                  </button>

                  <div className={`transition-all duration-500 ease-in-out overflow-hidden ${expandedSection === 'explanation' ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} print-force-expand`}>
                      <div className="px-8 pb-8 pt-2">
                          <div className="prose prose-stone max-w-none text-stone-600 leading-relaxed border-t border-stone-100 pt-6">
                              {treatment.local_language_explanation.split('\n').map((line, i) => <p key={i} className="mb-4 last:mb-0">{line}</p>)}
                          </div>
                          <div className="mt-6 p-4 bg-orange-50 rounded-2xl border border-orange-100 flex gap-4 items-start">
                              <AlertCircle size={24} className="text-orange-600 shrink-0 mt-1"/>
                              <div>
                                  <h4 className="font-black text-orange-900 text-sm">{t('result.safety_rule')}</h4>
                                  <p className="text-sm text-orange-800 mt-1">{treatment.safety}</p>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Tabbed Remedies */}
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-stone-100 overflow-hidden">
                  <div className="flex border-b border-stone-100 bg-stone-50/50 no-print">
                        <button 
                          onClick={() => setActiveRemedyTab('organic')}
                          className={`flex-1 py-5 text-sm md:text-base font-bold flex items-center justify-center gap-2 transition-all relative
                              ${activeRemedyTab === 'organic' ? 'text-green-700 bg-white shadow-sm' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'}
                          `}
                        >
                            <Leaf size={20} /> {t('result.organic_title')}
                            {activeRemedyTab === 'organic' && <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>}
                        </button>
                        <button 
                          onClick={() => setActiveRemedyTab('chemical')}
                          className={`flex-1 py-5 text-sm md:text-base font-bold flex items-center justify-center gap-2 transition-all relative
                              ${activeRemedyTab === 'chemical' ? 'text-amber-700 bg-white shadow-sm' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'}
                          `}
                        >
                            <Pill size={20} /> {t('result.market_title')}
                            {activeRemedyTab === 'chemical' && <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>}
                        </button>
                   </div>
                   
                   <div className="p-8">
                       {activeRemedyTab === 'organic' && (
                           <div className="animate-fade-in">
                               <div className="flex items-center gap-4 mb-6">
                                   <div className="p-3 bg-green-100 rounded-2xl text-green-600">
                                       <Leaf size={24}/>
                                   </div>
                                   <div>
                                       <h3 className="text-xl font-black text-stone-800 tracking-tight">{t('result.organic_title')}</h3>
                                       <p className="text-xs text-green-500 font-bold uppercase">{t('result.organic_sub')}</p>
                                   </div>
                               </div>
                               <div className="bg-green-50/50 p-6 rounded-3xl border border-green-100 text-stone-700 leading-relaxed text-lg">
                                  {treatment.organic_remedy}
                               </div>
                               <div className="mt-4 flex items-center gap-2 text-green-700 font-bold text-sm bg-white border border-green-100 w-fit px-4 py-1.5 rounded-full">
                                  <IndianRupee size={16} /> {t('result.organic_cost')}
                               </div>
                           </div>
                       )}

                       {activeRemedyTab === 'chemical' && (
                           <div className="animate-fade-in space-y-6">
                               <div className="flex items-center gap-4 mb-6">
                                   <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
                                       <Pill size={24}/>
                                   </div>
                                   <div>
                                       <h3 className="text-xl font-black text-stone-800 tracking-tight">{t('result.market_title')}</h3>
                                       <p className="text-xs text-amber-500 font-bold uppercase">{t('result.market_sub')}</p>
                                   </div>
                               </div>
                               <div className="grid md:grid-cols-2 gap-4">
                                  <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200">
                                      <div className="text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-widest">{t('result.active_molecule')}</div>
                                      <div className="text-xl font-black text-stone-900">{treatment.chemical_remedy.name}</div>
                                  </div>
                                  <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100">
                                      <div className="text-[10px] font-bold text-amber-400 uppercase mb-1 tracking-widest">{t('result.market_price')}</div>
                                      <div className="text-xl font-black text-amber-700">{treatment.chemical_remedy.estimated_cost_inr}</div>
                                  </div>
                              </div>
                              
                              <div className="p-6 bg-white border border-stone-100 rounded-2xl shadow-inner">
                                 <h4 className="font-bold text-stone-900 mb-2 flex items-center gap-2"><Info size={16} className="text-amber-500"/> {t('result.usage_guide')}</h4>
                                 <p className="text-stone-600 text-sm mb-4">{t('result.dosage')} <strong>{treatment.chemical_remedy.dosage_ml_per_litre}</strong> {t('result.per_litre')}. {t('result.frequency')}: <strong>{treatment.chemical_remedy.frequency_days}</strong> {t('result.days')}.</p>
                                 <div className="flex flex-wrap gap-2">
                                    {treatment.chemical_remedy.product_brands.map(b => <span key={b} className="bg-stone-100 text-stone-600 px-3 py-1.5 rounded-xl text-xs font-bold border border-stone-200 shadow-sm">{b}</span>)}
                                 </div>
                              </div>

                              <button type="button" onClick={findShops} disabled={isLoadingShops || showOnlineLinks} className="w-full py-5 bg-stone-900 text-white rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-stone-900/40 hover:scale-[1.02] active:scale-95 transition-all no-print">
                                  {isLoadingShops ? <Loader2 className="animate-spin" /> : <ShoppingBag size={20}/>}
                                  {isLoadingShops ? t('result.locating_shops') : t('result.find_shops')}
                              </button>
                              
                              {shopError && (
                                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center text-amber-800 text-sm font-medium">
                                   {shopError}
                                </div>
                              )}

                              {shops.length > 0 && (
                                 <div className="mt-4 bg-stone-50 rounded-3xl border border-stone-200 overflow-hidden divide-y divide-stone-200 shadow-inner">
                                    {shops.map((s, i) => (
                                       <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="flex items-center justify-between p-5 hover:bg-white group transition-colors">
                                          <div className="flex items-center gap-3">
                                              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><MapPin size={18}/></div>
                                              <span className="font-bold text-stone-700">{s.title}</span>
                                          </div>
                                          <ExternalLink size={18} className="text-stone-300 group-hover:text-emerald-500"/>
                                       </a>
                                    ))}
                                 </div>
                              )}

                              {showOnlineLinks && (
                                  <div className="mt-6 animate-fade-in">
                                      <h4 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                          <ShoppingBag size={14}/> Buy Online (Verified Sellers)
                                      </h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          {[
                                              { name: 'Amazon India', url: `https://www.amazon.in/s?k=${encodeURIComponent(treatment.chemical_remedy.name + ' fungicide insecticide')}`, color: 'bg-yellow-400 text-black hover:bg-yellow-500' },
                                              { name: 'Google Shopping', url: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(treatment.chemical_remedy.name + ' agriculture medicine')}`, color: 'bg-blue-600 text-white hover:bg-blue-700' },
                                              { name: 'Flipkart', url: `https://www.flipkart.com/search?q=${encodeURIComponent(treatment.chemical_remedy.name + ' agriculture')}`, color: 'bg-blue-500 text-white hover:bg-blue-600' }
                                          ].map((store, i) => (
                                              <a 
                                                  key={i} 
                                                  href={store.url} 
                                                  target="_blank" 
                                                  rel="noreferrer" 
                                                  className={`flex items-center justify-center gap-2 p-4 rounded-2xl font-bold shadow-md transition-transform hover:-translate-y-0.5 active:scale-95 ${store.color}`}
                                              >
                                                  <Search size={18} /> {store.name}
                                              </a>
                                          ))}
                                      </div>
                                  </div>
                              )}
                           </div>
                       )}
                   </div>
              </div>

              {/* Compact Chat */}
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-stone-100 overflow-hidden no-print">
                  <div className="w-full px-8 py-6 flex items-center justify-between bg-blue-50/50 border-b border-blue-100">
                      <div className="flex items-center gap-4">
                          <div className="p-3 rounded-2xl bg-blue-600 text-white">
                              <Sparkles size={24}/>
                          </div>
                          <div className="text-left">
                              <h3 className="text-lg font-black text-stone-800 tracking-tight">{t('result.chat_title')}</h3>
                              <p className="text-xs text-blue-500 font-bold uppercase">{t('result.chat_sub')}</p>
                          </div>
                      </div>
                  </div>
                  <div className="flex flex-col h-[400px]">
                      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-stone-50 shadow-inner">
                          {messages.map((m) => (
                             <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                 <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm ${m.sender === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white text-stone-800 border border-stone-200 rounded-tl-none'}`}>
                                     {m.text}
                                     {m.sources && m.sources.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1 border-t border-stone-100 pt-2">
                                            {m.sources.map((s, idx) => <a key={idx} href={s} target="_blank" rel="noreferrer" className="text-[10px] bg-stone-100 text-stone-500 px-2 py-1 rounded-full truncate max-w-[120px] hover:bg-emerald-50 hover:text-emerald-600 transition-colors">{new URL(s).hostname}</a>)}
                                        </div>
                                     )}
                                 </div>
                             </div>
                          ))}
                          {isChatLoading && <div className="flex justify-start"><div className="bg-white border p-3 rounded-2xl shadow-sm flex gap-1">...</div></div>}
                          <div ref={chatEndRef} />
                      </div>
                      <form onSubmit={handleSendMessage} className="p-4 bg-white flex gap-2 border-t border-stone-100">
                          <input type="text" value={chatQuery} onChange={(e) => setChatQuery(e.target.value)} placeholder={t('result.chat_placeholder')} className="flex-1 bg-stone-100 border-0 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-emerald-500 transition-all"/>
                          <button type="submit" disabled={!chatQuery.trim() || isChatLoading} className="bg-emerald-600 text-white p-4 rounded-2xl hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"><Send size={20}/></button>
                      </form>
                  </div>
              </div>

          </div>
      </div>
    </div>
    </>
  );
};

export default ResultCard;
