import React from 'react';
import { X, MessageSquare, Send, CheckCircle2, User, Phone, Mail, Clock } from 'lucide-react';
import { ContactMessage } from '../../types';

interface MessageDetailModalProps {
  message: ContactMessage | null;
  onClose: () => void;
  shopWhatsapp: string;
}

export const MessageDetailModal: React.FC<MessageDetailModalProps> = ({
  message,
  onClose,
  shopWhatsapp
}) => {
  if (!message) return null;

  const handleReplyWhatsApp = () => {
    const cleanPhone = shopWhatsapp.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `*Mithas Sweets Support*\n\n` +
      `Hello ${message.name},\n` +
      `Regarding your message about *"${message.subject}"*:\n\n` +
      `How can we assist you today?`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 border border-[#D9C8B4] shadow-2xl relative">
        <div className="flex justify-between items-center pb-3 border-b border-[#EAE2D5]">
          <div>
            <h3 className="text-lg font-serif font-bold text-[#2A170A]">{message.subject}</h3>
            <span className="text-xs text-[#8C6D58]">
              Received {new Date(message.created_at).toLocaleString()}
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sender Info */}
        <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#EAE2D5] space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#2A170A]">
            <User className="w-3.5 h-3.5 text-[#C2410C]" />
            <span>{message.name}</span>
          </div>
          <div className="flex items-center gap-2 text-[#5A4132] font-mono">
            <Phone className="w-3.5 h-3.5 text-[#C2410C]" />
            <span>{message.phone}</span>
          </div>
          {message.email && (
            <div className="flex items-center gap-2 text-[#5A4132]">
              <Mail className="w-3.5 h-3.5 text-[#C2410C]" />
              <span>{message.email}</span>
            </div>
          )}
        </div>

        {/* Message Body */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D58] block">Customer Message</span>
          <div className="p-4 bg-white rounded-2xl border border-[#EAE2D5] text-xs text-[#2A170A] leading-relaxed whitespace-pre-wrap">
            {message.message}
          </div>
        </div>

        {/* WhatsApp Reply Button */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleReplyWhatsApp}
            className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <Send className="w-4 h-4" />
            <span>Reply on WhatsApp ({shopWhatsapp})</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-[#D9C8B4] text-[#5A4132] rounded-xl text-xs font-semibold hover:bg-[#FAF7F2]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
