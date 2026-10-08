import React from 'react';
import { ShopSettings } from '../types';
import { Store, ShieldCheck, Heart, Sparkles, MapPin, Phone } from 'lucide-react';

interface AboutSectionProps {
  settings?: ShopSettings;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ settings }) => {
  const shopName = settings?.shop_name || 'Mithas Sweets';
  const tagline = settings?.tagline || 'Fresh Traditional Sweets';
  const aboutText = settings?.about_text || 'Welcome to our shop! We offer freshly prepared traditional sweets, barfi, laddus, and gift hampers for celebrations and special occasions. All orders are packed fresh upon confirmation.';
  const phone = settings?.phone || '03027628552';
  const whatsapp = settings?.whatsapp || '923027628552';
  const timings = settings?.timings || 'Monday – Sunday: 9:00 AM – 11:30 PM';

  return (
    <div className="py-12 md:py-20 bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Story Intro */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F5EBE1] border border-[#E6D7C7] rounded-full text-xs font-semibold text-[#8C4A1A]">
              <Store className="w-3.5 h-3.5 text-[#C2410C]" />
              <span>{tagline}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#2A170A] tracking-tight text-balance">
              About {shopName}
            </h2>

            {/* Exactly the user-configured about text from settings */}
            <div className="text-sm sm:text-base text-[#4A3223] leading-relaxed whitespace-pre-wrap font-sans space-y-4">
              {aboutText}
            </div>

            <div className="pt-6 border-t border-[#EAE2D5] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#5A4132]">
              <div className="p-4 bg-white rounded-2xl border border-[#E8DFC9] space-y-1">
                <span className="font-bold text-[#2A170A] flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-[#C2410C]" />
                  <span>Phone & WhatsApp</span>
                </span>
                <p className="text-xs text-[#6B5544] font-mono">
                  {phone} · WA: {whatsapp}
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-[#E8DFC9] space-y-1">
                <span className="font-bold text-[#2A170A] flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-[#C2410C]" />
                  <span>Operating Timings</span>
                </span>
                <p className="text-xs text-[#6B5544]">
                  {timings}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-3xl overflow-hidden border border-[#D9C8B4] shadow-xl relative bg-white p-3 space-y-3">
              <div className="relative w-full h-48 sm:h-64 rounded-xl overflow-hidden bg-[#FFF8EE]">
                <img
                  src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80"
                  alt={shopName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = 'https://picsum.photos/seed/' + Math.random().toString(36).substring(2, 8) + '/400/400';
                  }}
                />
              </div>
              <div className="p-3 text-center">
                <span className="text-xs uppercase tracking-wider text-[#C2410C] font-bold block">
                  {shopName}
                </span>
                <p className="text-xs text-[#6B5544] mt-1">
                  Freshly Prepared Traditional Sweets for Your Special Occasions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
