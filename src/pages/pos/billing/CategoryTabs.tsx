import React from 'react';

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
          {cat === 'ALL' ? 'All Items' : cat}
        </button>
      ))}
    </div>
  );
};