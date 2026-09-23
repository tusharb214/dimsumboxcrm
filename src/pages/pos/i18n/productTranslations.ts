import { Language } from './translations';

// Fill in Hindi names for your actual menu items/categories here.
// Anything not listed falls back to the original (English) text — nothing breaks.
const productNameMap: Record<string, string> = {
  'Samosa': 'समोसा',
  'Chicken Biryani': 'चिकन बिरयानी',
  'Paneer Tikka': 'पनीर टिक्का',
  'Masala Dosa': 'मसाला डोसा',
  'Cold Coffee': 'कोल्ड कॉफी',
  'Water Bottle': 'पानी की बोतल',
  // ...add more: 'English Name': 'हिंदी नाम',
};

const categoryNameMap: Record<string, string> = {
  'Beverages': 'पेय पदार्थ',
  'Snacks': 'नाश्ता',
  'Starters': 'स्टार्टर',
  'Main Course': 'मुख्य भोजन',
  'Desserts': 'मिठाई',
  // ...add more: 'English Category': 'हिंदी श्रेणी',
};

export const translateProductName = (name: string, lang: Language): string => {
  if (lang !== 'hi') return name;
  return productNameMap[name] ?? name;
};

export const translateCategory = (category: string, lang: Language): string => {
  if (lang !== 'hi') return category;
  return categoryNameMap[category] ?? category;
};