import React, { useState } from 'react';
import { ShoppingBag, ShieldCheck, Menu as MenuIcon, X, Globe, User, Search } from 'lucide-react';
import { ShopSettings } from '../types';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAdmin: () => void;
  openOrderTracker: () => void;
  openCustomerAuth: () => void;
  settings?: ShopSettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openAdmin,
  openOrderTracker,
  openCustomerAuth,
  settings
}) => {
  const { cartCount, openCart } = useCart();
  const { language, setLanguage, isUrdu, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const shopName = settings?.shop_name || 'Mithas Sweets';
  const tagline = settings?.tagline || 'Fresh Traditional Sweets';
  const freeThreshold = settings?.free_delivery_threshold || 4000;
  const whatsapp = settings?.whatsapp || '923027628552';

  const navLinks = [
    { id: 'home', label: t('nav.home', 'Home', 'ہوم') },
    { id: 'menu', label: t('nav.menu', 'Menu & Sweets', 'مٹھائیاں اور مینو') },
    { id: 'gift_boxes', label: t('nav.gift_boxes', 'Custom Gift Boxes', 'شاہی تحفہ ڈبے') },
    { id: 'events', label: t('nav.events', 'Bulk & Events', 'شادی و تقریبات') },
    { id: 'about', label: t('nav.about', 'About Us', 'ہمارے بارے میں') },
    { id: 'contact', label: t('nav.contact', 'Contact Us', 'رابطہ کریں') },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ur' : 'en');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#EAE2D5] transition-colors">
      {/* Top announcement bar */}
      <div className="bg-[#2A170A] text-[#F5EBE1] text-xs py-1.5 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="hidden sm:inline text-amber-200/90 font-medium">
            {t('bar.announcement', 'Fresh Handcrafted Sweets Delivered To Your Doorstep')}
          </span>
          <span className="mx-auto sm:mx-0">
            {t('bar.free_delivery', 'Free Delivery above')} Rs. {freeThreshold.toLocaleString()} · WhatsApp: {whatsapp}
          </span>
          <div className="hidden md:flex items-center gap-3 text-amber-200/80">
            {/* Language Switch */}
            <button
              onClick={toggleLanguage}
              className="px-2 py-0.5 rounded bg-amber-950/60 hover:bg-amber-900 text-amber-300 font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer border border-amber-800"
            >
              <Globe className="w-3 h-3" />
              <span>{language === 'en' ? 'اردو (Urdu)' : 'English'}</span>
            </button>

            <span>·</span>
            <button
              onClick={openOrderTracker}
              className="hover:text-amber-100 hover:underline transition-colors cursor-pointer"
            >
              {t('nav.track', 'Track Order')}
            </button>
            <span>·</span>
            <button
              onClick={openAdmin}
              className="hover:text-amber-100 hover:underline transition-colors cursor-pointer"
            >
              {t('nav.admin', 'Admin Portal')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Wordmark */}
        <button
          onClick={() => handleNavClick('home')}
          className="text-left group flex flex-col justify-center cursor-pointer"
        >
          <span className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#2A170A] group-hover:text-[#C2410C] transition-colors">
            {shopName}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[#8C6D58] font-medium -mt-0.5">
            {tagline}
          </span>
        </button>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#5A4132]">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className={`transition-colors cursor-pointer py-1 ${
                activeTab === link.id
                  ? 'text-[#C2410C] font-semibold border-b-2 border-[#C2410C]'
                  : 'hover:text-[#2A170A]'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Language Switch */}
          <button
            onClick={toggleLanguage}
            className="md:hidden p-2 rounded-xl text-[#2A170A] hover:bg-[#EAE2D5] text-xs font-bold"
            title="Switch Language"
          >
            {language === 'en' ? 'اردو' : 'EN'}
          </button>


          {/* Customer Profile / Sign In */}
          <button
            onClick={openCustomerAuth}
            className="p-2.5 rounded-xl text-[#2A170A] hover:bg-[#EAE2D5] transition-colors cursor-pointer border border-[#D9C8B4]/60"
            title="Customer Account & Orders"
          >
            <User className="w-4 h-4" />
          </button>

          {/* Cart Trigger */}
          <button
            onClick={openCart}
            className="relative px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#2A170A] hover:bg-[#C2410C] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-98"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">{t('nav.cart', 'Cart')}</span>
            {cartCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#C2410C] text-white text-[10px] font-bold ring-2 ring-[#2A170A]">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-[#2A170A] hover:bg-[#EAE2D5] transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FAF7F2] border-b border-[#EAE2D5] px-4 pt-2 pb-6 space-y-3">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`text-left px-3 py-2 rounded-xl text-sm font-semibold ${
                  activeTab === link.id
                    ? 'bg-[#C2410C] text-white'
                    : 'text-[#2A170A] hover:bg-[#EAE2D5]'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-[#EAE2D5] flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openOrderTracker();
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-[#5A4132] hover:bg-[#EAE2D5] rounded-xl flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-[#C2410C]" />
              <span>{t('nav.track', 'Track Existing Order')}</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openAdmin();
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-[#5A4132] hover:bg-[#EAE2D5] rounded-xl flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-[#C2410C]" />
              <span>{t('nav.admin', 'Admin Management Portal')}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
