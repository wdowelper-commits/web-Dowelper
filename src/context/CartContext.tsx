import React, { createContext, useContext, useState } from 'react';
import { CartItem, Product, GiftBox } from '../types';

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  subtotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product, quantity: number, customUnit?: string) => void;
  addGiftBoxToCart: (box: GiftBox, quantity: number, description?: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Stored strictly in React context memory (not localStorage per user requirement C1)
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addToCart = (product: Product, quantity: number, customUnit?: string) => {
    const unit = customUnit || (product.sell_mode === 'piece' ? 'piece' : (product.unit || 'kg'));
    
    // Calculate unit price based on piece or kg
    let pricePerUnit = product.price_per_unit;
    if (unit === 'piece' && product.price_per_piece) {
      pricePerUnit = product.price_per_piece;
    } else if (unit === 'kg' && product.price_per_kg) {
      pricePerUnit = product.price_per_kg;
    }

    const itemTotal = Math.round(pricePerUnit * quantity);

    setCartItems(prev => {
      // Find matching item by product_id and unit
      const existingIdx = prev.findIndex(item => item.product_id === product.id && item.unit === unit);
      if (existingIdx > -1) {
        const next = [...prev];
        const nextQty = next[existingIdx].quantity + quantity;
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: nextQty,
          total: Math.round(pricePerUnit * nextQty)
        };
        return next;
      }

      const newItem: CartItem = {
        id: `cart-${product.id}-${unit}-${Date.now()}`,
        product_id: product.id,
        name: product.name,
        name_ur: product.name_ur,
        category: product.category,
        price_per_unit: pricePerUnit,
        unit: unit,
        quantity: quantity,
        total: itemTotal,
        image: product.image
      };
      return [...prev, newItem];
    });
  };

  const addGiftBoxToCart = (box: GiftBox, quantity: number, description?: string) => {
    const itemTotal = Math.round(box.box_price * quantity);
    const newItem: CartItem = {
      id: `cart-box-${box.id}-${Date.now()}`,
      product_id: box.id,
      name: box.name_en,
      name_ur: box.name_ur,
      category: 'Gift Box',
      price_per_unit: box.box_price,
      unit: 'box',
      quantity: quantity,
      total: itemTotal,
      image: box.image_path,
      is_gift_box: true,
      box_description: description
    };

    setCartItems(prev => [...prev, newItem]);
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(prev => 
      prev
        .map(item => {
          if (item.id === id) {
            const step = item.unit === 'kg' ? 0.5 : 1;
            const newQty = item.quantity + (delta * step);
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: Number(newQty.toFixed(1)),
              total: Math.round(item.price_per_unit * newQty)
            };
          }
          return item;
        })
        .filter((i): i is CartItem => i !== null)
    );
  };

  const removeItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.total, 0);
  const cartCount = cartItems.reduce((acc, item) => acc + (item.unit === 'kg' ? 1 : item.quantity), 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      subtotal,
      isCartOpen,
      openCart,
      closeCart,
      addToCart,
      addGiftBoxToCart,
      updateQuantity,
      removeItem,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
