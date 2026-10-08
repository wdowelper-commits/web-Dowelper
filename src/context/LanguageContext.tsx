import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isUrdu: boolean;
  t: (key: string, enDefault: string, urDefault?: string) => string;
}

const translations: Record<string, { en: string; ur: string }> = {
  // Navigation
  'nav.home': { en: 'Home', ur: 'ہوم' },
  'nav.menu': { en: 'Menu & Sweets', ur: 'مٹھائیاں اور مینو' },
  'nav.events': { en: 'Bulk & Events', ur: 'شادی و تقریبات' },
  'nav.gift_boxes': { en: 'Custom Gift Boxes', ur: 'شاہی تحفہ ڈبے' },
  'nav.about': { en: 'About Us', ur: 'ہمارے بارے میں' },
  'nav.contact': { en: 'Contact Us', ur: 'رابطہ کریں' },
  'nav.track': { en: 'Track Order', ur: 'آرڈر ٹریک کریں' },
  'nav.admin': { en: 'Admin Portal', ur: 'ایڈمن پورٹل' },
  'nav.cart': { en: 'Cart', ur: 'ٹوکری' },

  // Micro bar
  'bar.announcement': { en: 'Fresh Handcrafted Sweets Delivered To Your Doorstep', ur: 'تازہ اور خالص دیسی گھی کی مٹھائیاں آپ کی دہلیز تک' },
  'bar.free_delivery': { en: 'Free Delivery above', ur: 'مفت ڈلیوری سے زائد' },

  // Hero
  'hero.badge': { en: 'Pure Desi Ghee Confectionery', ur: 'خالص دیسی گھی کی روایتی مٹھائیاں' },
  'hero.title': { en: 'Sweetening Life’s Celebrations With Royal Taste', ur: 'شاہی ذائقے کے ساتھ زندگی کی ہر خوشی کو میٹھا بنائیں' },
  'hero.desc': { en: 'Handcrafted fresh daily with pure khoya, saffron, and rich dry fruits. Experience the timeless taste of authentic Pakistani mithai.', ur: 'روزانہ تازہ کھوئے، زعفران اور میوہ جات سے تیار کردہ۔ روایتی پاکستانی مٹھائی کا لازوال ذائقہ۔' },
  'hero.cta_menu': { en: 'Explore Menu', ur: 'مینو دیکھیں' },
  'hero.cta_gift': { en: 'Custom Gift Boxes', ur: 'گفٹ باکس تیار کریں' },

  // Products
  'prod.out_of_stock': { en: 'Out of Stock', ur: 'ختم ہو چکا ہے' },
  'prod.low_stock': { en: 'Only a little left', ur: 'تھوڑا سا باقی ہے' },
  'prod.add_to_cart': { en: 'Add to Cart', ur: 'ٹوکری میں شامل کریں' },
  'prod.added': { en: 'Added!', ur: 'شامل کر دیا!' },
  'prod.per_kg': { en: 'per kg', ur: 'فی کلو' },
  'prod.per_piece': { en: 'per piece', ur: 'فی دانہ' },
  'prod.portion': { en: 'Select Portion', ur: 'مقدار منتخب کریں' },
  'prod.quick_view': { en: 'Quick View', ur: 'تفصیلات دیکھیں' },

  // Cart & Checkout
  'cart.title': { en: 'Your Sweets Cart', ur: 'آپ کی مٹھائیوں کی ٹوکری' },
  'cart.empty': { en: 'Your cart is empty', ur: 'آپ کی ٹوکری خالی ہے' },
  'cart.subtotal': { en: 'Subtotal', ur: 'میزان' },
  'cart.delivery_fee': { en: 'Delivery Fee', ur: 'ڈلیوری فیس' },
  'cart.total': { en: 'Total Amount', ur: 'کل رقم' },
  'cart.checkout': { en: 'Proceed to Checkout', ur: 'آرڈر مکمل کریں' },
  'cart.free': { en: 'FREE', ur: 'مفت' },
  'cart.home_delivery': { en: 'Home Delivery', ur: 'ہوم ڈلیوری' },
  'cart.store_pickup': { en: 'Store Pickup', ur: 'دکان سے وصولی' },
  'cart.delivery_slot': { en: 'Delivery Slot', ur: 'ڈلیوری کا وقت' },
  'cart.slot_morning': { en: 'Morning Slot (10 AM - 2 PM)', ur: 'صبح کا وقت (10 بجے سے 2 بجے)' },
  'cart.slot_evening': { en: 'Evening Slot (4 PM - 9 PM)', ur: 'شام کا وقت (4 بجے سے 9 بجے)' },
  'cart.coupon_code': { en: 'Coupon Code', ur: 'کوپن کوڈ' },
  'cart.apply': { en: 'Apply', ur: 'لاگو کریں' },
  'cart.payment_method': { en: 'Payment Method', ur: 'ادائیگی کا طریقہ' },
  'cart.cod': { en: 'Cash on Delivery (COD)', ur: 'کیش آن ڈلیوری' },
  'cart.bank': { en: 'Direct Bank Transfer', ur: 'بینک ٹرانسفر' },
  'cart.jazzcash': { en: 'JazzCash', ur: 'جاز کیش' },
  'cart.easypaisa': { en: 'EasyPaisa', ur: 'ایزی پیسہ' },
  'cart.place_order': { en: 'Place Order Now', ur: 'آرڈر بک کریں' },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  isUrdu: false,
  t: (k, en) => en
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('mithas_lang');
      return (saved === 'ur' ? 'ur' : 'en') as Language;
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('mithas_lang', lang);
    } catch {}
  };

  useEffect(() => {
    const isUr = language === 'ur';
    document.documentElement.lang = language;
    document.documentElement.dir = isUr ? 'rtl' : 'ltr';
    if (isUr) {
      document.body.classList.add('font-urdu');
    } else {
      document.body.classList.remove('font-urdu');
    }
  }, [language]);

  const t = (key: string, enDefault: string, urDefault?: string): string => {
    if (language === 'ur') {
      if (translations[key]?.ur) return translations[key].ur;
      if (urDefault) return urDefault;
    }
    return translations[key]?.en || enDefault;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isUrdu: language === 'ur', t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
