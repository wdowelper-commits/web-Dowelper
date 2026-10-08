import React, { useState } from 'react';
import { 
  X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck, Store, 
  CreditCard, CheckCircle2, Copy, Check, AlertCircle, Loader2, Tag,
  Clock, Calendar, Award, Upload, Image as ImageIcon
} from 'lucide-react';
import { Order, ShopSettings } from '../types';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import confetti from 'canvas-confetti';
import { handleImageFallback } from '../utils/imageHelpers';

interface CartDrawerProps {
  onOrderSuccess: (order: Order, whatsappUrl: string) => void;
  settings?: ShopSettings;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  onOrderSuccess,
  settings
}) => {
  const { 
    cartItems, 
    cartCount, 
    subtotal, 
    isCartOpen, 
    closeCart, 
    updateQuantity, 
    removeItem, 
    clearCart 
  } = useCart();

  const { isUrdu, t } = useLanguage();

  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  
  // Delivery slot picker (Today / Tomorrow, Morning / Evening)
  const [deliveryDay, setDeliveryDay] = useState<'Today' | 'Tomorrow'>('Today');
  const [deliverySlotTime, setDeliverySlotTime] = useState<'Morning' | 'Evening'>('Morning');

  // Checkout Form fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState(settings?.city || '');
  const [specialNotes, setSpecialNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank' | 'jazzcash' | 'easypaisa'>('cod');
  
  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Loyalty points redemption
  const [useLoyalty, setUseLoyalty] = useState(false);
  const simulatedLoyaltyPoints = 250; // Points available

  // Payment proof screenshot upload
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isCartOpen) return null;

  // Calculations
  const deliveryFeeSetting = settings?.delivery_fee ?? 250;
  const freeThreshold = settings?.free_delivery_threshold ?? 4000;
  const isFreeDelivery = subtotal >= freeThreshold;
  const deliveryFee = deliveryType === 'delivery' ? (isFreeDelivery ? 0 : deliveryFeeSetting) : 0;
  const couponDiscount = appliedCoupon?.discount ?? 0;
  const loyaltyDiscount = useLoyalty ? Math.min(simulatedLoyaltyPoints, Math.max(subtotal - couponDiscount, 0)) : 0;
  const grandTotal = Math.max(subtotal + deliveryFee - couponDiscount - loyaltyDiscount, 0);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    setCouponError(null);
    try {
      const result = await api.validateCoupon(couponInput.trim(), subtotal);
      if (result.valid && result.discount_amount) {
        setAppliedCoupon({
          code: result.code || couponInput.trim().toUpperCase(),
          discount: result.discount_amount
        });
        setCouponInput('');
      } else {
        setCouponError(result.message || 'Invalid coupon code');
      }
    } catch {
      setCouponError('Failed to apply coupon');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerName.trim()) {
      setErrorMsg(isUrdu ? 'براہ کرم اپنا پورا نام درج کریں' : 'Please enter your full name');
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMsg(isUrdu ? 'براہ کرم اپنا فعال فون یا واٹس ایپ نمبر درج کریں' : 'Please enter your active WhatsApp / phone number');
      return;
    }
    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      setErrorMsg(isUrdu ? 'براہ کرم ڈلیوری کا مکمل پتہ درج کریں' : 'Please provide your complete delivery address');
      return;
    }

    setIsSubmitting(true);

    try {
      const fullDeliverySlot = `${deliveryDay} ${deliverySlotTime === 'Morning' ? 'Morning (10 AM - 2 PM)' : 'Evening (4 PM - 9 PM)'}`;

      const response = await api.createOrder({
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || undefined,
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery' ? deliveryAddress : undefined,
        delivery_city: deliveryType === 'delivery' ? deliveryCity : undefined,
        delivery_slot: fullDeliverySlot,
        pickup_time: deliveryType === 'pickup' ? `Ready in 2 Hours (${deliveryDay})` : undefined,
        special_notes: specialNotes || undefined,
        items: cartItems,
        payment_method: paymentMethod,
        coupon_code: appliedCoupon?.code,
        loyalty_points_redeemed: useLoyalty ? loyaltyDiscount : undefined
      });

      // Upload payment proof if provided
      if (paymentProofFile && response.order.order_number) {
        try {
          const filePath = await api.uploadPaymentProof(response.order.order_number, paymentProofFile);
          await api.attachPaymentProof(response.order.order_number, customerPhone, filePath);
        } catch (proofErr) {
          console.warn('Payment proof upload failed:', proofErr);
        }
      }

      // Fire confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      clearCart();
      closeCart();
      onOrderSuccess(response.order, response.whatsappUrl);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to place your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-[#D9C8B4]">
          {/* Header */}
          <div className="p-5 border-b border-[#EAE2D5] flex items-center justify-between bg-[#FAF7F2]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#C2410C]" />
              <h2 className="text-lg font-serif font-bold text-[#2A170A]">
                {step === 'cart' ? t('cart.title', 'Your Sweets Cart') : t('cart.checkout', 'Checkout Details')}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#EAE2D5] font-semibold text-[#5A4132]">
                {cartItems.length}
              </span>
            </div>
            <button
              onClick={closeCart}
              className="p-1.5 rounded-full hover:bg-[#EAE2D5] text-[#2A170A] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#FAF7F2] border border-[#EAE2D5] flex items-center justify-center mx-auto text-[#8C6D58]">
                  <ShoppingBag className="w-8 h-8 opacity-40" />
                </div>
                <h3 className="text-base font-serif font-bold text-[#2A170A]">
                  {t('cart.empty', 'Your sweets cart is empty')}
                </h3>
                <p className="text-xs text-[#8C6D58] max-w-xs mx-auto">
                  {isUrdu 
                    ? 'ہماری لذیذ دیسی گھی کی مٹھائیوں اور شاہی گفٹ باکسز کا انتخاب کریں۔' 
                    : 'Explore our pure desi ghee mithai and custom royal gift hampers to begin.'}
                </p>
                <button
                  onClick={closeCart}
                  className="px-5 py-2.5 bg-[#2A170A] text-white text-xs font-semibold rounded-xl hover:bg-[#C2410C] transition-colors cursor-pointer"
                >
                  {isUrdu ? 'مٹھائیاں دیکھیں' : 'Browse Sweets'}
                </button>
              </div>
            ) : step === 'cart' ? (
              /* Step 1: Cart Items List */
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div 
                    key={item.id}
                    className="flex gap-3 p-3 rounded-2xl bg-[#FAF7F2] border border-[#EAE2D5] items-center"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        onError={handleImageFallback}
                        className="w-16 h-16 rounded-xl object-cover border border-[#D9C8B4] shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-[#FFF8EE] border border-[#F0DCC4] shrink-0 text-center p-1">
                        <span className="text-[#C2410C] font-semibold text-[10px] leading-tight line-clamp-2">{item.name}</span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-serif font-bold text-[#2A170A] truncate">
                        {isUrdu && item.name_ur ? item.name_ur : item.name}
                      </h4>
                      <p className="text-[11px] text-[#8C6D58]">
                        Rs. {item.price_per_unit.toLocaleString()} / {item.unit}
                      </p>
                      {item.box_description && (
                        <p className="text-[10px] text-[#C2410C] italic truncate">
                          {item.box_description}
                        </p>
                      )}
                      <div className="text-xs font-bold text-[#2A170A] mt-1">
                        Rs. {item.total.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-[#8C6D58] hover:text-red-600 transition-colors cursor-pointer p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-1 bg-white border border-[#D9C8B4] rounded-lg p-0.5 shadow-2xs">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-5 h-5 flex items-center justify-center hover:bg-[#EAE2D5] rounded text-xs cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-semibold px-1 min-w-[28px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-5 h-5 flex items-center justify-center hover:bg-[#EAE2D5] rounded text-xs cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Free Delivery Banner Progress */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                  {isFreeDelivery ? (
                    <div className="flex items-center gap-2 text-emerald-800 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{isUrdu ? 'مبارک! آپ کا آرڈر مفت ڈلیوری کے اہل ہے۔' : 'Mubarak! You unlocked FREE Home Delivery.'}</span>
                    </div>
                  ) : (
                    <div className="text-[#8C6D58]">
                      <span>{isUrdu ? 'مزید ' : 'Add '}</span>
                      <strong className="text-[#C2410C]">Rs. {(freeThreshold - subtotal).toLocaleString()}</strong>
                      <span>{isUrdu ? ' کا سامان شامل کریں اور مفت ڈلیوری حاصل کریں۔' : ' more for FREE Home Delivery!'}</span>
                    </div>
                  )}
                </div>

                {/* Coupon Code Section */}
                <div className="pt-2">
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 absolute left-3 top-3 text-[#8C6D58]" />
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder={t('cart.coupon_code', 'Coupon code (e.g. MITHAS10)')}
                        className="w-full pl-8 pr-3 py-2 text-xs uppercase bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl focus:outline-hidden focus:border-[#C2410C]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={validatingCoupon || !couponInput.trim()}
                      className="px-4 py-2 bg-[#2A170A] hover:bg-[#C2410C] text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {validatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t('cart.apply', 'Apply')}
                    </button>
                  </form>

                  {couponError && (
                    <p className="text-[11px] text-red-600 mt-1">{couponError}</p>
                  )}

                  {appliedCoupon && (
                    <div className="flex items-center justify-between mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                      <span>Coupon <strong>{appliedCoupon.code}</strong> applied (-Rs. {appliedCoupon.discount.toLocaleString()})</span>
                      <button 
                        type="button" 
                        onClick={() => setAppliedCoupon(null)}
                        className="text-emerald-900 hover:underline font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Loyalty Points Redemption */}
                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EAE2D5] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600" />
                    <div>
                      <span className="font-semibold text-[#2A170A] block">
                        {isUrdu ? 'وفاداری پوائنٹس (Loyalty Points)' : 'Loyalty Points Discount'}
                      </span>
                      <span className="text-[11px] text-[#8C6D58]">
                        {simulatedLoyaltyPoints} points available (Save Rs. {simulatedLoyaltyPoints})
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={useLoyalty}
                    onChange={(e) => setUseLoyalty(e.target.checked)}
                    className="w-4 h-4 accent-[#C2410C] cursor-pointer"
                  />
                </div>
              </div>
            ) : (
              /* Step 2: Checkout Form */
              <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
                {/* Delivery Type Switch */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#FAF7F2] border border-[#EAE2D5] rounded-xl">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('delivery')}
                    className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      deliveryType === 'delivery'
                        ? 'bg-white text-[#2A170A] shadow-xs border border-[#D9C8B4]'
                        : 'text-[#8C6D58]'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>{t('cart.home_delivery', 'Home Delivery')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('pickup')}
                    className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      deliveryType === 'pickup'
                        ? 'bg-white text-[#2A170A] shadow-xs border border-[#D9C8B4]'
                        : 'text-[#8C6D58]'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>{t('cart.store_pickup', 'Store Pickup')}</span>
                  </button>
                </div>

                {/* Delivery Slot Picker */}
                <div className="p-3 bg-[#FAF7F2] border border-[#EAE2D5] rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2A170A]">
                    <Clock className="w-3.5 h-3.5 text-[#C2410C]" />
                    <span>{t('cart.delivery_slot', 'Select Delivery Slot')}</span>
                  </div>

                  {/* Day Picker */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {(['Today', 'Tomorrow'] as const).map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setDeliveryDay(day)}
                        className={`py-1.5 rounded-lg border font-medium transition-all ${
                          deliveryDay === day
                            ? 'bg-[#2A170A] text-white border-[#2A170A]'
                            : 'bg-white text-[#5A4132] border-[#D9C8B4]'
                        }`}
                      >
                        {day === 'Today' ? (isUrdu ? 'آج' : 'Today') : (isUrdu ? 'کل' : 'Tomorrow')}
                      </button>
                    ))}
                  </div>

                  {/* Slot Time Picker */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setDeliverySlotTime('Morning')}
                      className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                        deliverySlotTime === 'Morning'
                          ? 'bg-[#C2410C] text-white border-[#C2410C] font-semibold'
                          : 'bg-white text-[#5A4132] border-[#D9C8B4]'
                      }`}
                    >
                      <span className="block text-[11px] font-bold">10 AM - 2 PM</span>
                      <span className="text-[10px] opacity-80">{isUrdu ? 'صبح کا سلاٹ' : 'Morning'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliverySlotTime('Evening')}
                      className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                        deliverySlotTime === 'Evening'
                          ? 'bg-[#C2410C] text-white border-[#C2410C] font-semibold'
                          : 'bg-white text-[#5A4132] border-[#D9C8B4]'
                      }`}
                    >
                      <span className="block text-[11px] font-bold">4 PM - 9 PM</span>
                      <span className="text-[10px] opacity-80">{isUrdu ? 'شام کا سلاٹ' : 'Evening'}</span>
                    </button>
                  </div>
                </div>

                {/* Customer Contact Inputs */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-[#8C6D58] block mb-1">
                      {isUrdu ? 'مکمل نام *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={isUrdu ? 'اپنا نام درج کریں' : 'e.g. Tariq Mehmood'}
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl focus:outline-hidden focus:border-[#C2410C]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#8C6D58] block mb-1">
                      {isUrdu ? 'واٹس ایپ / رابطہ نمبر *' : 'WhatsApp / Mobile Number *'}
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="03001234567"
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl focus:outline-hidden focus:border-[#C2410C]"
                    />
                  </div>

                  {deliveryType === 'delivery' && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-[#8C6D58] block mb-1">
                          {isUrdu ? 'ڈلیوری کا مکمل پتہ *' : 'Complete Delivery Address *'}
                        </label>
                        <textarea
                          required
                          rows={2}
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder={isUrdu ? 'مکان نمبر، گلی، علاقہ' : 'House / Flat #, Street, Block, Area'}
                          className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl focus:outline-hidden focus:border-[#C2410C]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[#8C6D58] block mb-1">
                          {isUrdu ? 'شہر' : 'City'}
                        </label>
                        <input
                          type="text"
                          value={deliveryCity}
                          onChange={(e) => setDeliveryCity(e.target.value)}
                          placeholder="e.g. Lahore / Rawalpindi / Karachi"
                          className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl focus:outline-hidden focus:border-[#C2410C]"
                        />
                      </div>
                    </>
                  )}

                  {deliveryType === 'pickup' && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-[#5A4132]">
                      <p className="font-semibold text-[#2A170A] mb-1">
                        {isUrdu ? 'دکان سے وصولی کی معلومات' : 'Store Pickup Instructions:'}
                      </p>
                      <p>
                        {isUrdu 
                          ? 'آرڈر دینے کے بعد دکان کا مکمل پتہ اور وصولی کا وقت آپ کو واٹس ایپ پر بھیج دیا جائے گا۔'
                          : 'Pickup details and exact shop collection timings will be shared directly on WhatsApp once your order is confirmed.'}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-[#8C6D58] block mb-1">
                      {isUrdu ? 'خاص ہدایات (اختیاری)' : 'Special Request / Greeting Card Note'}
                    </label>
                    <input
                      type="text"
                      value={specialNotes}
                      onChange={(e) => setSpecialNotes(e.target.value)}
                      placeholder={isUrdu ? 'مثلاً: کم میٹھا، اضافی چاندی کا ورق' : 'e.g. Less sweet, extra gift ribbon'}
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl focus:outline-hidden focus:border-[#C2410C]"
                    />
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2 pt-2 border-t border-[#EAE2D5]">
                  <label className="text-xs font-semibold text-[#8C6D58] block">
                    {t('cart.payment_method', 'Payment Method')}
                  </label>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        paymentMethod === 'cod'
                          ? 'border-[#C2410C] bg-amber-50/50 font-semibold ring-1 ring-[#C2410C]'
                          : 'border-[#D9C8B4] bg-[#FAF7F2] text-[#5A4132]'
                      }`}
                    >
                      <span>{t('cart.cod', 'Cash on Delivery')}</span>
                      <span className="text-[10px] text-[#8C6D58] mt-1">{isUrdu ? 'وصولی پر ادائیگی' : 'Pay when delivered'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank')}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        paymentMethod === 'bank'
                          ? 'border-[#C2410C] bg-amber-50/50 font-semibold ring-1 ring-[#C2410C]'
                          : 'border-[#D9C8B4] bg-[#FAF7F2] text-[#5A4132]'
                      }`}
                    >
                      <span>{t('cart.bank', 'Bank Transfer')}</span>
                      <span className="text-[10px] text-[#8C6D58] mt-1">{settings?.bank_name || 'Meezan Bank'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('jazzcash')}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        paymentMethod === 'jazzcash'
                          ? 'border-[#C2410C] bg-amber-50/50 font-semibold ring-1 ring-[#C2410C]'
                          : 'border-[#D9C8B4] bg-[#FAF7F2] text-[#5A4132]'
                      }`}
                    >
                      <span>{t('cart.jazzcash', 'JazzCash')}</span>
                      <span className="text-[10px] text-[#8C6D58] mt-1">{settings?.jazzcash_number || '03027628552'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('easypaisa')}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        paymentMethod === 'easypaisa'
                          ? 'border-[#C2410C] bg-amber-50/50 font-semibold ring-1 ring-[#C2410C]'
                          : 'border-[#D9C8B4] bg-[#FAF7F2] text-[#5A4132]'
                      }`}
                    >
                      <span>{t('cart.easypaisa', 'EasyPaisa')}</span>
                      <span className="text-[10px] text-[#8C6D58] mt-1">{settings?.easypaisa_number || '03027628552'}</span>
                    </button>
                  </div>

                  {/* Manual Account Details Box & Payment Proof Upload */}
                  {paymentMethod !== 'cod' && (
                    <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs space-y-2 mt-2">
                      <div className="font-semibold text-[#2A170A] flex items-center justify-between">
                        <span>
                          {paymentMethod === 'bank' ? 'Bank Account Details:' : paymentMethod === 'jazzcash' ? 'JazzCash Account:' : 'EasyPaisa Account:'}
                        </span>
                      </div>

                      {paymentMethod === 'bank' && (
                        <div className="space-y-1 text-[11px] text-[#4A3222]">
                          <div>Bank: <strong>{settings?.bank_name || 'Meezan Bank Limited'}</strong></div>
                          <div>Title: <strong>{settings?.bank_title || 'Mithas Sweets'}</strong></div>
                          <div className="flex items-center justify-between">
                            <span>A/C: <strong>{settings?.bank_account_no || '02010103456789'}</strong></span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(settings?.bank_account_no || '02010103456789', 'acc')}
                              className="text-xs text-[#C2410C] font-semibold hover:underline"
                            >
                              {copiedKey === 'acc' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'jazzcash' && (
                        <div className="space-y-1 text-[11px] text-[#4A3222]">
                          <div>Title: <strong>{settings?.jazzcash_title || 'Mithas Sweets'}</strong></div>
                          <div className="flex items-center justify-between">
                            <span>Number: <strong>{settings?.jazzcash_number || '03027628552'}</strong></span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(settings?.jazzcash_number || '03027628552', 'jc')}
                              className="text-xs text-[#C2410C] font-semibold hover:underline"
                            >
                              {copiedKey === 'jc' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'easypaisa' && (
                        <div className="space-y-1 text-[11px] text-[#4A3222]">
                          <div>Title: <strong>{settings?.easypaisa_title || 'Mithas Sweets'}</strong></div>
                          <div className="flex items-center justify-between">
                            <span>Number: <strong>{settings?.easypaisa_number || '03027628552'}</strong></span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(settings?.easypaisa_number || '03027628552', 'ep')}
                              className="text-xs text-[#C2410C] font-semibold hover:underline"
                            >
                              {copiedKey === 'ep' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Payment Proof File Attachment */}
                      <div className="pt-2 border-t border-amber-200">
                        <label className="text-[11px] font-semibold text-[#8C6D58] block mb-1">
                          {isUrdu ? 'ادائیگی کی رسید / اسکرین شاٹ اپلوڈ کریں:' : 'Attach Payment Receipt Screenshot (Optional):'}
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setPaymentProofFile(e.target.files?.[0] || null)}
                          className="text-xs text-[#5A4132] file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#2A170A] file:text-white hover:file:bg-[#C2410C]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Footer Actions */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t border-[#EAE2D5] bg-[#FAF7F2] space-y-3">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-[#8C6D58]">
                  <span>{t('cart.subtotal', 'Subtotal')}</span>
                  <span>Rs. {subtotal.toLocaleString()}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-Rs. {appliedCoupon.discount.toLocaleString()}</span>
                  </div>
                )}

                {useLoyalty && loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Loyalty Points Discount</span>
                    <span>-Rs. {loyaltyDiscount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#8C6D58]">
                  <span>{t('cart.delivery_fee', 'Delivery Fee')}</span>
                  <span>{deliveryFee === 0 ? t('cart.free', 'FREE') : `Rs. ${deliveryFee.toLocaleString()}`}</span>
                </div>

                <div className="flex justify-between text-base font-serif font-bold text-[#2A170A] pt-2 border-t border-[#EAE2D5]">
                  <span>{t('cart.total', 'Total Amount')}</span>
                  <span>Rs. {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {step === 'cart' ? (
                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="w-full py-3 bg-[#C2410C] hover:bg-[#9A3412] text-white font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <span>{t('cart.checkout', 'Proceed to Checkout')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('cart')}
                    className="px-4 py-3 bg-white border border-[#D9C8B4] text-[#2A170A] text-xs font-semibold rounded-2xl hover:bg-[#EAE2D5] transition-colors cursor-pointer"
                  >
                    {isUrdu ? 'واپس' : 'Back'}
                  </button>
                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-[#2A170A] hover:bg-[#C2410C] text-white font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-md"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isUrdu ? 'آرڈر بک ہو رہا ہے...' : 'Placing Order...'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t('cart.place_order', 'Place Order Now')}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
