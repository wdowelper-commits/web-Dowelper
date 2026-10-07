import React from 'react';
import { CheckCircle2, MessageCircle, Copy, Check, ArrowRight, X, PhoneCall, MapPin } from 'lucide-react';
import { Order } from '../types';

interface OrderConfirmationModalProps {
  order: Order | null;
  whatsappUrl?: string;
  onClose: () => void;
  onTrackOrder: (orderNumber: string) => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  whatsappUrl,
  onClose,
  onTrackOrder
}) => {
  if (!order) return null;

  const [copied, setCopied] = React.useState(false);

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(order.order_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#D9C8B4] relative p-6 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#FAF7F2] text-[#2A170A] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-200 shadow-xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#2A170A]">
            Mubarak! Order Confirmed
          </h2>
          <p className="text-xs sm:text-sm text-[#5A4132] max-w-sm mx-auto">
            Your sweets order has been received and is being prepared fresh for you.
          </p>
        </div>

        {/* Order Number Ribbon */}
        <div className="p-4 bg-[#FAF7F2] border border-[#EAE2D5] rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#8C6D58] font-bold block">
              Official Order Reference
            </span>
            <span className="text-xl font-mono font-bold text-[#C2410C]">
              {order.order_number}
            </span>
          </div>
          <button
            onClick={handleCopyOrderNumber}
            className="px-3 py-1.5 text-xs font-medium text-[#2A170A] bg-white border border-[#D9C8B4] rounded-lg hover:bg-[#F2ECE1] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* WhatsApp Direct Notification Card */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs sm:text-sm">
            <MessageCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Send Order Receipt to Shop WhatsApp</span>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            Send a 1-click WhatsApp message to our kitchen line so our team can expedite packaging and confirm your dispatch instantly!
          </p>
          <button
            onClick={handleOpenWhatsApp}
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Notify Mithas Kitchen on WhatsApp</span>
          </button>
        </div>

        {/* Order Item Details */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#2A170A]">
            Ordered Sweets Breakdown:
          </h4>
          <div className="divide-y divide-[#F2ECE1] border-y border-[#F2ECE1] py-1 max-h-48 overflow-y-auto">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-[#2A170A]">{item.name}</span>
                  <span className="text-[#8C6D58] ml-2">({item.quantity} {item.unit})</span>
                </div>
                <span className="font-bold tabular-nums text-[#2A170A]">
                  Rs. {item.total.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-1 text-xs pt-1">
            <div className="flex justify-between text-[#6B5544]">
              <span>Subtotal:</span>
              <span className="font-semibold tabular-nums">Rs. {order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[#6B5544]">
              <span>Delivery Fee:</span>
              <span className="font-semibold tabular-nums">
                {order.delivery_fee === 0 ? 'FREE' : `Rs. ${order.delivery_fee.toLocaleString()}`}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[#2A170A] pt-1 border-t border-[#F2ECE1]">
              <span>Total Payable:</span>
              <span className="tabular-nums text-[#C2410C]">Rs. {order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Customer & Fulfillment Info */}
        <div className="p-3 bg-[#FAF7F2] rounded-xl text-xs space-y-1.5 text-[#5A4132]">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-3.5 h-3.5 text-[#8C6D58]" />
            <span>Customer: <strong>{order.customer_name}</strong> ({order.customer_phone})</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#8C6D58]" />
            <span>
              {order.delivery_type === 'delivery' 
                ? `Delivery: ${order.delivery_address}${order.delivery_city ? `, ${order.delivery_city}` : ''}` 
                : 'Store Pickup: Pickup details will be shared on WhatsApp after you place the order.'}
            </span>
          </div>
          <div className="text-[11px] text-[#8C6D58]">
            Payment Method: <strong className="uppercase">{order.payment_method}</strong> · Current Status: <span className="text-amber-800 font-semibold">{order.status}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={() => {
              onClose();
              onTrackOrder(order.order_number);
            }}
            className="flex-1 py-2.5 px-4 bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#D9C8B4] text-[#2A170A] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Track Live Status
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};
