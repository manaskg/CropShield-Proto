
import React, { useState } from 'react';
import { TrendingUp, Sprout, Ruler, CloudSun, Loader2, Calendar, Award, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { generateYieldPlan } from '../services/geminiService';
import { YieldPlan } from '../types';

const SmartFarm: React.FC = () => {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({ crop: '', acres: '', season: 'Kharif' });
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<YieldPlan | null>(null);

  const getLanguageName = () => {
    if (language === 'hi') return 'Hindi';
    if (language === 'bn') return 'Bengali';
    return 'English';
  };

  const handleGenerate = async () => {
    if (!formData.crop || !formData.acres) return;
    setIsLoading(true);
    try {
        const res = await generateYieldPlan(formData.crop, formData.acres, formData.season, getLanguageName());
        setPlan(res);
    } catch (e) {
        alert("Planning failed. Try again.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
            
            <div className="text-center mb-10">
                <div className="inline-flex p-4 bg-emerald-100 rounded-full text-emerald-600 mb-4 shadow-sm">
                    <TrendingUp size={32} />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-2">{t('yield.title')}</h1>
                <p className="text-stone-600 max-w-lg mx-auto">{t('yield.subtitle')}</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                
                {/* CONFIGURATION */}
                <div className="lg:col-span-1 bg-white p-8 rounded-3xl shadow-xl border border-stone-100 h-fit">
                    <h3 className="font-bold text-stone-800 mb-6 uppercase tracking-wider text-sm border-b border-stone-100 pb-2">{t('yield.config_title')}</h3>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-2">{t('yield.label.crop')}</label>
                            <div className="relative">
                                <Sprout className="absolute left-4 top-3.5 text-stone-400 w-5 h-5" />
                                <input type="text" value={formData.crop} onChange={e => setFormData({...formData, crop: e.target.value})} className="w-full pl-12 pr-4 py-3.5 border border-stone-200 rounded-xl bg-stone-50 focus:ring-2 focus:ring-emerald-500 outline-none font-medium" placeholder="e.g. Rice, Wheat" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-2">{t('yield.label.land')}</label>
                            <div className="relative">
                                <Ruler className="absolute left-4 top-3.5 text-stone-400 w-5 h-5" />
                                <input type="number" value={formData.acres} onChange={e => setFormData({...formData, acres: e.target.value})} className="w-full pl-12 pr-4 py-3.5 border border-stone-200 rounded-xl bg-stone-50 focus:ring-2 focus:ring-emerald-500 outline-none font-medium" placeholder="e.g. 5" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-2">{t('yield.label.season')}</label>
                            <div className="relative">
                                <CloudSun className="absolute left-4 top-3.5 text-stone-400 w-5 h-5" />
                                <select value={formData.season} onChange={e => setFormData({...formData, season: e.target.value})} className="w-full pl-12 pr-4 py-3.5 border border-stone-200 rounded-xl bg-stone-50 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none font-medium">
                                    <option value="Kharif">Kharif (Monsoon)</option>
                                    <option value="Rabi">Rabi (Winter)</option>
                                    <option value="Zaid">Zaid (Summer)</option>
                                </select>
                            </div>
                        </div>

                        <button 
                            onClick={handleGenerate} 
                            disabled={isLoading || !formData.crop || !formData.acres} 
                            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <Award size={20} />}
                            {t('yield.btn.generate')}
                        </button>
                    </div>
                </div>

                {/* OUTPUT */}
                <div className="lg:col-span-2">
                    {plan ? (
                        <div className="space-y-6 animate-fade-in">
                            
                            {/* HERO CARD */}
                            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="text-emerald-200 text-xs font-bold uppercase tracking-widest mb-1">{t('yield.res.projected')}</div>
                                            <h2 className="text-5xl font-black">{plan.expectedYield}</h2>
                                        </div>
                                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                                            <TrendingUp size={32} className="text-white"/>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 text-emerald-100 text-sm font-medium">
                                        <span className="bg-black/20 px-3 py-1 rounded-full">{plan.crop}</span>
                                        <span className="bg-black/20 px-3 py-1 rounded-full">{plan.season}</span>
                                        <span className="bg-black/20 px-3 py-1 rounded-full">{plan.landSize} Acres</span>
                                    </div>
                                </div>
                            </div>

                            {/* TIMELINE */}
                            <div className="bg-white rounded-3xl p-8 shadow-xl border border-stone-100">
                                <h3 className="text-lg font-bold text-stone-900 mb-8 flex items-center gap-2"><Calendar className="text-emerald-600"/> {t('yield.res.timeline')}</h3>
                                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-stone-200 before:to-transparent">
                                    {plan.timeline.map((stage, idx) => (
                                        <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-emerald-100 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                                <span className="text-emerald-600 text-xs font-bold">{idx + 1}</span>
                                            </div>
                                            
                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-stone-200 shadow-sm transition-all hover:border-emerald-300">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-bold text-emerald-600 text-sm">{stage.stage}</span>
                                                </div>
                                                <div className="text-stone-800 font-bold mb-2">{stage.action}</div>
                                                <div className="text-xs text-stone-500 bg-stone-50 p-2 rounded border border-stone-100">
                                                    <strong>{t('yield.res.fert')}:</strong> {stage.fertilizer}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* TIPS */}
                            <div className="bg-amber-50 rounded-3xl p-8 border border-amber-100">
                                <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2"><Award size={20}/> {t('yield.res.tips')}</h3>
                                <ul className="space-y-3">
                                    {plan.generalTips.map((tip, i) => (
                                        <li key={i} className="flex gap-3 text-amber-800 text-sm bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
                                            <CheckCircle size={18} className="shrink-0 mt-0.5 text-amber-500" />
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                        </div>
                    ) : (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white/50 rounded-3xl border-2 border-dashed border-stone-200 text-stone-400">
                            <Sprout size={64} className="mb-4 opacity-20" />
                            <p className="font-medium text-lg">{t('yield.empty')}</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    </div>
  );
};

export default SmartFarm;
