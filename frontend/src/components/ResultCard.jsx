import React, { useState, useEffect, useRef } from 'react';
import {
  Share2,
  Printer,
  Check,
  PhoneCall,
  Leaf,
  Pill,
  MapPin,
  ExternalLink,
  Loader2,
  Send,
  AlertCircle,
  Sparkles,
  Thermometer,
  Droplets,
  Wind,
  CloudSun,
} from 'lucide-react';
import { aiApi } from '../api/aiApi';
import { useLanguage } from '../hooks/useLanguage';
import LiveFarmerAgent from './LiveFarmerAgent';
import { StatusBadge } from './common/StatusBadge';
import { MetricCard } from './common/MetricCard';
import { AudioPlayerButton } from './common/AudioPlayerButton';

/**
 * ResultCard Component - Displays detailed plant pathology diagnosis,
 * localized agronomic remedies, environmental telemetry, and follow-up AI QA.
 */
const ResultCard = ({ data }) => {
  const { identification = {}, treatment = {}, weather } = data || {};
  const { t, language } = useLanguage();

  const [activeRemedyTab, setActiveRemedyTab] = useState('organic');
  const [isLiveAgentOpen, setIsLiveAgentOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(null);

  // Follow-up Chat State
  const [chatQuery, setChatQuery] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);

  // Agro Supply Links
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const [showOnlineLinks, setShowOnlineLinks] = useState(false);

  useEffect(() => {
    const pestName = treatment.pest_name_local || treatment.pest_name || 'Plant Health';
    const greet =
      language === 'hi'
        ? `नमस्ते! मैं आपकी ${pestName} समस्या के बारे में जानता हूँ। कोई प्रश्न पूछें?`
        : language === 'bn'
        ? `নমস্কার! আমি আপনার ${pestName} সমস্যা সম্পর্কে জানি। কোনো প্রশ্ন থাকলে জিজ্ঞাসা করুন!`
        : `Hello! I'm here to help with ${treatment.pest_name || 'your crop'}. Ask me anything!`;
    setMessages([{ id: '1', sender: 'ai', text: greet }]);
  }, [treatment.pest_name, language, treatment.pest_name_local]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatQuery.trim() || isChatLoading) return;

    const query = chatQuery.trim();
    setChatQuery('');
    setMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'user', text: query }]);
    setIsChatLoading(true);

    try {
      const langName = language === 'hi' ? 'Hindi' : language === 'bn' ? 'Bengali' : 'English';
      const res = await aiApi.askQuestion(
        query,
        {
          crop: identification.crop,
          pest: treatment.pest_name,
          remedy: treatment.organic_remedy,
          chemical: treatment.chemical_remedy?.name,
        },
        langName
      );

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: res.text,
          sources: res.sourceUrls,
        },
      ]);
    } catch (_) {
      setMessages((prev) => [
        ...prev,
        { id: 'err', sender: 'ai', text: 'Could not process question. Please try again.' },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleShare = () => {
    const title = `CropShield: ${identification.crop} - ${treatment.pest_name_local || treatment.pest_name}`;
    if (navigator.share) {
      navigator
        .share({
          title,
          text: `Diagnosis: ${identification.crop} has ${treatment.pest_name_local || treatment.pest_name}. Recommended: ${treatment.organic_remedy}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShareFeedback(t('result.copied') || 'Copied!');
      setTimeout(() => setShareFeedback(null), 2500);
    }
  };

  const isHealthy = identification.pest_label?.toLowerCase() === 'healthy';
  const confidencePercent = Math.round((identification.confidence || 0.9) * 100);

  return (
    <div id="analysis-results" className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      {/* 1. HERO REPORT HEADER */}
      <section className="bg-white rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-xl shadow-stone-200/50 border border-stone-100 relative overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <StatusBadge variant="healthy">{t('result.report_header') || 'Diagnosis Report'}</StatusBadge>
            <StatusBadge variant={isHealthy ? 'healthy' : 'warning'}>
              {t('result.confidence') || 'Confidence'}: {confidencePercent}%
            </StatusBadge>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center gap-2 text-sm font-bold cursor-pointer"
              aria-label="Share diagnosis report"
            >
              {shareFeedback ? <Check size={16} className="text-emerald-600" /> : <Share2 size={16} />}
              <span className="hidden sm:inline">{shareFeedback || t('result.share') || 'Share'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="p-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center gap-2 text-sm font-bold cursor-pointer"
              aria-label="Print report"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">{t('result.print') || 'Print'}</span>
            </button>
          </div>
        </header>

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

            {/* Action Buttons: Live Expert & Audio Explanation */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsLiveAgentOpen(true)}
                className="flex items-center gap-3 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-black text-sm shadow-xl shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <PhoneCall size={20} className="animate-bounce" />
                <span>{t('result.live_expert') || 'Live Voice AI Doctor'}</span>
              </button>

              <AudioPlayerButton
                identification={identification}
                treatment={treatment}
                weather={weather}
              />
            </div>
          </div>

          {/* Environmental Telemetry Panel */}
          {weather && (
            <div className="bg-gradient-to-br from-emerald-50 to-stone-50 rounded-3xl p-6 border border-emerald-100/60 shadow-inner">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 mb-4 flex items-center gap-2">
                <CloudSun size={18} /> {t('result.field_env') || 'Field Environment'}
              </h4>
              <div className="grid grid-cols-2 gap-3.5">
                <MetricCard
                  label={t('result.temp') || 'Temperature'}
                  value={`${weather.temperature}°C`}
                  icon={<Thermometer size={18} />}
                />
                <MetricCard
                  label={t('result.humidity') || 'Humidity'}
                  value={`${weather.humidity}%`}
                  icon={<Droplets size={18} />}
                />
                <MetricCard
                  label={t('result.condition') || 'Condition'}
                  value={weather.condition}
                  icon={<CloudSun size={18} />}
                />
                <MetricCard
                  label={t('result.wind') || 'Wind Speed'}
                  value={weather.windSpeed || '12 km/h'}
                  icon={<Wind size={18} />}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. REMEDIES TABS (Organic vs Chemical) */}
      <section className="bg-white rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-xl shadow-stone-200/50 border border-stone-100">
        <div className="flex border-b border-stone-100 pb-4 mb-8 gap-4">
          <button
            onClick={() => setActiveRemedyTab('organic')}
            className={`flex items-center gap-2 pb-2 text-lg font-black transition-all border-b-2 cursor-pointer ${
              activeRemedyTab === 'organic'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            <Leaf size={20} /> {t('result.organic_title') || 'Organic & Sustainable'}
          </button>
          <button
            onClick={() => setActiveRemedyTab('chemical')}
            className={`flex items-center gap-2 pb-2 text-lg font-black transition-all border-b-2 cursor-pointer ${
              activeRemedyTab === 'chemical'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            <Pill size={20} /> {t('result.market_title') || 'Recommended Agrochemicals'}
          </button>
        </div>

        {activeRemedyTab === 'organic' ? (
          <div className="p-6 rounded-3xl bg-emerald-50/60 border border-emerald-100">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 block mb-2">
              {t('result.organic_cost') || 'Natural Formulation (Desi Jugad)'}
            </span>
            <p className="text-stone-800 text-lg leading-relaxed font-medium">
              {treatment.organic_remedy}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-amber-50/60 border border-amber-100 space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-700 block">
                    {t('result.active_molecule') || 'Molecule / Formulation'}
                  </span>
                  <h4 className="text-2xl font-black text-stone-900">
                    {treatment.chemical_remedy?.name}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-700 block">
                    {t('result.market_price') || 'Estimated Market Cost'}
                  </span>
                  <span className="text-xl font-black text-emerald-700">
                    {treatment.chemical_remedy?.estimated_cost_inr}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-amber-200/50">
                <div>
                  <span className="text-xs text-stone-400 font-bold block">{t('result.usage_guide') || 'Dosage'}</span>
                  <p className="font-bold text-stone-800">{treatment.chemical_remedy?.dosage_ml_per_litre}</p>
                </div>
                <div>
                  <span className="text-xs text-stone-400 font-bold block">{t('result.frequency') || 'Frequency'}</span>
                  <p className="font-bold text-stone-800">{treatment.chemical_remedy?.frequency_days}</p>
                </div>
              </div>

              {/* Find Verified Indian Suppliers */}
              <div className="pt-4">
                <button
                  onClick={() => {
                    setIsLoadingShops(true);
                    setTimeout(() => {
                      setShowOnlineLinks(true);
                      setIsLoadingShops(false);
                    }, 600);
                  }}
                  disabled={isLoadingShops}
                  className="w-full py-3 bg-white border border-amber-300 hover:bg-amber-100 text-stone-900 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  {isLoadingShops ? <Loader2 className="animate-spin" size={18} /> : <MapPin size={18} />}
                  <span>{t('result.find_shops') || 'Find Verified Indian Agri Suppliers'}</span>
                </button>
              </div>

              {showOnlineLinks && (
                <div className="mt-4 p-4 bg-white rounded-2xl border border-stone-200 space-y-2 animate-fade-in">
                  <h5 className="font-bold text-stone-800 text-sm">Verified Suppliers:</h5>
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

        {/* Vital Safety Warning */}
        {treatment.safety && (
          <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <div>
              <h5 className="text-xs font-black uppercase tracking-wider text-red-900">
                {t('result.safety_rule') || 'Safety Precaution'}
              </h5>
              <p className="text-red-800 font-medium text-sm mt-1">{treatment.safety}</p>
            </div>
          </div>
        )}
      </section>

      {/* 3. KISAN MITRA AI Q&A CHAT */}
      <section className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-xl shadow-stone-200/50 border border-stone-100">
        <h4 className="text-xl font-black text-stone-900 mb-1 flex items-center gap-2">
          <Sparkles className="text-emerald-600" size={20} /> {t('result.chat_title') || 'Ask Kisan AI Doctor'}
        </h4>
        <p className="text-stone-400 text-sm mb-6">
          {t('result.chat_sub') || 'Ask follow-up questions regarding dosage, fertilizer timing, or prevention.'}
        </p>

        <div className="h-64 overflow-y-auto space-y-4 mb-4 p-4 bg-stone-50 rounded-2xl border border-stone-100">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-md p-4 rounded-2xl text-sm ${
                  m.sender === 'user'
                    ? 'bg-emerald-600 text-white font-medium rounded-br-none'
                    : 'bg-white text-stone-800 font-medium border border-stone-200/80 shadow-xs rounded-bl-none'
                }`}
              >
                <p>{m.text}</p>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-stone-100 text-[11px] text-stone-500">
                    <span className="font-bold block mb-1">Sources:</span>
                    {m.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:underline block truncate"
                      >
                        {src}
                      </a>
                    ))}
                  </div>
                )}
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
            placeholder={t('result.chat_placeholder') || 'Type your question here...'}
            className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!chatQuery.trim() || isChatLoading}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-2xl font-bold transition-all shadow-md cursor-pointer"
            aria-label="Submit question"
          >
            <Send size={18} />
          </button>
        </form>
      </section>

      {/* Live Expert Modal */}
      <LiveFarmerAgent
        isOpen={isLiveAgentOpen}
        onClose={() => setIsLiveAgentOpen(false)}
        analysisData={data}
      />
    </div>
  );
};

export default ResultCard;
