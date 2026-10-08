import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Check, ShieldCheck, Clock, Award, AlertTriangle, Minus, Plus } from 'lucide-react';
import { Product } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getCategoryDefaultImage, handleImageFallback } from '../utils/imageHelpers';

interface ProductQuickViewProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, unit?: string) => void;
}

export const ProductQuickView: React.FC<ProductQuickViewProps> = ({
  product,
  onClose,
  onAddToCart
}) => {
  if (!product) return null;

  const { isUrdu, t } = useLanguage();

  const defaultMode = product.sell_mode === 'piece' ? 'piece' : 'kg';
  const [selectedUnit, setSelectedUnit] = useState<'kg' | 'piece'>(defaultMode);
  const [selectedQty, setSelectedQty] = useState<number>(defaultMode === 'piece' ? 1 : 1);
  const [justAdded, setJustAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const isSupabaseImage = Boolean(product.image && product.image.includes('supabase.co/storage'));

  useEffect(() => {
    const mode = product.sell_mode === 'piece' ? 'piece' : 'kg';
    setSelectedUnit(mode);
    setSelectedQty(1);
    setImgError(false);
  }, [product]);

  const isOutOfStock = !product.in_stock || !product.is_available || product.stock_grams <= 0;
  const isLowStock = !isOutOfStock && product.stock_grams <= (product.low_stock_threshold_grams || 500);

  const priceKg = product.price_per_kg || product.price_per_unit;
  const pricePiece = product.price_per_piece || Math.round(priceKg / 20);
  const activeUnitPrice = selectedUnit === 'piece' ? pricePiece : priceKg;
  const currentPrice = Math.round(activeUnitPrice * selectedQty);

  const handleStepQty = (delta: number) => {
    const step = selectedUnit === 'kg' ? 0.5 : 1;
    const next = Math.max(selectedUnit === 'kg' ? 0.5 : 1, Number((selectedQty + (delta * step)).toFixed(1)));
    setSelectedQty(next);
  };

  const handleAdd = () => {
    if (isOutOfStock) return;
    onAddToCart(product, selectedQty, selectedUnit);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      onClose();
    }, 900);
  };

  const displayName = (isUrdu && product.name_ur) ? product.name_ur : product.name;
  const displayDesc = (isUrdu && product.description_ur) ? product.description_ur : product.description;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#D9C8B4] flex flex-col md:flex-row relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-[#2A170A] shadow-md transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image */}
        <div className="md:w-1/2 p-4 relative bg-[#FAF7F2] flex items-center justify-center">
          <div className="w-full h-56 md:h-72 rounded-xl overflow-hidden border border-[#F0DCC4] bg-[#FFF8EE]">
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
              className={`w-full h-full object-cover ${isOutOfStock ? 'grayscale opacity-75' : ''}`}
              referrerPolicy="no-referrer"
            />
          </div>
          {isOutOfStock ? (
            <div className="absolute top-6 left-6 px-3 py-1 bg-[#2A170A]/90 text-white text-xs font-semibold rounded-md">
              {t('prod.out_of_stock', 'Temporarily Out of Stock')}
            </div>
          ) : isLowStock ? (
            <div className="absolute top-6 left-6 px-3 py-1 bg-amber-600 text-white text-xs font-semibold rounded-md flex items-center gap-1 shadow-sm">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{t('prod.low_stock', 'Only a little left')}</span>
            </div>
          ) : null}
        </div>

        {/* Product Information */}
        <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-[#8C6D58] font-medium uppercase tracking-wider">
              <span>{product.category}</span>
              <span>·</span>
              <span>{isUrdu ? 'شاہی ذائقہ' : 'Royal Heritage'}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2A170A]">
              {displayName}
            </h2>

            <p className="text-xs sm:text-sm text-[#5A4132] leading-relaxed">
              {displayDesc}
            </p>

            {/* Ingredients block if provided */}
            {product.ingredients && (
              <div className="pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D58] block mb-1">
                  {isUrdu ? 'اجزاء' : 'Fresh Pure Ingredients'}:
                </span>
                <p className="text-xs text-[#4A3222] bg-[#FAF7F2] p-2.5 rounded-xl border border-[#EAE2D5]">
                  {product.ingredients}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-[#F2ECE1]">
            {/* Unit mode switch if sell_mode === 'both' */}
            {product.sell_mode === 'both' && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8C6D58] font-medium">{isUrdu ? 'خریداری کا طریقہ:' : 'Select Mode:'}</span>
                <div className="inline-flex rounded-lg p-1 bg-[#FAF7F2] border border-[#EAE2D5]">
                  <button
                    type="button"
                    onClick={() => { setSelectedUnit('kg'); setSelectedQty(1); }}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      selectedUnit === 'kg' ? 'bg-[#2A170A] text-white shadow-xs' : 'text-[#5A4132]'
                    }`}
                  >
                    {isUrdu ? 'وزن (کلو)' : 'By Weight (Kg)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedUnit('piece'); setSelectedQty(1); }}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      selectedUnit === 'piece' ? 'bg-[#2A170A] text-white shadow-xs' : 'text-[#5A4132]'
                    }`}
                  >
                    {isUrdu ? 'دانے کے حساب سے' : 'By Pieces (pcs)'}
                  </button>
                </div>
              </div>
            )}

            {/* Incremental Quantity Selector */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8C6D58]">
                {t('prod.portion', 'Quantity')}:
              </span>
              <div className="flex items-center gap-3 bg-[#FAF7F2] p-1.5 rounded-xl border border-[#EAE2D5]">
                <button
                  type="button"
                  onClick={() => handleStepQty(-1)}
                  disabled={selectedUnit === 'kg' ? selectedQty <= 0.5 : selectedQty <= 1}
                  className="w-7 h-7 rounded-lg bg-white border border-[#D9C8B4] flex items-center justify-center text-[#2A170A] hover:bg-[#EAE2D5] disabled:opacity-30 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <span className="text-sm font-bold min-w-[60px] text-center text-[#2A170A]">
                  {selectedQty} {selectedUnit === 'kg' ? (isUrdu ? 'کلو' : 'kg') : (isUrdu ? 'دانہ' : 'pcs')}
                </span>

                <button
                  type="button"
                  onClick={() => handleStepQty(1)}
                  className="w-7 h-7 rounded-lg bg-white border border-[#D9C8B4] flex items-center justify-center text-[#2A170A] hover:bg-[#EAE2D5] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Price calculation and Add to Cart action */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-xs text-[#8C6D58] block">
                  Rs. {activeUnitPrice.toLocaleString()} / {selectedUnit === 'kg' ? (isUrdu ? 'کلو' : 'kg') : (isUrdu ? 'دانہ' : 'piece')}
                </span>
                <span className="text-xl sm:text-2xl font-serif font-bold text-[#2A170A]">
                  Rs. {currentPrice.toLocaleString()}
                </span>
              </div>

              <button
                onClick={handleAdd}
                disabled={isOutOfStock}
                className={`px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  isOutOfStock
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    : justAdded
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-[#C2410C] hover:bg-[#9A3412] text-white shadow-md'
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>{t('prod.added', 'Added to Cart')}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    <span>{isOutOfStock ? t('prod.out_of_stock', 'Out of Stock') : t('prod.add_to_cart', 'Add to Cart')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
