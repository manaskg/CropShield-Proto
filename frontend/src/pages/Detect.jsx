import React from 'react';
import { Image as ImageIcon, Loader2, AlertCircle, Camera, X, UploadCloud, ScanLine, Radio, CheckCircle2 } from 'lucide-react';
import { useDetect } from '../hooks/useDetect';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import ResultCard from '../components/ResultCard';

const DEMO_IMAGES = [
  { label: 'Select a demo crop...', value: '' },
  { label: 'Potato Early Blight', value: 'https://cdn.mos.cms.futurecdn.net/aTdWJvnG8t43BaAJkFizKY-1280-80.jpg.webp' },
  { label: 'Tomato Hornworm', value: 'https://grangettos.com/cdn/shop/articles/shutterstock_1699161862_1200x.jpg?v=1627418836' },
  { label: 'Corn Rust', value: 'https://lgpress.clemson.edu/wp-content/uploads/sites/3/2022/06/corn-leaf-with-southern-rust-pustules-.jpeg' }
];

const Detect = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  
  const {
    image,
    setImage,
    status,
    result,
    error,
    isDragging,
    setIsDragging,
    fileInputRef,
    cameraInputRef,
    handleFileChange,
    handleDemoSelect,
    processFile,
    resetState,
    analyzeImage,
  } = useDetect();

  return (
    <div className="min-h-screen bg-stone-50 pb-32 pt-28 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-black uppercase tracking-widest mb-4">
            <Radio size={14} className="animate-pulse" /> {t('detect.lab_title')}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-stone-900 mb-4 tracking-tight">
            Crop Scan Analysis
          </h1>
          <p className="text-stone-500 max-w-xl mx-auto text-lg leading-relaxed">
            {t('detect.subtitle')}
          </p>
        </div>

        <div className="grid gap-8">
          
          {/* SCANNER INTERFACE */}
          <div className="bg-white rounded-[3rem] p-6 md:p-10 shadow-2xl shadow-stone-200/50 border border-stone-100 relative overflow-hidden group">
            
            {!image ? (
              <div 
                className={`relative border-2 border-dashed rounded-[2.5rem] h-96 flex flex-col items-center justify-center transition-all duration-500 group
                  ${isDragging ? 'border-emerald-500 bg-emerald-50 scale-[1.01]' : 'border-stone-200 bg-stone-50 hover:bg-white hover:border-emerald-300'}
                `}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) processFile(f);
                }}
              >
                <div className="relative z-10 flex flex-col items-center text-center p-8">
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-emerald-500 mb-8 transition-transform group-hover:scale-110 group-hover:rotate-6">
                    <UploadCloud size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-stone-800 mb-3">
                    {isDragging ? 'Drop it now!' : t('detect.upload')}
                  </h3>
                  <p className="text-stone-400 mb-10 font-medium">{t('detect.drag')}</p>

                  <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()} 
                      className="flex-1 py-4 bg-white border-2 border-stone-100 rounded-2xl font-bold text-stone-600 hover:border-emerald-400 hover:text-emerald-600 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <ImageIcon size={20} /> Browse
                    </button>
                    <button 
                      type="button"
                      onClick={() => cameraInputRef.current?.click()} 
                      className="flex-1 py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-stone-900/20 active:scale-95"
                    >
                      <Camera size={20} /> Camera
                    </button>
                  </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                <input type="file" ref={cameraInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
              </div>
            ) : (
              <div className="relative h-96 rounded-[2.5rem] overflow-hidden bg-stone-100 flex items-center justify-center border-4 border-white shadow-inner group">
                <img src={image} alt="Preview" className="h-full w-full object-contain" />
                <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                  <button 
                    onClick={() => { setImage(null); resetState(); }} 
                    className="bg-white text-red-600 px-8 py-4 rounded-full font-black flex items-center gap-2 shadow-2xl hover:bg-red-50 transition-transform active:scale-90"
                  >
                    <X size={20} /> Remove Photo
                  </button>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-stone-50 pt-10">
              <div className="w-full md:w-auto">
                <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1">
                  {t('detect.sample')}
                </div>
                <select 
                  onChange={handleDemoSelect} 
                  className="w-full md:w-64 px-4 py-4 rounded-2xl bg-stone-50 border-0 focus:ring-2 focus:ring-emerald-500 font-bold text-stone-600 cursor-pointer"
                >
                  {DEMO_IMAGES.map((opt, i) => (
                    <option key={i} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={analyzeImage}
                disabled={!image || status === 'ANALYZING_IMAGE' || status === 'GENERATING_PLAN'}
                className={`w-full md:w-auto px-12 py-5 rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 transition-all shadow-2xl transform
                  ${!image 
                    ? 'bg-stone-100 text-stone-300 shadow-none cursor-not-allowed' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/30 hover:-translate-y-1 active:scale-95'
                  }
                `}
              >
                {status === 'IDLE' && <><ScanLine size={24} /> {t('detect.btn.analyze')}</>}
                {(status === 'ANALYZING_IMAGE' || status === 'GENERATING_PLAN') && (
                  <><Loader2 className="animate-spin" size={24} /> {t('detect.btn.analyzing')}</>
                )}
                {status === 'SUCCESS' && <><CheckCircle2 size={24} /> Finished</>}
                {status === 'ERROR' && "Retry Now"}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-100 p-6 rounded-3xl flex items-start gap-4 animate-fade-in shadow-sm">
              <AlertCircle className="text-red-500 shrink-0 mt-1" size={24} />
              <div>
                <h4 className="font-black text-red-900">Analysis Halted</h4>
                <p className="text-red-700 font-medium text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Result Card */}
          {status === 'SUCCESS' && result && (
            <div className="animate-fade-in-up mt-8">
              {!isAuthenticated && (
                <div className="mb-10 bg-emerald-900 rounded-[2.5rem] p-8 md:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-emerald-900/30 relative overflow-hidden">
                  <div className="relative z-10 text-center md:text-left">
                    <h3 className="text-3xl font-black mb-2">{t('detect.history_title')}</h3>
                    <p className="text-emerald-100/70 font-medium">{t('detect.history_sub')}</p>
                  </div>
                  <button 
                    className="relative z-10 px-10 py-5 bg-white text-emerald-900 rounded-[2rem] font-black hover:bg-emerald-50 transition-all shadow-xl"
                    onClick={() => onNavigate('signup')}
                  >
                    {t('detect.signup_now')}
                  </button>
                </div>
              )}
              <ResultCard data={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Detect;
