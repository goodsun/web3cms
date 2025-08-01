import React, { createContext, useContext, useState, useEffect } from 'react';

const I18nContext = createContext();

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

export const I18nProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Load saved language preference or default to 'en'
    return localStorage.getItem('language') || 'en';
  });
  const [translations, setTranslations] = useState({});

  // Load translations when language changes
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const module = await import(`../locales/${language}.json`);
        setTranslations(module.default);
      } catch (error) {
        console.error(`Failed to load ${language} translations:`, error);
        // Fallback to English if language file not found
        if (language !== 'en') {
          const enModule = await import('../locales/en.json');
          setTranslations(enModule.default);
        }
      }
    };

    loadTranslations();
  }, [language]);

  // Change language and save preference
  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  // Translation function
  const t = (key, fallback) => {
    // Navigate through nested keys (e.g., "settings.title")
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || fallback || key;
  };

  const value = {
    language,
    changeLanguage,
    t,
    translations
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export default I18nContext;