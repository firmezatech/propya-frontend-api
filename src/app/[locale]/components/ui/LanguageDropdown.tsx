"use client";

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { useLanguage } from "../../../context/LanguageContext";
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';

// Define types
interface Language {
  name: string;
  code: 'en' | 'pt';
}

const LanguageDropdown = () => {
  const router = useRouter();
  const pathname = usePathname();
  
  const common = useTranslations('Common');

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { locale, changeLanguage } = useLanguage();

  const languages: Language[] = [
    { name: common('enLanguage'), code: 'en' },
    { name: common('ptLanguage'), code: 'pt' }
  ];

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[1]; // Default to Portuguese

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleLanguageSelect = (language: Language) => {
    if (language.code === locale) {
      setIsOpen(false);
      return;
    }
    
    // Update the language in the context
    changeLanguage(language.code);
    setIsOpen(false);

    if (pathname) {
      // Get the path segments and replace the locale
      const segments = pathname.split('/');
      // If the first segment is a locale, replace it; otherwise, add the locale
      if (segments.length > 1 && (segments[1] === 'en' || segments[1] === 'pt')) {
        segments[1] = language.code;
      } else {
        segments.splice(1, 0, language.code);
      }
      
      const newPath = segments.join('/');
      router.push(newPath);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center justify-between text-sm px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md w-48 hover:bg-gray-50 focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="flex items-center">
          <Globe className="w-5 h-5 mr-2 text-gray-500" />
          {currentLanguage.name}
        </span>
        <ChevronDown className="w-4 h-4 ml-2 text-gray-500" />
      </button>

      {isOpen && (
        <div
          className="absolute z-10 w-48 mt-1 bg-white border border-gray-200 rounded-md shadow-lg"
          role="menu"
          aria-orientation="vertical"
        >
          {languages.map((language) => (
            <div
              key={language.code}
              onClick={() => handleLanguageSelect(language)}
              className={`flex items-center px-4 py-3 cursor-pointer ${
                locale === language.code ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              }`}
              role="menuitem"
            >
              <Globe className="w-5 h-5 mr-2 text-gray-500" />
              <span>{language.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageDropdown;