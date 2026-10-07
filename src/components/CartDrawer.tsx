import React, { useState } from 'react';
import { 
  X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck, Store, 
  CreditCard, CheckCircle2, Copy, Check, AlertCircle, Loader2 
} from 'lucide-react';
import { CartItem, Order, ShopSettings } from '../types';
import { api } from '../services/api';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onOrderSuccess: (order: Order, whatsappUrl: string) => void;
  settings?: ShopSettings;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onOrderSuccess,
  settings
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  
  // Checkout Form fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState(settings?.city || '');
  const [pickupTime, setPickupTime] = useState('Today (Within 2 Hours)');
  const [specialNotes, setSpecialNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank' | 'jazzcash' | 'easypaisa'>('cod');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.total, 0);
  const deliveryFeeSetting = settings?.delivery_fee ?? 250;
  const freeThreshold = settings?.free_delivery_threshold ?? 4000;
  const isFreeDelivery = subtotal >= freeThreshold;
  const deliveryFee = deliveryType === 'delivery' ? (isFreeDelivery ? 0 : deliveryFeeSetting) : 0;
  const grandTotal = subtotal + deliveryFee;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMsg('Please enter your active WhatsApp / phone number');
      return;
    }
    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      setErrorMsg('Please provide your complete delivery address');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.createOrder({
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || undefined,
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery' ? deliveryAddress : undefined,
        delivery_city: deliveryType === 'delivery' ? deliveryCity : undefined,
        pickup_time: deliveryType === 'pickup' ? pickupTime : undefined,
        special_notes: specialNotes || undefined,
        items: cartItems,
        payment_method: paymentMethod
      });

      onOrderSuccess(response.order, response.whatsappUrl);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to place your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-[#FAF7F2] h-full shadow-2xl flex flex-col relative z-10 animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#EAE2D5] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#C2410C]" />
            <h2 className="text-lg font-serif font-bold text-[#2A170A]">
              {step === 'cart' ? 'Your Shopping Bag' : 'Express Checkout'}
            </h2>
            <span className="text-xs text-[#8C6D58] font-medium tabular-nums">
              ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#F2ECE1] text-[#2A170A] transition-colors cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#EAE2D5] flex items-center justify-center text-[#8C6D58]">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#2A170A]">
                Your bag is empty
              </h3>
              <p className="text-xs text-[#6B5544] max-w-xs">
                Explore our handcrafted motichoor laddus, pistachio barfi, or shahi halwa to start your order.
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Browse Menu
              </button>
            </div>
          ) : step === 'cart' ? (
            /* STEP 1: ITEM LIST */
            <div className="space-y-4">
              {/* Delivery threshold tip */}
              <div className="p-3 bg-[#FEF3C7] border border-[#FCD34D] rounded-xl text-xs text-[#854D0E] flex items-center justify-between">
                <span>
                  {isFreeDelivery
                    ? '🎉 You unlocked FREE Home Delivery!'
                    : `Add Rs. ${(freeThreshold - subtotal).toLocaleString()} more for FREE Delivery`}
                </span>
                <span className="font-bold tabular-nums">
                  Threshold: Rs. {freeThreshold.toLocaleString()}
                </span>
              </div>

              {/* Items list */}
              <div className="divide-y divide-[#EAE2D5]">
                {cartItems.map((item) => (
                  <div key={item.id} className="py-3.5 flex items-center gap-3">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#EAE2D5] shrink-0 border border-[#D9C8B4]">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[#8C6D58]">
                          Mithas
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-[#2A170A] truncate">
                        {item.name}
                      </h4>
                      <div className="text-[11px] text-[#8C6D58]">
                        Rs. {item.price_per_unit.toLocaleString()}/{item.unit}
                      </div>

                      {/* Stepper */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border border-[#D9C8B4] rounded-lg bg-white overflow-hidden">
                          <button
                            onClick={() => onUpdateQuantity(item.id, -0.5)}
                            className="p-1 hover:bg-[#FAF7F2] text-[#2A170A] cursor-pointer"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-semibold tabular-nums text-[#2A170A]">
                            {item.quantity} {item.unit}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, 0.5)}
                            className="p-1 hover:bg-[#FAF7F2] text-[#2A170A] cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-[#9A3412] hover:text-red-700 p-1 cursor-pointer transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Total for item */}
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-[#2A170A] tabular-nums">
                        Rs. {item.total.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* STEP 2: CHECKOUT FORM */
            <form onSubmit={handleCheckoutSubmit} className="space-y-5">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Delivery vs Pickup Toggle */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#2A170A] block mb-2">
                  Order Fulfillment:
                </label>
                <div className="grid grid-cols-2 gap-2 bg-[#EAE2D5] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('delivery')}
                    className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      deliveryType === 'delivery'
                        ? 'bg-white text-[#C2410C] shadow-xs'
                        : 'text-[#6B5544] hover:text-[#2A170A]'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Home Delivery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType('pickup')}
                    className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      deliveryType === 'pickup'
                        ? 'bg-white text-[#C2410C] shadow-xs'
                        : 'text-[#6B5544] hover:text-[#2A170A]'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Store Pickup</span>
                  </button>
                </div>
              </div>

              {/* Customer Contact */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-[#2A170A] block">
                  Customer Information:
                </label>
                <div>
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#D9C8B4] bg-white focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                    required
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="Active WhatsApp / Mobile Number (e.g. 0300 1234567) *"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#D9C8B4] bg-white focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                    required
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Email Address (Optional)"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#D9C8B4] bg-white focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                  />
                </div>
              </div>

              {/* Delivery Address OR Pickup Details */}
              {deliveryType === 'delivery' ? (
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#2A170A] block">
                    Delivery Address:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="City / Area *"
                      value={deliveryCity}
                      onChange={(e) => setDeliveryCity(e.target.value)}
                      className="sm:col-span-1 text-xs px-3 py-2.5 rounded-xl border border-[#D9C8B4] bg-white focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                      required
                    />
                    <input
                      type="text"
                      placeholder="House / Street / Sector *"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="sm:col-span-2 text-xs px-3 py-2.5 rounded-xl border border-[#D9C8B4] bg-white focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-[#FAF7F2] border border-[#EAE2D5] rounded-xl space-y-2.5">
                  <span className="text-xs font-bold text-[#C2410C] block">
                    Store Pickup Details:
                  </span>
                  <p className="text-xs text-[#5A4132] leading-relaxed">
                    Pickup details will be shared on WhatsApp after you place the order.
                  </p>
                  <div>
                    <label className="text-[11px] font-semibold text-[#8C6D58] block mb-1">
                      Preferred Pickup Time:
                    </label>
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-[#D9C8B4] bg-white"
                    >
                      <option value="Today (Within 2 Hours)">Today (Within 2 Hours)</option>
                      <option value="Today Evening (5:00 PM - 8:00 PM)">Today Evening (5:00 PM - 8:00 PM)</option>
                      <option value="Tomorrow Morning (10:00 AM - 1:00 PM)">Tomorrow Morning (10:00 AM - 1:00 PM)</option>
                      <option value="Tomorrow Evening (5:00 PM - 9:00 PM)">Tomorrow Evening (5:00 PM - 9:00 PM)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              <div>
                <input
                  type="text"
                  placeholder="Special instructions (e.g. Wedding gift ribbon, extra cardamom syrup)"
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#D9C8B4] bg-white focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                />
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-[#2A170A] block">
                  Payment Method:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      paymentMethod === 'cod'
                        ? 'border-[#C2410C] bg-[#FEF3C7]/40 text-[#2A170A] font-semibold shadow-xs'
                        : 'border-[#D9C8B4] bg-white text-[#5A4132]'
                    }`}
                  >
                    <div className="font-bold">Cash on Delivery (COD)</div>
                    <div className="text-[10px] text-[#8C6D58]">Pay upon sweet delivery</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      paymentMethod === 'bank'
                        ? 'border-[#C2410C] bg-[#FEF3C7]/40 text-[#2A170A] font-semibold shadow-xs'
                        : 'border-[#D9C8B4] bg-white text-[#5A4132]'
                    }`}
                  >
                    <div className="font-bold">{settings?.bank_name ? `${settings.bank_name} Transfer` : 'Bank Transfer'}</div>
                    <div className="text-[10px] text-[#8C6D58]">Direct online bank deposit</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('jazzcash')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      paymentMethod === 'jazzcash'
                        ? 'border-[#C2410C] bg-[#FEF3C7]/40 text-[#2A170A] font-semibold shadow-xs'
                        : 'border-[#D9C8B4] bg-white text-[#5A4132]'
                    }`}
                  >
                    <div className="font-bold">JazzCash</div>
                    <div className="text-[10px] text-[#8C6D58]">Instant wallet transfer</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('easypaisa')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      paymentMethod === 'easypaisa'
                        ? 'border-[#C2410C] bg-[#FEF3C7]/40 text-[#2A170A] font-semibold shadow-xs'
                        : 'border-[#D9C8B4] bg-white text-[#5A4132]'
                    }`}
                  >
                    <div className="font-bold">Easypaisa</div>
                    <div className="text-[10px] text-[#8C6D58]">Instant mobile payment</div>
                  </button>
                </div>

                {/* Bank / Wallet Detail Cards */}
                {paymentMethod === 'bank' && (
                  <div className="p-3 bg-white border border-[#D9C8B4] rounded-xl text-xs space-y-1.5 animate-in fade-in">
                    <div className="font-bold text-[#2A170A]">{settings?.bank_name || 'Meezan Bank Limited'}</div>
                    <div className="flex items-center justify-between text-[#5A4132]">
                      <span>Title: {settings?.bank_title || 'Mithas Sweets Gourmet'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[#5A4132]">
                      <span>Account: <span className="font-mono">{settings?.bank_account_no || '0214-0108920192'}</span></span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(settings?.bank_account_no || '0214-0108920192', 'bank_acc')}
                        className="text-[#C2410C] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'bank_acc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[#5A4132]">
                      <span>IBAN: <span className="font-mono text-[11px]">{settings?.bank_iban || 'PK45MEZN0002140108920192'}</span></span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(settings?.bank_iban || 'PK45MEZN0002140108920192', 'bank_iban')}
                        className="text-[#C2410C] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'bank_iban' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <div className="text-[11px] text-[#8C6D58] pt-1">
                      Please send the transfer receipt to our WhatsApp after placing your order.
                    </div>
                  </div>
                )}

                {paymentMethod === 'jazzcash' && (
                  <div className="p-3 bg-white border border-[#D9C8B4] rounded-xl text-xs space-y-1.5 animate-in fade-in">
                    <div className="font-bold text-[#2A170A]">JazzCash Mobile Account</div>
                    <div className="flex items-center justify-between text-[#5A4132]">
                      <span>Account Title: {settings?.jazzcash_title || 'Mithas Sweets Official'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[#5A4132]">
                      <span>Number: <span className="font-mono font-bold">{settings?.jazzcash_number || '0300-8472911'}</span></span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(settings?.jazzcash_number || '0300-8472911', 'jazz_num')}
                        className="text-[#C2410C] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'jazz_num' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === 'easypaisa' && (
                  <div className="p-3 bg-white border border-[#D9C8B4] rounded-xl text-xs space-y-1.5 animate-in fade-in">
                    <div className="font-bold text-[#2A170A]">Easypaisa Mobile Account</div>
                    <div className="flex items-center justify-between text-[#5A4132]">
                      <span>Account Title: {settings?.easypaisa_title || 'Mithas Sweets Store'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[#5A4132]">
                      <span>Number: <span className="font-mono font-bold">{settings?.easypaisa_number || '0300-8472911'}</span></span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(settings?.easypaisa_number || '0300-8472911', 'easy_num')}
                        className="text-[#C2410C] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'easy_num' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer with Subtotal and Checkout actions */}
        {cartItems.length > 0 && (
          <div className="p-5 border-t border-[#EAE2D5] bg-white space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-[#6B5544]">
                <span>Items Subtotal:</span>
                <span className="font-semibold tabular-nums text-[#2A170A]">Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-[#6B5544]">
                <span>Delivery Charges:</span>
                <span className="font-semibold tabular-nums text-[#2A170A]">
                  {deliveryFee === 0 ? 'FREE' : `Rs. ${deliveryFee.toLocaleString()}`}
                </span>
              </div>
              <div className="flex items-center justify-between text-base font-bold text-[#2A170A] pt-2 border-t border-[#F2ECE1]">
                <span>Total Amount:</span>
                <span className="tabular-nums text-[#C2410C]">Rs. {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {step === 'cart' ? (
              <button
                onClick={() => setStep('checkout')}
                className="w-full py-3 px-4 bg-[#C2410C] hover:bg-[#9A3412] text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="py-3 px-4 bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#2A170A] text-xs font-semibold rounded-xl border border-[#D9C8B4] transition-colors cursor-pointer"
                >
                  Back to Bag
                </button>
                <button
                  onClick={handleCheckoutSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 bg-[#C2410C] hover:bg-[#9A3412] text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming Order...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Order (Rs. {grandTotal.toLocaleString()})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
