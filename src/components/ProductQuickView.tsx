import React, { useState } from 'react';
import { X, ShoppingBag, Check, ShieldCheck, Clock, Award } from 'lucide-react';
import { Product } from '../types';

interface ProductQuickViewProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductQuickView: React.FC<ProductQuickViewProps> = ({
  product,
  onClose,
  onAddToCart
}) => {
  if (!product) return null;

  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [justAdded, setJustAdded] = useState(false);

  const isCake = product.unit === 'piece';
  const portionOptions = isCake ? [1, 2, 3] : [0.5, 1, 2, 5];
  const currentPrice = Math.round(product.price_per_unit * selectedQty);

  const handleAdd = () => {
    if (!product.in_stock) return;
    onAddToCart(product, selectedQty);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      onClose();
    }, 1000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#D9C8B4] flex flex-col md:flex-row relative"
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
        <div className="md:w-1/2 h-64 md:h-auto relative bg-[#FAF7F2]">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {!product.in_stock && (
            <div className="absolute top-4 left-4 px-3 py-1 bg-[#2A170A]/90 text-white text-xs font-semibold rounded-md">
              Temporarily Sold Out
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-[#8C6D58] font-medium uppercase tracking-wider">
              <span>{product.category}</span>
              <span>·</span>
              <span>Traditional Kadhai</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2A170A]">
              {product.name}
            </h2>

            <p className="text-sm text-[#5A4132] leading-relaxed">
              {product.description}
            </p>

            {/* Ingredients block */}
            {product.ingredients && (
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EAE2D5] space-y-1">
                <span className="text-[11px] font-bold text-[#8C4A1A] uppercase tracking-wider block">
                  Artisanal Ingredients:
                </span>
                <p className="text-xs text-[#6B5544]">
                  {product.ingredients}
                </p>
              </div>
            )}

            {/* Quality markers */}
            <div className="grid grid-cols-2 gap-2 text-xs text-[#6B5544] pt-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#C2410C]" />
                <span>100% Desi Ghee</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#C2410C]" />
                <span>Fresh for 7 Days</span>
              </div>
            </div>
          </div>

          {/* Portion and Buy Controls */}
          <div className="space-y-4 pt-4 border-t border-[#F2ECE1]">
            <div>
              <label className="text-xs font-semibold text-[#2A170A] block mb-1.5">
                Select Weight / Quantity:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {portionOptions.map((qty) => (
                  <button
                    key={qty}
                    onClick={() => setSelectedQty(qty)}
                    className={`py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                      selectedQty === qty
                        ? 'bg-[#C2410C] text-white border-[#C2410C] shadow-xs'
                        : 'bg-[#FAF7F2] text-[#5A4132] border-[#EAE2D5] hover:border-[#C2410C]'
                    }`}
                  >
                    {qty} {isCake ? 'pc' : 'kg'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-xs text-[#8C6D58] block">Total Amount:</span>
                <span className="text-2xl font-bold text-[#2A170A] tabular-nums">
                  Rs. {currentPrice.toLocaleString()}
                </span>
              </div>

              <button
                onClick={handleAdd}
                disabled={!product.in_stock}
                className={`px-5 py-3 text-sm font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                  !product.in_stock
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : justAdded
                    ? 'bg-emerald-700 text-white'
                    : 'bg-[#C2410C] hover:bg-[#9A3412] text-white active:scale-95'
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart</span>
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
