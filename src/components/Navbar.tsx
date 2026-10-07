import React, { useState } from 'react';
import { ShoppingBag, Sparkles, ShieldCheck, Menu as MenuIcon, X } from 'lucide-react';
import { ShopSettings } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  openCart: () => void;
  openAiConcierge: () => void;
  openAdmin: () => void;
  openOrderTracker: () => void;
  settings?: ShopSettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  openCart,
  openAiConcierge,
  openAdmin,
  openOrderTracker,
  settings
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const shopName = settings?.shop_name || 'Mithas Sweets';
  const tagline = settings?.tagline || 'Fresh Traditional Sweets';
  const freeThreshold = settings?.free_delivery_threshold || 4000;
  const whatsapp = settings?.whatsapp || '923027628552';

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'menu', label: 'Menu & Sweets' },
    { id: 'events', label: 'Bulk & Events' },
    { id: 'about', label: 'About Us' },
    { id: 'contact', label: 'Contact Us' },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#EAE2D5] transition-colors">
      {/* Top micro announcement bar - dynamic from settings */}
      <div className="bg-[#2A170A] text-[#F5EBE1] text-xs py-1.5 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="hidden sm:inline text-amber-200/90 font-medium">
            Fresh Handcrafted Sweets Delivered To Your Doorstep
          </span>
          <span className="mx-auto sm:mx-0">
            Free Delivery on orders above Rs. {freeThreshold.toLocaleString()} · WhatsApp: {whatsapp}
          </span>
          <div className="hidden md:flex items-center gap-4 text-amber-200/80">
            <button
              onClick={openOrderTracker}
              className="hover:text-amber-100 hover:underline transition-colors cursor-pointer"
            >
              Track Order
            </button>
            <span>·</span>
            <button
              onClick={openAdmin}
              className="hover:text-amber-100 hover:underline transition-colors cursor-pointer"
            >
              Admin Portal
            </button>
          </div>
        </div>
      </div>

      {/* Main Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Zone 1: Brand Wordmark (Configured from Settings) */}
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

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5A4132]">
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

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* AI Sweet Concierge */}
          <button
            onClick={openAiConcierge}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#854D0E] bg-[#FEF3C7] hover:bg-[#FDE68A] border border-[#FCD34D] rounded-lg transition-all shadow-xs cursor-pointer whitespace-nowrap"
            title="Calculate sweet portions for weddings or celebrations"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
            <span className="hidden sm:inline">AI Sweet Sommelier</span>
            <span className="sm:hidden">AI Box</span>
          </button>

          {/* Cart Button */}
          <button
            onClick={openCart}
            aria-label={`View shopping cart, ${cartCount} items`}
            className="relative flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-[#C2410C] hover:bg-[#9A3412] active:scale-95 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold bg-[#FAF7F2] text-[#9A3412] rounded-full tabular-nums">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile hamburger menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#2A170A] hover:bg-[#EAE2D5] rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#EAE2D5] bg-[#FAF7F2] px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className={`block w-full text-left px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                activeTab === link.id
                  ? 'bg-[#EAE2D5] text-[#C2410C] font-semibold'
                  : 'text-[#4A3223] hover:bg-[#F2ECE1]'
              }`}
            >
              {link.label}
            </button>
          ))}
          <div className="pt-3 border-t border-[#EAE2D5] flex items-center justify-between text-xs text-[#6B5544] px-1">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openOrderTracker();
              }}
              className="py-1 hover:text-[#C2410C]"
            >
              Track Existing Order
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openAdmin();
              }}
              className="py-1 hover:text-[#C2410C] flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Owner Admin
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
