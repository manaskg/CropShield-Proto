import { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';

/**
 * Accesses active application language state ('en' | 'hi' | 'bn'),
 * language switcher action, and translation helper function `t(key)`.
 *
 * @returns {object} { language, setLanguage, t }
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default useLanguage;
