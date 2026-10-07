import React, { useState } from 'react';
import { ShoppingBag, Eye, Check } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
  onQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onQuickView
}) => {
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [justAdded, setJustAdded] = useState(false);

  // Available portion options
  const isCake = product.unit === 'piece';
  const portionOptions = isCake ? [1, 2, 3] : [0.5, 1, 2];

  const currentPrice = Math.round(product.price_per_unit * selectedQty);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.in_stock) return;
    onAddToCart(product, selectedQty);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <div className="group flex flex-col bg-white rounded-2xl border border-[#E8DFC9] overflow-hidden hover:border-[#D4AF37] hover:shadow-lg transition-all duration-300">
      {/* Product Image Slot */}
      <div 
        onClick={() => onQuickView(product)}
        className="relative h-56 sm:h-60 overflow-hidden bg-[#FAF7F2] cursor-pointer"
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Quick View Button overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(product);
          }}
          className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white text-[#2A170A] rounded-full shadow-md backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          title="Quick View Details"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Status flags without pill badge spam: single subtle tag */}
        {!product.in_stock && (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#2A170A]/85 text-white text-[11px] font-semibold rounded-md backdrop-blur-xs">
            Out of Stock
          </div>
        )}
        {product.in_stock && product.is_featured && (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#C2410C] text-white text-[11px] font-semibold rounded-md shadow-xs">
            Signature Classic
          </div>
        )}
      </div>

      {/* Card Content Module */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Unboxed metadata with typographic separator */}
          <div className="flex items-center gap-2 text-xs text-[#8C6D58] font-medium tracking-wider uppercase mb-1">
            <span>{product.category}</span>
            <span aria-hidden="true">·</span>
            <span>Desi Ghee Recipe</span>
          </div>

          <h3 
            onClick={() => onQuickView(product)}
            className="text-base sm:text-lg font-serif font-bold text-[#2A170A] group-hover:text-[#C2410C] transition-colors line-clamp-1 cursor-pointer"
          >
            {product.name}
          </h3>

          <p className="text-xs text-[#6B5544] mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[#F2ECE1] space-y-3">
          {/* Portion Selector Buttons */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8C6D58] font-medium">Select Portion:</span>
            <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-lg border border-[#EAE2D5]">
              {portionOptions.map((qty) => (
                <button
                  key={qty}
                  onClick={() => setSelectedQty(qty)}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                    selectedQty === qty
                      ? 'bg-[#C2410C] text-white shadow-xs'
                      : 'text-[#6B5544] hover:text-[#2A170A]'
                  }`}
                >
                  {qty} {isCake ? (qty === 1 ? 'pc' : 'pcs') : 'kg'}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing & Add to Cart button */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-lg font-bold text-[#2A170A] tabular-nums">
                Rs. {currentPrice.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#8C6D58] tabular-nums">
                Base: Rs. {product.price_per_unit.toLocaleString()}/{product.unit}
              </div>
            </div>

            <button
              onClick={handleAdd}
              disabled={!product.in_stock}
              className={`px-4 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                !product.in_stock
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  : justAdded
                  ? 'bg-emerald-700 text-white'
                  : 'bg-[#C2410C] hover:bg-[#9A3412] text-white shadow-sm'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
