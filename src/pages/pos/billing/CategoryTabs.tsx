import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { translateCategory } from '../i18n/productTranslations';

interface CategoryTabsProps {
  categories: string[];
  activeCategory: string;
  onSelect: (category: string) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  activeCategory,
  onSelect,



 }) => {
  const { t, lang } = useLanguage();
  const tabs = ['ALL', ...categories];

  return (
    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
      {tabs.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
            activeCategory === cat
              ? 'bg-[#E3422C] text-white'
              : 'bg-[#fff5f0] text-[#333] hover:bg-[#E3422C]'
          }`}
        >
                              {cat === 'ALL' ? t('category.allItems') : translateCategory(cat, lang)}
        </button>
      ))}
    </div>
  );
};