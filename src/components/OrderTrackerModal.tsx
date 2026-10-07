import React, { useState, useEffect } from 'react';
import { X, Search, Package, Clock, CheckCircle2, Truck, AlertCircle, Loader2 } from 'lucide-react';
import { Order } from '../types';
import { api } from '../services/api';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderNumber?: string;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  initialOrderNumber
}) => {
  if (!isOpen) return null;

  const [orderQuery, setOrderQuery] = useState(initialOrderNumber || '');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchOrder = async (num: string) => {
    if (!num.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getOrderByNumber(num.trim());
      setOrder(data);
    } catch {
      setErrorMsg('No order found with this reference number. Please check the digits.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderNumber) {
      setOrderQuery(initialOrderNumber);
      fetchOrder(initialOrderNumber);
    }
  }, [initialOrderNumber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(orderQuery);
  };

  const steps = [
    { title: 'Order Placed', statusKey: 'New', icon: Package },
    { title: 'Preparing Fresh', statusKey: 'Preparing', icon: Clock },
    { title: 'Out for Delivery / Ready', statusKey: 'Out for Delivery', icon: Truck },
    { title: 'Delivered / Completed', statusKey: 'Delivered', icon: CheckCircle2 },
  ];

  const getStepIndex = (status: Order['status']) => {
    switch (status) {
      case 'New': return 0;
      case 'Preparing': return 1;
      case 'Out for Delivery': return 2;
      case 'Delivered': return 3;
      default: return 0;
    }
  };

  const currentStep = order ? getStepIndex(order.status) : 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#D9C8B4] relative p-6 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#FAF7F2] text-[#2A170A] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-xl font-serif font-bold text-[#2A170A]">
            Track Your Mithai Order
          </h2>
          <p className="text-xs text-[#6B5544] mt-0.5">
            Enter your order reference code (e.g. MS-2026-1042) to view live kitchen status.
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Order # (e.g. MS-2026-8492)"
            value={orderQuery}
            onChange={(e) => setOrderQuery(e.target.value)}
            className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-[#D9C8B4] focus:outline-none focus:ring-2 focus:ring-[#C2410C] font-mono uppercase"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Track</span>
          </button>
        </form>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Result Tracking Details */}
        {order && (
          <div className="p-5 bg-[#FAF7F2] border border-[#EAE2D5] rounded-2xl space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE2D5]">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#8C6D58] font-bold block">
                  Order Status
                </span>
                <span className="text-base font-bold text-[#C2410C]">
                  {order.status}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-[#2A170A] block">
                  {order.order_number}
                </span>
                <span className="text-[11px] text-[#8C6D58]">
                  {new Date(order.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Stepper Visualizer */}
            <div className="space-y-4">
              {steps.map((st, idx) => {
                const Icon = st.icon;
                const isPassed = idx <= currentStep;
                const isCurrent = idx === currentStep;

                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                      isCurrent
                        ? 'bg-[#C2410C] text-white border-[#C2410C] ring-4 ring-[#C2410C]/20'
                        : isPassed
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-gray-400 border-gray-200'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className={`text-xs font-bold ${isCurrent ? 'text-[#C2410C]' : isPassed ? 'text-[#2A170A]' : 'text-gray-400'}`}>
                        {st.title}
                      </div>
                      {isCurrent && (
                        <div className="text-[11px] text-[#8C6D58]">
                          Fresh batch in progress
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary details */}
            <div className="pt-3 border-t border-[#EAE2D5] text-xs text-[#5A4132] space-y-1">
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-semibold text-[#2A170A]">{order.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Fulfillment:</span>
                <span className="font-semibold text-[#2A170A] capitalize">{order.delivery_type}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-bold text-[#C2410C] tabular-nums">Rs. {order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
