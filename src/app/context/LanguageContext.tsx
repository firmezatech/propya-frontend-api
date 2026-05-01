"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define types for the context
type Locale = 'en' | 'pt';

interface LanguageContextType {
  locale: Locale;
  changeLanguage: (newLocale: Locale) => void;
}

interface LanguageProviderProps {
  children: ReactNode;
}

// Create context with default value
const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  changeLanguage: () => {}
});

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [locale, setLocale] = useState<Locale>('en'); // Default to Portuguese

  // Load saved language preference from localStorage if available
  useEffect(() => {
    const savedLocale = localStorage.getItem('userLanguage');
    if (savedLocale === 'en' || savedLocale === 'pt') {
      setLocale(savedLocale);
    }
  }, []);

  const changeLanguage = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem('userLanguage', newLocale);
    // You could add additional logic here like refreshing translations
  };

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  return context;
};
