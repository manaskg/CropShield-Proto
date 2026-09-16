import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sprout, Menu, X, ArrowRight, UserCircle, Globe, FlaskConical, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';

const NavBar = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navClass = scrolled || !isHome
    ? 'bg-white/90 backdrop-blur-md shadow-sm text-stone-800'
    : 'bg-transparent text-white';

  const getButtonClass = (path) => {
    const isActive = location.pathname === path;
    if (scrolled || !isHome) {
      return isActive
        ? 'text-emerald-600 font-bold border-b-2 border-emerald-600 pb-1'
        : 'text-stone-600 hover:text-emerald-600 font-medium';
    }
    return isActive
      ? 'text-white font-bold border-b-2 border-white pb-1'
      : 'text-white/90 hover:text-white font-medium';
  };

  const logoColor = scrolled || !isHome ? 'text-emerald-600' : 'text-white';

  const toggleLanguage = () => {
    if (language === 'en') setLanguage('hi');
    else if (language === 'hi') setLanguage('bn');
    else setLanguage('en');
  };

  const getLangLabel = () => {
    if (language === 'en') return 'ENG';
    if (language === 'hi') return 'हिंदी';
    return 'বাংলা';
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          <Link to="/" className="flex items-center cursor-pointer group">
            <div className={`mr-2 transition-transform group-hover:scale-110 duration-300 ${logoColor}`}>
              <Sprout className="h-8 w-8" strokeWidth={2.5} />
            </div>
            <span className={`font-bold text-2xl tracking-tight ${scrolled || !isHome ? 'text-stone-900' : 'text-white'}`}>
              CropShield
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className={`text-sm transition-colors ${getButtonClass('/')}`}>
              {t('nav.home')}
            </Link>
            <Link to="/detect" className={`text-sm transition-colors ${getButtonClass('/detect')}`}>
              {t('nav.analyze')}
            </Link>
            <Link to="/soil" className={`text-sm transition-colors flex items-center gap-1 ${getButtonClass('/soil')}`}>
              <FlaskConical size={16} /> {t('nav.soil')}
            </Link>
            <Link to="/smart-farm" className={`text-sm transition-colors flex items-center gap-1 ${getButtonClass('/smart-farm')}`}>
              <TrendingUp size={16} /> {t('nav.production')}
            </Link>
            <Link to="/expert" className={`text-sm transition-colors flex items-center gap-1 ${getButtonClass('/expert')}`}>
              <Users size={16} /> {t('nav.expert')}
            </Link>

            <button 
              onClick={toggleLanguage}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wide transition-all
              ${scrolled || !isHome 
                ? 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100' 
                : 'border-white/30 bg-white/10 text-white hover:bg-white/20'}`}
            >
              <Globe size={12} />
              {getLangLabel()}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <Link 
                  to="/profile" 
                  className={`flex items-center gap-2.5 pl-2 pr-4 py-1.5 rounded-full transition-all border shadow-sm ${
                    scrolled || !isHome
                      ? 'bg-stone-50 border-stone-200 hover:bg-emerald-50 hover:border-emerald-200 text-stone-800'
                      : 'bg-white/15 border-white/20 hover:bg-white/25 text-white'
                  }`}
                >
                  {user.profileImage ? (
                    <img src={user.profileImage} alt="Avatar" className="w-7 h-7 rounded-full object-cover border border-emerald-400" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold uppercase">
                      {(user.name || 'F')[0]}
                    </div>
                  )}
                  <span className="font-semibold text-sm">{(user.name || 'Farmer').split(' ')[0]}</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className={`text-sm font-medium transition-colors ${scrolled || !isHome ? 'text-stone-600 hover:text-emerald-600' : 'text-white/90 hover:text-white'}`}>
                  {t('nav.login')}
                </Link>
                <Link to="/signup" className="group flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg hover:shadow-emerald-500/30 active:scale-95">
                  {t('nav.signup')}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            )}
          </div>

          <div className="-mr-2 flex md:hidden gap-4 items-center">
            <button onClick={toggleLanguage} className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-bold uppercase tracking-wide ${scrolled || !isHome ? 'border-stone-200 bg-stone-50 text-stone-600' : 'border-white/30 bg-white/10 text-white'}`}>{getLangLabel()}</button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`inline-flex items-center justify-center p-2 rounded-md focus:outline-none ${scrolled || !isHome ? 'text-stone-800' : 'text-white'}`}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-stone-100 shadow-xl absolute w-full">
          <div className="px-4 pt-2 pb-6 space-y-2">
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="block w-full text-left px-3 py-3 text-base font-medium text-stone-600 hover:bg-stone-50 rounded-lg">{t('nav.home')}</Link>
            <Link to="/detect" onClick={() => setIsMenuOpen(false)} className="block w-full text-left px-3 py-3 text-base font-medium text-stone-600 hover:bg-stone-50 rounded-lg">{t('nav.analyze')}</Link>
            <Link to="/soil" onClick={() => setIsMenuOpen(false)} className="block w-full text-left px-3 py-3 text-base font-medium text-stone-600 hover:bg-stone-50 rounded-lg">{t('nav.soil')}</Link>
            <Link to="/smart-farm" onClick={() => setIsMenuOpen(false)} className="block w-full text-left px-3 py-3 text-base font-medium text-stone-600 hover:bg-stone-50 rounded-lg">{t('nav.production')}</Link>
            <Link to="/expert" onClick={() => setIsMenuOpen(false)} className="block w-full text-left px-3 py-3 text-base font-medium text-stone-600 hover:bg-stone-50 rounded-lg">{t('nav.expert')}</Link>
            {user ? (
              <>
                <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="block w-full text-left px-3 py-3 text-base font-medium text-emerald-600 bg-emerald-50 rounded-lg">{t('nav.profile')}</Link>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block w-full text-left px-3 py-3 text-base font-medium text-stone-600 hover:bg-stone-50 rounded-lg">{t('nav.login')}</Link>
                <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="block w-full text-left px-3 py-3 text-base font-medium text-emerald-600 bg-emerald-50 rounded-lg">{t('nav.signup')}</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
