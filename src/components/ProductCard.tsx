import React, { useState } from 'react';
import { ShoppingBag, Eye, Check, AlertTriangle } from 'lucide-react';
import { Product } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getCategoryDefaultImage, handleImageFallback } from '../utils/imageHelpers';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number, unit?: string) => void;
  onQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onQuickView
}) => {
  const { language, isUrdu, t } = useLanguage();
  
  // Determine default unit and selector
  const defaultMode = product.sell_mode === 'piece' ? 'piece' : 'kg';
  const [selectedUnit, setSelectedUnit] = useState<'kg' | 'piece'>(defaultMode);
  const [selectedQty, setSelectedQty] = useState<number>(defaultMode === 'piece' ? 1 : 1);
  const [justAdded, setJustAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const isSupabaseImage = Boolean(product.image && product.image.includes('supabase.co/storage'));

  // Stock status
  const isOutOfStock = !product.in_stock || !product.is_available || product.stock_grams <= 0;
  const isLowStock = !isOutOfStock && product.stock_grams <= (product.low_stock_threshold_grams || 500);

  // Pricing calculations
  const priceKg = product.price_per_kg || product.price_per_unit;
  const pricePiece = product.price_per_piece || Math.round(priceKg / 20);

  const activeUnitPrice = selectedUnit === 'piece' ? pricePiece : priceKg;
  const currentTotal = Math.round(activeUnitPrice * selectedQty);

  // Portion buttons
  const portionOptions = selectedUnit === 'piece' ? [1, 2, 5, 10] : [0.5, 1, 2];

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    onAddToCart(product, selectedQty, selectedUnit);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const displayName = (isUrdu && product.name_ur) ? product.name_ur : product.name;
  const displayDesc = (isUrdu && product.description_ur) ? product.description_ur : product.description;

  return (
    <div className="group flex flex-col bg-white rounded-2xl border border-[#E8DFC9] overflow-hidden hover:border-[#D4AF37] hover:shadow-lg transition-all duration-300">
      {/* Product Image Slot */}
      <div 
        onClick={() => onQuickView(product)}
        className="relative overflow-hidden cursor-pointer"
      >
        <div className="w-full h-48 rounded-xl overflow-hidden border border-[#F0DCC4] bg-[#FFF8EE]">
          <img
            src={
              isSupabaseImage && !imgError
                ? product.image
                : getCategoryDefaultImage(product.category)
            }
            alt={displayName}
            onError={(e) => {
              handleImageFallback(e);
            }}
            className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ${
              isOutOfStock ? 'grayscale opacity-75' : ''
            }`}
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        </div>

        {/* Quick View Button overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(product);
          }}
          className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white text-[#2A170A] rounded-full shadow-md backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          title={t('prod.quick_view', 'Quick View')}
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Status Badges */}
        {isOutOfStock ? (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#2A170A]/90 text-white text-[11px] font-semibold rounded-md backdrop-blur-xs shadow-xs">
            {t('prod.out_of_stock', 'Out of Stock')}
          </div>
        ) : isLowStock ? (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-amber-600 text-white text-[11px] font-semibold rounded-md shadow-xs flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>{t('prod.low_stock', 'Only a little left')}</span>
          </div>
        ) : product.is_featured ? (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#C2410C] text-white text-[11px] font-semibold rounded-md shadow-xs">
            {isUrdu ? 'خاص شاہی سوغات' : 'Signature Classic'}
          </div>
        ) : null}
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Metadata */}
          <div className="flex items-center gap-2 text-xs text-[#8C6D58] font-medium tracking-wider uppercase mb-1">
            <span>{product.category}</span>
            <span aria-hidden="true">·</span>
            <span>{isUrdu ? 'دیسی گھی' : 'Pure Desi Ghee'}</span>
          </div>

          <h3 
            onClick={() => onQuickView(product)}
            className="text-base sm:text-lg font-serif font-bold text-[#2A170A] group-hover:text-[#C2410C] transition-colors line-clamp-1 cursor-pointer"
          >
            {displayName}
          </h3>

          <p className="text-xs text-[#6B5544] mt-1 line-clamp-2 leading-relaxed">
            {displayDesc}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[#F2ECE1] space-y-3">
          {/* Sell mode switcher if sell_mode === 'both' */}
          {product.sell_mode === 'both' && (
            <div className="flex items-center justify-between text-xs pb-1">
              <span className="text-[#8C6D58] font-medium">{isUrdu ? 'طریقہ خریداری:' : 'Unit Mode:'}</span>
              <div className="inline-flex rounded-md p-0.5 bg-[#FAF7F2] border border-[#EAE2D5]">
                <button
                  type="button"
                  onClick={() => { setSelectedUnit('kg'); setSelectedQty(1); }}
                  className={`px-2 py-0.5 text-[11px] font-medium rounded ${
                    selectedUnit === 'kg' ? 'bg-[#2A170A] text-white' : 'text-[#5A4132] hover:text-black'
                  }`}
                >
                  {isUrdu ? 'کلو' : 'Kg'}
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedUnit('piece'); setSelectedQty(1); }}
                  className={`px-2 py-0.5 text-[11px] font-medium rounded ${
                    selectedUnit === 'piece' ? 'bg-[#2A170A] text-white' : 'text-[#5A4132] hover:text-black'
                  }`}
                >
                  {isUrdu ? 'دانہ' : 'Piece'}
                </button>
              </div>
            </div>
          )}

          {/* Portion Selector Buttons */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8C6D58] font-medium">{t('prod.portion', 'Portion')}:</span>
            <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-lg border border-[#EAE2D5]">
              {portionOptions.map((qty) => (
                <button
                  key={qty}
                  onClick={() => setSelectedQty(qty)}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    selectedQty === qty
                      ? 'bg-[#C2410C] text-white shadow-xs'
                      : 'text-[#5A4132] hover:bg-[#EAE2D5]'
                  }`}
                >
                  {qty}{selectedUnit === 'kg' ? (isUrdu ? ' کلو' : 'kg') : (isUrdu ? ' دانہ' : 'pc')}
                </button>
              ))}
            </div>
          </div>

          {/* Price and Add to Cart Action */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-xs text-[#8C6D58] block">
                Rs. {activeUnitPrice.toLocaleString()} / {selectedUnit === 'kg' ? (isUrdu ? 'کلو' : 'kg') : (isUrdu ? 'دانہ' : 'piece')}
              </span>
              <span className="text-base sm:text-lg font-serif font-bold text-[#2A170A]">
                Rs. {currentTotal.toLocaleString()}
              </span>
            </div>

            <button
              onClick={handleAdd}
              disabled={isOutOfStock}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isOutOfStock
                  ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  : justAdded
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-[#2A170A] hover:bg-[#C2410C] text-white shadow-xs hover:shadow-md'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t('prod.added', 'Added')}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isOutOfStock ? t('prod.out_of_stock', 'Out of Stock') : t('prod.add_to_cart', 'Add')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
