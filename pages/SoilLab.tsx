
import React, { useState, useRef } from 'react';
import { FlaskConical, Upload, Droplets, Camera, ScanLine, Loader2, Satellite, CheckCircle2, AlertTriangle, Info, Microscope } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { analyzeSoilLab } from '../services/geminiService';
import { fetchSatelliteSoilData } from '../services/soilService';
import { SoilAnalysisResult, SatelliteSoilData } from '../types';

const SoilLab: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'satellite' | 'vision' | 'ocr'>('satellite');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SoilAnalysisResult | null>(null);
  
  // Data Containers
  const [satData, setSatData] = useState<SatelliteSoilData | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getLanguageName = () => {
    if (language === 'hi') return 'Hindi';
    if (language === 'bn') return 'Bengali';
    return 'English';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => setImage(reader.result as string);
        reader.readAsDataURL(file);
    }
  };

  const handleFetchSatellite = async () => {
      setIsLoading(true);
      if (!navigator.geolocation) { alert("Geolocation needed."); setIsLoading(false); return; }
      
      navigator.geolocation.getCurrentPosition(async (pos) => {
          const data = await fetchSatelliteSoilData(pos.coords.latitude, pos.coords.longitude);
          if (data) {
              setSatData(data);
              // Auto-analyze after fetching, passing the current language
              const res = await analyzeSoilLab('satellite', data, getLanguageName());
              setResult(res);
          }
          setIsLoading(false);
      }, () => setIsLoading(false));
  };

  const handleAnalyzeImage = async (type: 'vision' | 'ocr') => {
      if (!image) return;
      setIsLoading(true);
      const res = await analyzeSoilLab(type, image, getLanguageName());
      setResult(res);
      setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
            
            <div className="text-center mb-10">
                <div className="inline-flex p-4 bg-indigo-100 rounded-full text-indigo-600 mb-4 shadow-sm">
                    <FlaskConical size={32} />
                </div>
                <h1 className="text-3xl font-bold text-stone-900 mb-2">{t('soil.title')}</h1>
                <p className="text-stone-600 max-w-lg mx-auto">{t('soil.subtitle')}</p>
            </div>

            {/* TABS */}
            <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-stone-200 mb-8 max-w-2xl mx-auto">
                <button onClick={() => {setActiveTab('satellite'); setResult(null);}} className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'satellite' ? 'bg-indigo-600 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}>
                    <Satellite size={16} /> {t('soil.tab.satellite')}
                </button>
                <button onClick={() => {setActiveTab('vision'); setResult(null); setImage(null);}} className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'vision' ? 'bg-amber-600 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}>
                    <Camera size={16} /> {t('soil.tab.vision')}
                </button>
                <button onClick={() => {setActiveTab('ocr'); setResult(null); setImage(null);}} className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'ocr' ? 'bg-emerald-600 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}>
                    <ScanLine size={16} /> {t('soil.tab.ocr')}
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                
                {/* INPUT PANEL */}
                <div className="bg-white p-6 rounded-3xl shadow-xl border border-stone-100 h-fit">
                    
                    {/* SATELLITE INPUT */}
                    {activeTab === 'satellite' && (
                        <div className="space-y-6 text-center py-8">
                            <Satellite size={64} className="mx-auto text-indigo-200 mb-4" />
                            <p className="text-stone-600 text-sm px-4">{t('soil.sat.desc')}</p>
                            <button onClick={handleFetchSatellite} disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2">
                                {isLoading ? <Loader2 className="animate-spin" /> : <Satellite size={20} />}
                                {t('soil.btn.fetch')}
                            </button>
                            {satData && (
                                <div className="grid grid-cols-2 gap-3 text-left bg-stone-50 p-4 rounded-xl text-sm">
                                    <div><span className="text-stone-400 text-xs block">{t('soil.label.moisture')}</span> <strong>{satData.moisture}%</strong></div>
                                    <div><span className="text-stone-400 text-xs block">{t('soil.label.temp')}</span> <strong>{satData.temperature}°C</strong></div>
                                    <div className="col-span-2"><span className="text-stone-400 text-xs block">{t('soil.label.region')}</span> <strong>{satData.regionProfile}</strong></div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* VISUAL & OCR INPUT */}
                    {(activeTab === 'vision' || activeTab === 'ocr') && (
                        <div className="space-y-4">
                            <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer border-2 border-dashed border-stone-300 rounded-2xl h-64 flex flex-col items-center justify-center hover:bg-stone-50 transition-colors relative overflow-hidden">
                                {image ? (
                                    <img src={image} alt="Upload" className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <div className={`p-4 rounded-full mb-3 ${activeTab === 'vision' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {activeTab === 'vision' ? <Camera size={24} /> : <ScanLine size={24} />}
                                        </div>
                                        <p className="text-stone-500 font-medium">
                                            {activeTab === 'vision' ? t('soil.upload.vision') : t('soil.upload.ocr')}
                                        </p>
                                    </>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                            
                            <button onClick={() => handleAnalyzeImage(activeTab)} disabled={!image || isLoading} className={`w-full font-bold py-4 rounded-xl shadow-lg text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${activeTab === 'vision' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
                                {isLoading ? <Loader2 className="animate-spin" /> : <Microscope size={20} />}
                                {activeTab === 'vision' ? t('soil.btn.vision') : t('soil.btn.ocr')}
                            </button>
                        </div>
                    )}
                </div>

                {/* RESULT PANEL */}
                <div className="bg-white p-6 rounded-3xl shadow-xl border border-stone-100 relative min-h-[400px]">
                    {result ? (
                        <div className="animate-fade-in space-y-6">
                            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                                <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                                    <CheckCircle2 className="text-emerald-500" /> {t('soil.res.header')}
                                </h2>
                                <span className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-xs font-bold uppercase">{result.source}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-stone-50 rounded-xl">
                                    <div className="text-xs text-stone-400 font-bold uppercase mb-1">{t('soil.res.type')}</div>
                                    <div className="text-lg font-black text-stone-800">{result.soilType}</div>
                                </div>
                                <div className="p-4 bg-stone-50 rounded-xl">
                                    <div className="text-xs text-stone-400 font-bold uppercase mb-1">{t('soil.res.ph')}</div>
                                    <div className="text-lg font-black text-stone-800">{result.phLevel}</div>
                                </div>
                                <div className="p-4 bg-stone-50 rounded-xl">
                                    <div className="text-xs text-stone-400 font-bold uppercase mb-1">{t('soil.res.org')}</div>
                                    <div className="text-lg font-black text-stone-800">{result.organicCarbon}</div>
                                </div>
                                <div className="p-4 bg-stone-50 rounded-xl">
                                    <div className="text-xs text-stone-400 font-bold uppercase mb-1">{t('soil.label.moisture')}</div>
                                    <div className="text-lg font-black text-stone-800">{result.moisture || "N/A"}</div>
                                </div>
                            </div>

                            {result.deficiencies.length > 0 && (
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                    <h3 className="text-red-800 font-bold text-sm mb-2 flex items-center gap-2"><AlertTriangle size={16}/> {t('soil.res.def')}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {result.deficiencies.map((d,i) => <span key={i} className="px-2 py-1 bg-white text-red-600 text-xs font-bold rounded border border-red-100">{d}</span>)}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 className="font-bold text-stone-800 mb-2 flex items-center gap-2"><FlaskConical size={16} className="text-emerald-500"/> {t('soil.res.rec')}</h3>
                                <ul className="space-y-2">
                                    {result.recommendations.map((rec, i) => (
                                        <li key={i} className="text-sm text-stone-600 flex gap-2 items-start">
                                            <span className="text-emerald-500 mt-1">•</span> {rec}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-300">
                            <Microscope size={64} className="mb-4 opacity-50" />
                            <p className="font-medium text-center px-8">{t('soil.res.empty')}</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    </div>
  );
};

export default SoilLab;
