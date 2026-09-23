import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export const LanguageToggle: React.FC = () => {
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="inline-flex bg-[#fff5f0] border border-[#E3422C] rounded-full p-1 gap-1">
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          lang === 'en' ? 'bg-[#E3422C] text-white' : 'text-[#333]'
        }`}
      >
        {t('language.english')}
      </button>
      <button
        type="button"
        onClick={() => setLang('hi')}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          lang === 'hi' ? 'bg-[#E3422C] text-white' : 'text-[#333]'
        }`}
      >
        {t('language.hindi')}
      </button>
    </div>
  );
};