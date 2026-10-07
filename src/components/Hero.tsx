import React from 'react';
import { ArrowRight, Sparkles, CheckCircle2, Truck, Gift, Clock } from 'lucide-react';
import { ShopSettings } from '../types';

interface HeroProps {
  onExploreMenu: () => void;
  onBulkOrders: () => void;
  onOpenAiPlanner: () => void;
  settings?: ShopSettings;
}

export const Hero: React.FC<HeroProps> = ({
  onExploreMenu,
  onBulkOrders,
  onOpenAiPlanner,
  settings
}) => {
  const shopName = settings?.shop_name || 'Mithas Sweets';
  const tagline = settings?.tagline || 'Fresh Traditional Sweets & Confections';
  const freeThreshold = settings?.free_delivery_threshold || 4000;

  return (
    <section className="relative overflow-hidden bg-[#FAF7F2] border-b border-[#EAE2D5]">
      {/* Subtle warm decorative glow */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-amber-200/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-orange-200/20 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Editorial & Conversion */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F5EBE1] border border-[#E6D7C7] rounded-full text-xs font-semibold text-[#8C4A1A]">
              <span className="w-2 h-2 rounded-full bg-[#C2410C] animate-pulse" />
              <span>{tagline}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#2A170A] tracking-tight leading-[1.12] text-balance">
              Welcome to {shopName}.
            </h1>

            <p className="text-base sm:text-lg text-[#5A4132] max-w-2xl leading-relaxed">
              Explore our selection of traditional sweets, barfi, laddus, halwa, and custom gift hampers. Order online for convenient delivery or pickup for your family gatherings and festive celebrations.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onExploreMenu}
                className="px-6 py-3.5 text-sm font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] active:scale-98 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>View Sweets Menu</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onBulkOrders}
                className="px-6 py-3.5 text-sm font-semibold text-[#2A170A] bg-[#FFFFFF] hover:bg-[#F2ECE1] border border-[#D9C8B4] rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Wedding & Bulk Boxes
              </button>

              <button
                onClick={onOpenAiPlanner}
                className="px-4 py-3.5 text-xs font-semibold text-[#854D0E] bg-[#FEF3C7] hover:bg-[#FDE68A] border border-[#FCD34D] rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#D97706]" />
                <span>Portion Calculator</span>
              </button>
            </div>

            {/* Clean Service Highlights (Without fabricated claims) */}
            <div className="pt-8 border-t border-[#EAE2D5] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-[#5A4132]">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#C2410C] shrink-0" />
                <span className="font-medium">Free Delivery Above Rs. {freeThreshold.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#C2410C] shrink-0" />
                <span className="font-medium">Packed Fresh on Order</span>
              </div>
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-[#C2410C] shrink-0" />
                <span className="font-medium">Custom Gift Packaging</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#C2410C] shrink-0" />
                <span className="font-medium">Store Pickup Available</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero High-Res Imagery */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-[#D9C8B4] bg-[#2A170A]/5 group">
              <img
                src="/src/assets/images/mithas_hero_spread_1791385618514.jpg"
                alt="Traditional sweets assortment"
                className="w-full h-80 sm:h-96 lg:h-[460px] object-cover object-center group-hover:scale-102 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              
              <div className="absolute bottom-4 left-4 right-4 p-4 bg-[#FAF7F2]/95 backdrop-blur-md rounded-xl border border-[#EAE2D5] text-[#2A170A] shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-[#C2410C] font-bold">
                      Available Today
                    </span>
                    <h2 className="text-base font-serif font-bold text-[#2A170A]">
                      Traditional Sweets Collection
                    </h2>
                  </div>
                  <span className="text-xs font-semibold text-[#8C4A1A]">
                    Fresh Daily
                  </span>
                </div>
                <p className="text-xs text-[#6B5544] mt-1 line-clamp-1">
                  Barfi, Motichoor Laddu, Sohan Halwa, Gulab Jamun & Cakes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
