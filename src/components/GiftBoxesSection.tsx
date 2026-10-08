import React, { useState, useEffect } from 'react';
import { Gift, Package, Check, Sparkles, Plus, ShoppingBag } from 'lucide-react';
import { GiftBox } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';

export const GiftBoxesSection: React.FC = () => {
  const { isUrdu, t } = useLanguage();
  const { addGiftBoxToCart } = useCart();

  const [giftBoxes, setGiftBoxes] = useState<GiftBox[]>([]);
  const [selectedBox, setSelectedBox] = useState<GiftBox | null>(null);
  const [boxQuantity, setBoxQuantity] = useState(1);
  const [customDescription, setCustomDescription] = useState('');
  const [addedBoxId, setAddedBoxId] = useState<string | null>(null);

  useEffect(() => {
    api.getGiftBoxes().then(boxes => {
      setGiftBoxes(boxes);
      if (boxes.length > 0) setSelectedBox(boxes[0]);
    });
  }, []);

  const handleAddBox = (box: GiftBox) => {
    addGiftBoxToCart(box, boxQuantity, customDescription);
    setAddedBoxId(box.id);
    setTimeout(() => setAddedBoxId(null), 1500);
  };

  return (
    <section id="gift-boxes" className="py-16 sm:py-24 bg-[#FAF7F2] border-t border-[#EAE2D5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-[#8C6D58] rounded-full text-xs font-semibold uppercase tracking-wider">
            <Gift className="w-3.5 h-3.5 text-[#C2410C]" />
            <span>{isUrdu ? 'شاہی تحفہ کلیکشن' : 'Royal Gifting Collection'}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2A170A]">
            {isUrdu ? 'خصوصی شاہی تحفہ ڈبے' : 'Custom Mithai Gift Boxes'}
          </h2>

          <p className="text-sm text-[#5A4132] leading-relaxed">
            {isUrdu 
              ? 'شادیوں، عید اور خاص مواقع کے لیے شاہانہ مخمل اور سنہری ڈبے تیار کروائیں۔'
              : 'Celebrate auspicious weddings, Eid, and special occasions with premium gold-foiled and velvet packaging.'}
          </p>
        </div>

        {/* Gift Boxes Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {giftBoxes.map((box) => {
            const isSelected = selectedBox?.id === box.id;
            const displayName = isUrdu && box.name_ur ? box.name_ur : box.name_en;

            return (
              <div 
                key={box.id}
                onClick={() => setSelectedBox(box)}
                className={`group relative bg-white rounded-3xl overflow-hidden border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                  isSelected 
                    ? 'border-[#C2410C] shadow-xl ring-2 ring-[#C2410C]/20' 
                    : 'border-[#EAE2D5] hover:border-[#D4AF37] hover:shadow-lg'
                }`}
              >
                {/* Image Slot */}
                <div className="relative h-48 overflow-hidden bg-[#FAF7F2] rounded-xl border border-[#F0DCC4]">
                  <img
                    src={
                      box.image_path && box.image_path.includes('supabase.co/storage')
                        ? box.image_path
                        : box.size_grams <= 500
                        ? 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=400&q=80'
                        : box.size_grams === 1000
                        ? 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=400&q=80'
                        : 'https://images.unsplash.com/photo-1582716401301-b2407dc7563d?w=400&q=80'
                    }
                    alt={displayName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = 'https://picsum.photos/seed/' + Math.random().toString(36).substring(2, 8) + '/400/400';
                    }}
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 bg-[#2A170A]/85 text-white text-xs font-bold rounded-lg backdrop-blur-xs">
                    {box.size_grams >= 1000 ? `${box.size_grams / 1000} Kg` : `${box.size_grams}g`}
                  </div>
                </div>

                {/* Box Details */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-lg font-serif font-bold text-[#2A170A] group-hover:text-[#C2410C] transition-colors">
                      {displayName}
                    </h3>
                    <p className="text-xs text-[#6B5544] mt-1.5 leading-relaxed">
                      {isUrdu 
                        ? `گنجائش: ${box.size_grams} گرام روایتی مٹھائیاں۔ سنہری فیتے اور کارڈ کے ساتھ۔`
                        : `Capacity: ${box.size_grams}g fresh mithai. Hand-tied gold ribbon and greeting card included.`}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#F2ECE1] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-[#8C6D58] block">{isUrdu ? 'ڈبے کی قیمت' : 'Packaging Box'}:</span>
                      <span className="text-lg font-serif font-bold text-[#2A170A]">
                        Rs. {box.box_price.toLocaleString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddBox(box);
                      }}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        addedBoxId === box.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#2A170A] hover:bg-[#C2410C] text-white shadow-xs'
                      }`}
                    >
                      {addedBoxId === box.id ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>{t('prod.added', 'Added')}</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          <span>{isUrdu ? 'ٹوکری میں شامل کریں' : 'Add Box to Cart'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Fill & Notes Helper */}
        {selectedBox && (
          <div className="mt-12 bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE2D5] shadow-xs max-w-3xl mx-auto">
            <div className="flex items-center gap-2 text-sm font-serif font-bold text-[#2A170A] mb-3">
              <Sparkles className="w-4 h-4 text-[#C2410C]" />
              <span>
                {isUrdu ? 'خصوصی تحفہ ہدایات و مٹھائی انتخاب' : 'Customize Your Selected Box Contents'}
              </span>
            </div>
            <p className="text-xs text-[#5A4132] mb-4">
              {isUrdu 
                ? 'اپنے تحفہ ڈبے کے لیے پسندیدہ مٹھائیاں (مثلاً کاجو قتلی، گلاب جامن، موتی چور لڈو) یا نام/پیغام یہاں درج کریں۔'
                : 'Write your preferred sweets selection (e.g. 50% Gulab Jamun, 50% Kaju Katli) or gift tag message below:'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder={isUrdu ? 'مثال: گلاب جامن اور برفی کی مکس پیکنگ، ربن پر نام: علی و عائشہ' : 'e.g. Mixed Gulab Jamun & Pistachio Barfi with custom wedding gift tag'}
                className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-[#D9C8B4] focus:outline-hidden focus:border-[#C2410C] bg-[#FAF7F2]"
              />
              <button
                type="button"
                onClick={() => handleAddBox(selectedBox)}
                className="px-6 py-2.5 bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{isUrdu ? 'ڈبہ ٹوکری میں ڈالیں' : 'Add Custom Box to Cart'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
