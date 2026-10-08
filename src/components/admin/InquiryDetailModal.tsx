import React, { useState } from 'react';
import { X, Calendar, MessageCircle, Send, CheckCircle2, DollarSign, Clock, Users, User, Phone, Mail } from 'lucide-react';
import { EventInquiry } from '../../types';
import { api } from '../../services/api';

interface InquiryDetailModalProps {
  inquiry: EventInquiry | null;
  onClose: () => void;
  onRefresh: () => void;
  shopWhatsapp: string;
}

export const InquiryDetailModal: React.FC<InquiryDetailModalProps> = ({
  inquiry,
  onClose,
  onRefresh,
  shopWhatsapp
}) => {
  if (!inquiry) return null;

  const [status, setStatus] = useState<EventInquiry['status']>(inquiry.status);
  const [quoteAmount, setQuoteAmount] = useState<number>(inquiry.quote_amount || 0);
  const [quoteNote, setQuoteNote] = useState<string>(inquiry.quote_note || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await api.updateInquiryQuote(inquiry.id, Number(quoteAmount), quoteNote);
      await api.updateInquiryStatus(inquiry.id, status);
      setSavedSuccess(true);
      onRefresh();
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update quote');
    } finally {
      setSaving(false);
    }
  };

  const handleSendQuoteWhatsApp = () => {
    const cleanPhone = shopWhatsapp.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `*Mithas Sweets Bulk Catering Quotation*\n\n` +
      `Assalam-o-Alaikum ${inquiry.name}!\n\n` +
      `We have prepared your custom mithai quotation for *${inquiry.event_type}*:\n` +
      `• Date: ${inquiry.event_date}\n` +
      `• Estimated Boxes / Guests: ~${inquiry.estimated_boxes} boxes\n` +
      `• *Total Quoted Amount:* Rs. ${Number(quoteAmount).toLocaleString()}\n` +
      (quoteNote ? `• Notes: ${quoteNote}\n\n` : `\n`) +
      `All boxes are handcrafted fresh in pure desi ghee with personalized ribbons.\n` +
      `Please let us know if you would like us to schedule a tasting box for you!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 border border-[#D9C8B4] shadow-2xl relative">
        <div className="flex justify-between items-center pb-3 border-b border-[#EAE2D5]">
          <div>
            <h3 className="text-lg font-serif font-bold text-[#2A170A]">Event Catering Proposal</h3>
            <span className="text-xs text-[#8C6D58]">{inquiry.event_type}</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Quotation saved and updated to status "Quoted"!</span>
          </div>
        )}

        {/* Customer & Event Details */}
        <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#EAE2D5] space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#2A170A]">
            <User className="w-3.5 h-3.5 text-[#C2410C]" />
            <span>{inquiry.name}</span>
          </div>
          <div className="flex items-center gap-2 text-[#5A4132] font-mono">
            <Phone className="w-3.5 h-3.5 text-[#C2410C]" />
            <span>{inquiry.phone}</span>
          </div>
          {inquiry.email && (
            <div className="flex items-center gap-2 text-[#5A4132]">
              <Mail className="w-3.5 h-3.5 text-[#C2410C]" />
              <span>{inquiry.email}</span>
            </div>
          )}

          <div className="pt-2 border-t border-[#EAE2D5] grid grid-cols-2 gap-2 text-[#5A4132]">
            <div>Event Date: <strong>{inquiry.event_date}</strong></div>
            <div>Boxes / Volume: <strong>{inquiry.estimated_boxes} Boxes</strong></div>
            <div>Budget: <strong>{inquiry.budget_range || 'Custom tier'}</strong></div>
            <div>Submitted: <strong>{new Date(inquiry.created_at).toLocaleDateString()}</strong></div>
          </div>

          {inquiry.custom_requirements && (
            <div className="pt-2 text-[#8C6D58] italic border-t border-[#EAE2D5]">
              "{inquiry.custom_requirements}"
            </div>
          )}
        </div>

        {/* Quote Form */}
        <form onSubmit={handleSaveQuote} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">Inquiry Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl font-semibold"
              >
                <option value="New">New</option>
                <option value="Quoted">Quoted</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">Quote Amount (Rs)</label>
              <input
                type="number"
                min="0"
                step="500"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(Number(e.target.value))}
                placeholder="e.g. 85000"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl font-mono font-bold text-[#2A170A]"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-[#8C6D58] block mb-1">Quote Description & Package Notes</label>
            <textarea
              rows={3}
              value={quoteNote}
              onChange={(e) => setQuoteNote(e.target.value)}
              placeholder="e.g. 50x Royal Gold Box with Kaju Katli + Pistachio Barfi + custom wedding ribbon"
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-[#C2410C] hover:bg-[#9A3412] text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>{saving ? 'Saving Quote...' : 'Save & Update Proposal'}</span>
            </button>

            {quoteAmount > 0 && (
              <button
                type="button"
                onClick={handleSendQuoteWhatsApp}
                className="py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send on WhatsApp</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
