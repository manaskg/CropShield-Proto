import React, { useState, useRef, useEffect } from 'react';
import { 
  Phone, Video, Mic, MicOff, VideoOff, X, 
  MessageSquare, ThumbsUp, User, Award, MapPin, 
  Clock, Star, ShieldCheck, GraduationCap, Upload, CheckCircle2 
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

// --- MOCK EXPERT DATA ---
const EXPERTS = [
  {
    id: 1,
    name: "Dr. Anjali Sharma",
    role: "Senior Agronomist",
    specialty: "Crop Pathology",
    experience: "15+ Years",
    rating: 4.9,
    reviews: 1240,
    image: "https://images.unsplash.com/photo-1594708767771-a7502209ff51?auto=format&fit=crop&q=80&w=200&h=200",
    status: "online",
    lang: "Hindi, English"
  },
  {
    id: 2,
    name: "Rajesh Verma",
    role: "Soil Scientist",
    specialty: "Organic Farming",
    experience: "8 Years",
    rating: 4.8,
    reviews: 850,
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200&h=200",
    status: "busy",
    lang: "Hindi, Punjabi"
  },
  {
    id: 3,
    name: "Priya Das",
    role: "Agri-Student Volunteer",
    specialty: "Pest Management",
    experience: "Final Year B.Sc",
    rating: 4.7,
    reviews: 120,
    image: "https://i.pinimg.com/736x/c9/f1/86/c9f186795c739b1c99559a9d91ac088c.jpg",
    status: "online",
    lang: "Bengali, English"
  }
];

const ExpertConnect = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('find');
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  // Call Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Volunteer Form
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Refs for video
  const userVideoRef = useRef(null);

  // --- VIDEO CALL LOGIC ---
  useEffect(() => {
    let interval;
    if (isCallActive) {
      interval = setInterval(() => setCallDuration(prev => prev + 1), 1000);
      
      // Start User Camera
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then(stream => {
            if (userVideoRef.current) userVideoRef.current.srcObject = stream;
          })
          .catch(err => console.error("Camera Error:", err));
      }
    } else {
      setCallDuration(0);
      // Stop Camera
      if (userVideoRef.current && userVideoRef.current.srcObject) {
        const stream = userVideoRef.current.srcObject;
        stream.getTracks().forEach(track => track.stop());
      }
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = (expert) => {
    setSelectedExpert(expert);
    setIsCallActive(true);
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setSelectedExpert(null);
  };

  // --- RENDER: VIDEO CALL MODAL ---
  if (isCallActive && selectedExpert) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col h-full w-full">
        {/* Main Video (Expert) */}
        <div className="relative flex-1 bg-stone-900 overflow-hidden">
          <img 
            src={selectedExpert.image.replace('w=200', 'w=800')} 
            alt="Expert" 
            className="w-full h-full object-cover opacity-80"
          />
           
          {/* Expert Info Overlay */}
          <div className="absolute top-0 left-0 w-full p-6 bg-gradient-to-b from-black/80 to-transparent text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-emerald-500 overflow-hidden">
                  <img src={selectedExpert.image} alt={selectedExpert.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedExpert.name}</h3>
                  <p className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> 
                    {formatTime(callDuration)} • {selectedExpert.role}
                  </p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20">
                HD Quality
              </div>
            </div>
          </div>

          {/* User Video (PIP) */}
          <div className="absolute top-24 right-4 w-32 h-48 bg-black rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
            {!isVideoOff ? (
              <video ref={userVideoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror-mode" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-stone-800 text-white">
                <User size={24} />
              </div>
            )}
          </div>
        </div>

        {/* Controls Bar */}
        <div className="h-24 bg-stone-900 flex items-center justify-center gap-6 px-6 pb-6 pt-2">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-full transition-all ${isMuted ? 'bg-white text-stone-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
            
          <button 
            onClick={handleEndCall}
            className="p-5 rounded-full bg-red-600 text-white shadow-lg shadow-red-600/40 hover:scale-110 transition-transform active:scale-95"
          >
            <Phone size={32} className="rotate-[135deg]" />
          </button>

          <button 
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`p-4 rounded-full transition-all ${isVideoOff ? 'bg-white text-stone-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: MAIN LIST ---
  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-20">
      
      {/* Header */}
      <div className="bg-white px-6 pt-6 pb-4 shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-black text-stone-900">{t('expert.title')}</h1>
        <p className="text-stone-500 text-sm mt-1">{t('expert.subtitle')}</p>
          
        <div className="flex p-1 bg-stone-100 rounded-xl mt-6">
          <button 
            onClick={() => setActiveTab('find')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'find' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            {t('expert.tab.find')}
          </button>
          <button 
            onClick={() => setActiveTab('volunteer')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'volunteer' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            {t('expert.tab.volunteer')}
          </button>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        
        {/* TAB: FIND EXPERTS */}
        {activeTab === 'find' && (
          <div className="space-y-4 animate-fade-in">
            {EXPERTS.map(expert => (
              <div key={expert.id} className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex gap-4">
                  <div className="relative shrink-0">
                    <img src={expert.image} alt={expert.name} className="w-16 h-16 rounded-2xl object-cover" />
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${expert.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                  </div>
                    
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-stone-900 text-lg">{expert.name}</h3>
                        <p className="text-stone-500 text-xs font-medium uppercase tracking-wide">{expert.role}</p>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                        <Star size={12} className="text-amber-500 fill-amber-500" />
                        <span className="text-xs font-bold text-amber-700">{expert.rating}</span>
                      </div>
                    </div>
                        
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-stone-50 text-stone-600 text-xs rounded-lg border border-stone-100 flex items-center gap-1">
                        <Award size={12} /> {expert.specialty}
                      </span>
                      <span className="px-2 py-1 bg-stone-50 text-stone-600 text-xs rounded-lg border border-stone-100 flex items-center gap-1">
                        <MessageSquare size={12} /> {expert.lang}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-stone-50 flex gap-3">
                  <button className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-bold text-sm hover:bg-stone-50 transition-colors">
                    {t('expert.btn.profile')}
                  </button>
                  <button 
                    onClick={() => handleStartCall(expert)}
                    disabled={expert.status !== 'online'}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-transform active:scale-95
                      ${expert.status === 'online' ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-stone-100 text-stone-400 cursor-not-allowed shadow-none'}
                    `}
                  >
                    <Video size={18} />
                    {expert.status === 'online' ? t('expert.btn.call') : t('expert.btn.busy')}
                  </button>
                </div>
              </div>
            ))}

            <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 text-center mt-8">
              <ShieldCheck size={32} className="text-blue-600 mx-auto mb-3" />
              <h3 className="font-bold text-blue-900">{t('expert.verified_title')}</h3>
              <p className="text-blue-700 text-sm mt-1">{t('expert.verified_desc')}</p>
            </div>
          </div>
        )}

        {/* TAB: VOLUNTEER */}
        {activeTab === 'volunteer' && (
          <div className="animate-fade-in">
            {!isSubmitted ? (
              <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-xl">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                    <GraduationCap size={32} />
                  </div>
                  <h2 className="text-xl font-black text-stone-900">{t('expert.vol.title')}</h2>
                  <p className="text-stone-500 text-sm mt-2">{t('expert.vol.subtitle')}</p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); setIsSubmitted(true); }} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">{t('expert.vol.name')}</label>
                    <input type="text" required className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="Enter your full name" />
                  </div>
                    
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">{t('expert.vol.uni')}</label>
                    <input type="text" required className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="University / College Name" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-1">{t('expert.vol.year')}</label>
                      <select className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all">
                        <option>1st Year</option>
                        <option>2nd Year</option>
                        <option>3rd Year</option>
                        <option>4th Year</option>
                        <option>Masters / PhD</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-1">{t('expert.vol.spec')}</label>
                      <select className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all">
                        <option>Agronomy</option>
                        <option>Horticulture</option>
                        <option>Soil Science</option>
                        <option>Entomology</option>
                        <option>Pathology</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1">{t('expert.vol.id')}</label>
                    <div className="border-2 border-dashed border-stone-200 rounded-xl p-6 text-center hover:bg-stone-50 transition-colors cursor-pointer group">
                      <Upload size={24} className="mx-auto text-stone-400 group-hover:text-emerald-500 mb-2 transition-colors" />
                      <p className="text-xs text-stone-500 font-medium">{t('expert.vol.upload')}</p>
                    </div>
                  </div>

                  <button type="submit" className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold shadow-lg hover:bg-stone-800 transition-all active:scale-95">
                    {t('expert.vol.submit')}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-xl text-center animate-fade-in-up">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-2xl font-black text-stone-900 mb-2">{t('expert.vol.success_title')}</h2>
                <p className="text-stone-500 mb-6">{t('expert.vol.success_desc')}</p>
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 inline-block">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">APPLICATION ID</p>
                  <p className="text-lg font-mono font-bold text-stone-800">AGRI-VOL-{Math.floor(Math.random() * 10000)}</p>
                </div>
                <button onClick={() => setIsSubmitted(false)} className="block w-full mt-8 text-emerald-600 font-bold text-sm hover:underline">
                  Submit Another Application
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ExpertConnect;
