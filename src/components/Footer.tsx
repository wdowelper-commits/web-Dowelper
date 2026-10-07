import React from 'react';
import { MapPin, Phone, MessageCircle, Clock, ShieldCheck, Heart } from 'lucide-react';
import { ShopSettings } from '../types';

interface FooterProps {
  onNavigate: (tab: string) => void;
  onOpenAdmin: () => void;
  onOpenOrderTracker: () => void;
  settings?: ShopSettings;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenAdmin,
  onOpenOrderTracker,
  settings
}) => {
  const shopName = settings?.shop_name || 'Mithas Sweets';
  const tagline = settings?.tagline || 'Fresh Traditional Sweets';
  const shopPhone = settings?.phone || '03027628552';
  const shopWhatsapp = settings?.whatsapp || '923027628552';
  const shopTimings = settings?.timings || 'Mon – Sun: 9:00 AM – 11:30 PM';
  const instagram = settings?.social_instagram || 'https://instagram.com';
  const facebook = settings?.social_facebook || 'https://facebook.com';

  return (
    <footer className="bg-[#2A170A] text-[#F5EBE1] border-t border-[#3D2619] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-amber-100 block">
              {shopName}
            </span>
            <p className="text-xs sm:text-sm text-amber-200/80 max-w-sm leading-relaxed">
              {tagline}. Traditional sweets, barfi, laddus, and gift hampers freshly packed for celebrations and events.
            </p>

            <div className="flex items-center gap-2 pt-2 text-xs text-amber-200/90">
              <span>Fresh Batch Packing</span>
              <span>·</span>
              <span>Pickup & Home Delivery</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Menu & Sections
            </h4>
            <ul className="space-y-2 text-xs text-amber-100/80">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-amber-200 transition-colors cursor-pointer">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('menu')} className="hover:text-amber-200 transition-colors cursor-pointer">
                  Sweets Menu
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('events')} className="hover:text-amber-200 transition-colors cursor-pointer">
                  Bulk & Event Gifting
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-amber-200 transition-colors cursor-pointer">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-amber-200 transition-colors cursor-pointer">
                  Location & Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Service & Orders */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Quick Actions
            </h4>
            <ul className="space-y-2 text-xs text-amber-100/80">
              <li>
                <button onClick={onOpenOrderTracker} className="hover:text-amber-200 transition-colors cursor-pointer">
                  Track Existing Order
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('events')} className="hover:text-amber-200 transition-colors cursor-pointer">
                  Event Box Inquiry
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-amber-200 transition-colors cursor-pointer">
                  Send a Message
                </button>
              </li>
              <li>
                <button onClick={onOpenAdmin} className="hover:text-amber-200 transition-colors cursor-pointer">
                  Store Owner Login
                </button>
              </li>
            </ul>
          </div>

          {/* Store Contact & Timings */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Direct Contact
            </h4>
            <div className="space-y-2 text-xs text-amber-100/80">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <a href={`tel:${shopPhone}`} className="hover:text-amber-200 transition-colors">{shopPhone}</a>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <a href={`https://wa.me/${shopWhatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="hover:text-amber-200 transition-colors">
                  WhatsApp: {shopWhatsapp}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{shopTimings}</span>
              </div>
              <div className="pt-1 text-[11px] text-amber-300/70">
                <span>Pickup details shared on WhatsApp after ordering</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Supported */}
        <div className="pt-8 border-t border-[#3D2619] flex flex-wrap items-center justify-between gap-4 text-xs text-amber-200/70">
          <div>
            <span>Payment Options: </span>
            <strong className="text-amber-100 font-medium">Cash on Delivery · Bank Deposit · JazzCash · Easypaisa</strong>
          </div>
          <div>
            <span>Delivery: </span>
            <strong className="text-amber-100 font-medium">Home Delivery & Store Pickup Available</strong>
          </div>
        </div>

        {/* Bottom Copyright & Dynamic Socials */}
        <div className="pt-6 border-t border-[#3D2619] flex flex-col sm:flex-row items-center justify-between text-xs text-amber-300/60 gap-4">
          <p>© {new Date().getFullYear()} {shopName}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {instagram && (
              <a href={instagram} target="_blank" rel="noreferrer" className="hover:text-amber-200 transition-colors">
                Instagram
              </a>
            )}
            {facebook && (
              <a href={facebook} target="_blank" rel="noreferrer" className="hover:text-amber-200 transition-colors">
                Facebook
              </a>
            )}
            {shopWhatsapp && (
              <a href={`https://wa.me/${shopWhatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="hover:text-amber-200 transition-colors">
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
