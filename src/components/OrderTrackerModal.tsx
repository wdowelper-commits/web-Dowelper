import React, { useState, useEffect } from 'react';
import { 
  X, Search, Package, Clock, CheckCircle2, Truck, AlertCircle, 
  Loader2, Upload, FileCheck, Phone, FileText 
} from 'lucide-react';
import { Order } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

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
  const { isUrdu, t } = useLanguage();

  const [orderQuery, setOrderQuery] = useState(initialOrderNumber || '');
  const [phoneQuery, setPhoneQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Payment proof attachment state
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofSuccess, setProofSuccess] = useState(false);

  const fetchOrder = async (orderNum: string, phone: string) => {
    if (!orderNum.trim()) {
      setErrorMsg(isUrdu ? 'براہ کرم آرڈر نمبر درج کریں' : 'Please enter your order reference number');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg(isUrdu ? 'براہ کرم اپنا فون نمبر درج کریں' : 'Please enter the phone number used when placing the order');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setProofSuccess(false);

    try {
      const data = await api.trackOrder(orderNum.trim(), phone.trim());
      if (data) {
        setOrder(data);
      } else {
        setErrorMsg(
          isUrdu 
            ? 'کوئی آرڈر نہیں ملا۔ براہ کرم آرڈر نمبر اور فون نمبر چیک کریں۔'
            : 'No matching order found. Please ensure both Order Number and Phone match your order receipt.'
        );
        setOrder(null);
      }
    } catch {
      setErrorMsg('Failed to look up order. Please verify your details.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderNumber) {
      setOrderQuery(initialOrderNumber);
    }
  }, [initialOrderNumber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(orderQuery, phoneQuery);
  };

  const handleUploadPaymentProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile || !order) return;

    setUploadingProof(true);
    try {
      const filePath = await api.uploadPaymentProof(order.order_number, proofFile);
      const success = await api.attachPaymentProof(order.order_number, phoneQuery, filePath);
      if (success) {
        setProofSuccess(true);
        setProofFile(null);
        // Refresh order details
        fetchOrder(order.order_number, phoneQuery);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to upload proof. Please try again or send on WhatsApp.');
    } finally {
      setUploadingProof(false);
    }
  };

  const steps = [
    { title: isUrdu ? 'آرڈر موصول ہوا' : 'Order Placed', statusKey: 'New', icon: Package },
    { title: isUrdu ? 'تازہ تیاری' : 'Order Preparation', statusKey: 'Preparing', icon: Clock },
    { title: isUrdu ? 'ترسیل کے لیے روانہ' : 'Out for Delivery / Ready', statusKey: 'Out for Delivery', icon: Truck },
    { title: isUrdu ? 'پہنچ گیا / مکمل' : 'Delivered / Completed', statusKey: 'Delivered', icon: CheckCircle2 },
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

  if (!isOpen) return null;

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

        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-[#8C6D58] rounded-full text-xs font-semibold uppercase tracking-wider">
            <Search className="w-3.5 h-3.5 text-[#C2410C]" />
            <span>{isUrdu ? 'لائیو ٹریکنگ' : 'Live Order Tracker'}</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#2A170A]">
            {isUrdu ? 'اپنے آرڈر کی لائیو صورتحال جانیں' : 'Track Your Sweets Order'}
          </h2>
          <p className="text-xs text-[#5A4132]">
            {isUrdu 
              ? 'اپنے آرڈر کی تصدیق اور لائیو تیاری کی معلومات کے لیے آرڈر نمبر اور فون درج کریں۔'
              : 'Enter your official order reference (e.g. MS-2026-1024) and phone number to verify status.'}
          </p>
        </div>

        {/* Search Form with Order Number AND Phone (RPC Security requirement) */}
        <form onSubmit={handleSearch} className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-[#8C6D58] block mb-1">
                {isUrdu ? 'آرڈر نمبر' : 'Order Reference Number *'}
              </label>
              <input
                type="text"
                required
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                placeholder="MS-2026-XXXX"
                className="w-full px-3 py-2 text-xs uppercase bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl focus:outline-hidden focus:border-[#C2410C] font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#8C6D58] block mb-1">
                {isUrdu ? 'موبائل نمبر' : 'Registered Phone Number *'}
              </label>
              <input
                type="tel"
                required
                value={phoneQuery}
                onChange={(e) => setPhoneQuery(e.target.value)}
                placeholder="03001234567"
                className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl focus:outline-hidden focus:border-[#C2410C]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#2A170A] hover:bg-[#C2410C] text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>{isUrdu ? 'آرڈر تلاش کریں' : 'Track Order'}</span>
          </button>
        </form>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Order Details Output */}
        {order && (
          <div className="space-y-6 pt-2 border-t border-[#EAE2D5] animate-in fade-in">
            {/* Status Pipeline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8C6D58]">
                  {isUrdu ? 'موجودہ مرحلہ:' : 'Preparation Pipeline:'}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                  {order.status}
                </span>
              </div>

              {/* Step indicator */}
              <div className="grid grid-cols-4 gap-1 sm:gap-2">
                {steps.map((st, idx) => {
                  const Icon = st.icon;
                  const isDone = idx <= currentStep;
                  const isCurrent = idx === currentStep;

                  return (
                    <div key={idx} className="flex flex-col items-center text-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors mb-1 ${
                        isCurrent
                          ? 'bg-[#C2410C] text-white ring-2 ring-[#C2410C]/30 shadow-xs'
                          : isDone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#F2ECE1] text-[#8C6D58]'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-[10px] leading-tight line-clamp-2 ${
                        isCurrent ? 'font-bold text-[#2A170A]' : 'text-[#8C6D58]'
                      }`}>
                        {st.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Items & Summary */}
            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#EAE2D5] space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-[#EAE2D5]">
                <span className="font-mono font-bold text-[#C2410C]">{order.order_number}</span>
                <span className="text-[#8C6D58]">{new Date(order.created_at).toLocaleDateString()}</span>
              </div>

              <div className="space-y-1 py-1 max-h-36 overflow-y-auto">
                {order.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[#5A4132]">
                    <span>{it.name} × {it.quantity} {it.unit}</span>
                    <span className="font-semibold">Rs. {it.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#EAE2D5] flex justify-between font-bold text-sm text-[#2A170A]">
                <span>{isUrdu ? 'کل رقم:' : 'Total Payable:'}</span>
                <span className="text-[#C2410C]">Rs. {order.total.toLocaleString()}</span>
              </div>

              <div className="text-[11px] text-[#8C6D58] pt-1">
                Payment: <strong className="uppercase">{order.payment_method}</strong> ({order.payment_status || 'pending'})
              </div>
            </div>

            {/* Status History Timeline if available */}
            {order.status_history && order.status_history.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8C6D58] block">
                  {isUrdu ? 'آرڈر کی تفصیلی تاریخ:' : 'Activity Timeline:'}
                </span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {order.status_history.map((h, i) => (
                    <div key={i} className="text-xs p-2 bg-[#FAF7F2] rounded-lg border border-[#EAE2D5] flex justify-between items-center">
                      <div>
                        <span className="font-bold text-[#2A170A]">{h.status}</span>
                        {h.note && <span className="text-[#8C6D58] ml-2 text-[11px]">— {h.note}</span>}
                      </div>
                      <span className="text-[10px] text-[#8C6D58]">
                        {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Proof Upload Option for manual methods */}
            {order.payment_method !== 'cod' && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#2A170A]">
                  <FileText className="w-4 h-4 text-[#C2410C]" />
                  <span>{isUrdu ? 'ادائیگی کا ثبوت / رسید' : 'Payment Proof Verification'}</span>
                </div>

                {order.payment_proof_path ? (
                  <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>Receipt screenshot uploaded and under verification by accounts team.</span>
                  </div>
                ) : (
                  <form onSubmit={handleUploadPaymentProof} className="space-y-2">
                    <p className="text-[11px] text-[#5A4132]">
                      Upload your bank/JazzCash/EasyPaisa transfer screenshot to expedite order dispatch:
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                      className="text-xs text-[#5A4132] file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#2A170A] file:text-white hover:file:bg-[#C2410C]"
                    />
                    <button
                      type="submit"
                      disabled={uploadingProof || !proofFile}
                      className="w-full py-2 bg-[#C2410C] hover:bg-[#9A3412] text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {uploadingProof ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>Upload Payment Screenshot</span>
                    </button>
                  </form>
                )}

                {proofSuccess && (
                  <p className="text-[11px] text-emerald-700 font-semibold">
                    Screenshot uploaded successfully!
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
