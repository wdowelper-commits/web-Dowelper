import React, { useState } from 'react';
import { 
  X, Printer, CheckCircle2, XCircle, AlertCircle, Clock, 
  ExternalLink, User, Phone, Mail, MapPin, Calendar, FileText, Loader2
} from 'lucide-react';
import { Order } from '../../types';
import { api } from '../../services/api';

interface OrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
  onRefresh: () => void;
  shopName: string;
  shopPhone: string;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
  onRefresh,
  shopName,
  shopPhone,
}) => {
  if (!order) return null;

  const [loadingProofUrl, setLoadingProofUrl] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [paymentUpdating, setPaymentUpdating] = useState(false);
  
  // Status update with optional note/cancel reason
  const [newStatus, setNewStatus] = useState<Order['status']>(order.status);
  const [statusNote, setStatusNote] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  // Payment rejection modal/input
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Status History
  const [history, setHistory] = useState(order.status_history || []);
  const [loadingHistory, setLoadingHistory] = useState(false);

  React.useEffect(() => {
    setNewStatus(order.status);
    setProofUrl(null);
    setMessage(null);
    loadHistory();
  }, [order.id]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const records = await api.getOrderStatusHistory(order.id);
      if (records && records.length > 0) {
        setHistory(records);
      } else {
        setHistory(order.status_history || []);
      }
    } catch {
      setHistory(order.status_history || []);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFetchPaymentProof = async () => {
    if (!order.payment_proof_path) return;
    setLoadingProofUrl(true);
    try {
      const url = await api.getPaymentProofSignedUrl(order.payment_proof_path);
      if (url) {
        setProofUrl(url);
        window.open(url, '_blank');
      } else {
        setMessage({ type: 'error', text: 'Could not generate signed URL for payment proof.' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Error loading proof' });
    } finally {
      setLoadingProofUrl(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (newStatus === order.status && !statusNote) return;
    if (newStatus === 'Cancelled' && !cancelReason.trim()) {
      setMessage({ type: 'error', text: 'A cancellation reason is required when cancelling an order.' });
      return;
    }

    setStatusUpdating(true);
    setMessage(null);
    try {
      await api.updateOrderStatus(order.id, newStatus, statusNote.trim() || undefined, newStatus === 'Cancelled' ? cancelReason.trim() : undefined);
      setMessage({ type: 'success', text: `Order status updated to ${newStatus}` });
      setStatusNote('');
      setCancelReason('');
      await loadHistory();
      onRefresh();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to update status' });
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleVerifyPayment = async () => {
    setPaymentUpdating(true);
    setMessage(null);
    try {
      await api.updateOrderPaymentStatus(order.id, 'verified', 'Payment verified by administrator');
      setMessage({ type: 'success', text: 'Payment successfully marked as verified!' });
      onRefresh();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to verify payment' });
    } finally {
      setPaymentUpdating(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!rejectionNote.trim()) {
      setMessage({ type: 'error', text: 'A rejection note is required to reject a payment proof.' });
      return;
    }
    setPaymentUpdating(true);
    setMessage(null);
    try {
      await api.updateOrderPaymentStatus(order.id, 'rejected', rejectionNote.trim());
      setShowRejectModal(false);
      setRejectionNote('');
      setMessage({ type: 'success', text: 'Payment marked as rejected with customer note saved.' });
      onRefresh();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to reject payment' });
    } finally {
      setPaymentUpdating(false);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto border border-[#D9C8B4] shadow-2xl relative">
        
        {/* Header (Hidden on print) */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EAE2D5] print:hidden">
          <div className="flex items-center gap-3">
            <span className="text-xl sm:text-2xl font-serif font-bold text-[#2A170A]">
              {order.order_number}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
              order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
              order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
              order.status === 'Out for Delivery' ? 'bg-blue-100 text-blue-800' :
              order.status === 'Preparing' ? 'bg-purple-100 text-purple-800' :
              'bg-amber-100 text-amber-900'
            }`}>
              {order.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintInvoice}
              className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#EAE2D5] text-[#2A170A] border border-[#D9C8B4] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print Order Invoice"
            >
              <Printer className="w-4 h-4 text-[#C2410C]" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-neutral-100 text-neutral-500 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE INVOICE HEADER (Shown on window.print()) */}
        <div className="hidden print:block pb-4 mb-4 border-b-2 border-black">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-serif font-bold text-black">{shopName}</h1>
              <p className="text-xs text-neutral-600">Official Order Invoice</p>
              <p className="text-xs text-neutral-600">Phone & WhatsApp: {shopPhone}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-mono font-bold text-black">{order.order_number}</h2>
              <p className="text-xs text-neutral-600">{new Date(order.created_at).toLocaleString()}</p>
              <p className="text-xs font-bold">Status: {order.status}</p>
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 print:hidden ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Customer & Delivery Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#FAF7F2] p-4 rounded-2xl border border-[#EAE2D5]">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D58] block">Customer Details</span>
            <div className="font-bold text-[#2A170A] text-sm flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#C2410C]" />
              <span>{order.customer_name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#5A4132] font-mono">
              <Phone className="w-3.5 h-3.5 text-[#C2410C]" />
              <span>{order.customer_phone}</span>
            </div>
            {order.customer_email && (
              <div className="flex items-center gap-1.5 text-[#5A4132]">
                <Mail className="w-3.5 h-3.5 text-[#C2410C]" />
                <span>{order.customer_email}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D58] block">Fulfillment</span>
            <div>Delivery Mode: <strong className="capitalize">{order.delivery_type}</strong></div>
            <div>Slot: <strong>{order.delivery_slot || 'Standard / ASAP'}</strong></div>
            {order.delivery_address && (
              <div className="flex items-start gap-1.5 text-[#5A4132]">
                <MapPin className="w-3.5 h-3.5 text-[#C2410C] shrink-0 mt-0.5" />
                <span>{order.delivery_address}{order.delivery_city ? `, ${order.delivery_city}` : ''}</span>
              </div>
            )}
            {order.special_notes && (
              <div className="pt-1 italic text-[#8C6D58]">
                Note: "{order.special_notes}"
              </div>
            )}
          </div>
        </div>

        {/* Items Summary Table */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#2A170A] uppercase tracking-wider block">Ordered Items</span>
          <div className="border border-[#EAE2D5] rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-[#8C6D58] uppercase border-b border-[#EAE2D5]">
                <tr>
                  <th className="p-3">Item Name</th>
                  <th className="p-3">Portion / Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE1]">
                {order.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF7F2]/50">
                    <td className="p-3">
                      <div className="font-semibold text-[#2A170A]">{it.name}</div>
                      {it.box_description && (
                        <span className="text-[11px] text-[#C2410C] italic block">Custom contents: {it.box_description}</span>
                      )}
                    </td>
                    <td className="p-3 font-medium">{it.quantity} {it.unit}</td>
                    <td className="p-3 text-right font-mono">Rs. {it.price_per_unit.toLocaleString()}</td>
                    <td className="p-3 text-right font-bold text-[#2A170A] font-mono">Rs. {it.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#EAE2D5] space-y-1.5 text-xs max-w-xs ml-auto">
            <div className="flex justify-between text-[#8C6D58]">
              <span>Subtotal:</span>
              <span className="font-mono">Rs. {order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[#8C6D58]">
              <span>Delivery Fee:</span>
              <span className="font-mono">Rs. {order.delivery_fee.toLocaleString()}</span>
            </div>
            {(order.discount_amount || 0) > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount:</span>
                <span className="font-mono">- Rs. {order.discount_amount?.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-[#2A170A] pt-2 border-t border-[#EAE2D5]">
              <span>Grand Total:</span>
              <span className="text-[#C2410C] font-mono">Rs. {order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Payment Verification Section (Hidden on print) */}
        <div className="p-4 bg-white rounded-2xl border border-[#EAE2D5] space-y-3 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2A170A]">Payment:</span>
              <span className="text-xs uppercase font-mono font-bold bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#D9C8B4]">
                {order.payment_method}
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded font-bold uppercase ${
                order.payment_status === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                order.payment_status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-amber-100 text-amber-900'
              }`}>
                {order.payment_status}
              </span>
            </div>

            {order.payment_proof_path ? (
              <button
                type="button"
                onClick={handleFetchPaymentProof}
                disabled={loadingProofUrl}
                className="px-3 py-1.5 bg-[#2A170A] hover:bg-[#C2410C] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {loadingProofUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                <span>View Payment Proof</span>
              </button>
            ) : (
              <span className="text-xs text-[#8C6D58] italic">No receipt uploaded</span>
            )}
          </div>

          {order.payment_note && (
            <div className="text-xs text-[#5A4132] bg-[#FAF7F2] p-2.5 rounded-xl border border-[#EAE2D5]">
              <strong>Payment Note:</strong> {order.payment_note}
            </div>
          )}

          {/* Action buttons for verification */}
          {order.payment_method !== 'cod' && (
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleVerifyPayment}
                disabled={paymentUpdating || order.payment_status === 'verified'}
                className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify Payment</span>
              </button>
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                disabled={paymentUpdating || order.payment_status === 'rejected'}
                className="flex-1 py-2 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Payment</span>
              </button>
            </div>
          )}

          {/* Reject Reason input modal */}
          {showRejectModal && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 mt-2">
              <label className="text-xs font-bold text-red-900 block">Required Payment Rejection Note:</label>
              <input
                type="text"
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="e.g. Screenshot blurry, transaction ID not found, incorrect amount"
                className="w-full text-xs p-2 rounded-lg bg-white border border-red-300 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-3 py-1 bg-white text-xs rounded-lg border border-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectPayment}
                  disabled={paymentUpdating}
                  className="px-3 py-1 bg-red-700 text-white text-xs font-semibold rounded-lg"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Status Updater Section (Hidden on print) */}
        <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#EAE2D5] space-y-3 print:hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2A170A] block">Update Order Status</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#8C6D58] block mb-1">New Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full p-2 bg-white rounded-xl border border-[#D9C8B4] text-xs font-semibold"
              >
                <option value="New">New</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Preparing">Preparing</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#8C6D58] block mb-1">Status Note (Optional)</label>
              <input
                type="text"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="e.g. Dispatched with rider Tariq"
                className="w-full p-2 bg-white rounded-xl border border-[#D9C8B4] text-xs"
              />
            </div>
          </div>

          {newStatus === 'Cancelled' && (
            <div>
              <label className="text-[11px] font-semibold text-red-700 block mb-1">Cancel Reason (Required) *</label>
              <input
                type="text"
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Customer requested cancellation / Address unreachable"
                className="w-full p-2 bg-white rounded-xl border border-red-300 text-xs text-red-900"
              />
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleUpdateStatus}
              disabled={statusUpdating || (newStatus === order.status && !statusNote)}
              className="px-5 py-2 bg-[#C2410C] hover:bg-[#9A3412] disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              {statusUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Save Status Change</span>
            </button>
          </div>
        </div>

        {/* Status History Timeline (Hidden on print) */}
        <div className="space-y-2 print:hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2A170A]">Status History Timeline</span>
            {loadingHistory && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C2410C]" />}
          </div>

          <div className="space-y-2 border-l-2 border-[#D9C8B4] pl-4 ml-2">
            {history.length > 0 ? (
              history.map((hist, idx) => (
                <div key={idx} className="relative text-xs space-y-0.5">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#C2410C]" />
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#2A170A]">{hist.status}</span>
                    <span className="text-[11px] text-[#8C6D58]">
                      {new Date(hist.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(hist.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {hist.changed_by && (
                    <div className="text-[11px] text-[#8C6D58]">By: {hist.changed_by}</div>
                  )}
                  {hist.note && (
                    <div className="text-xs text-[#5A4132] italic">"{hist.note}"</div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-xs text-[#8C6D58] italic">Initial order creation recorded.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
