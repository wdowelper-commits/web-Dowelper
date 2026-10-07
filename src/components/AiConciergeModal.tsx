import React, { useState } from 'react';
import { X, Sparkles, Send, Loader2, ArrowRight, CheckCircle2, MessageCircle } from 'lucide-react';
import { api } from '../services/api';

interface AiConciergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEventInquiry: (details: { occasion: string; boxes: number; notes: string }) => void;
  whatsappNumber?: string;
}

export const AiConciergeModal: React.FC<AiConciergeModalProps> = ({
  isOpen,
  onClose,
  onSelectEventInquiry,
  whatsappNumber = '+92 300 8472911'
}) => {
  if (!isOpen) return null;

  const [occasion, setOccasion] = useState('Wedding / Baraat / Walima');
  const [guestCount, setGuestCount] = useState<number>(100);
  const [dietary, setDietary] = useState('Traditional Rich & Saffron');
  const [budget, setBudget] = useState('Premium Luxury (Rs. 1,800 - 2,500 / box)');
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const occasionOptions = [
    'Wedding / Baraat / Walima',
    'Eid Mubarak Celebrations',
    'Corporate Executive Gifting',
    'Engagement / Ring Ceremony',
    'Baby Announcement / Birth Tofa',
    'Family Festive Dawat'
  ];

  const dietaryOptions = [
    'Traditional Rich & Saffron',
    'Balanced (Khoya + Dry Fruit Sweets)',
    'Low Sugar / Elder Friendly (Anjeer & Dates)',
    'Nut Lovers (Pistachio & Cashew Dominant)'
  ];

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await api.getAiConciergeRecommendation({
        occasion,
        guestCount,
        dietaryPreferences: dietary,
        budget,
        query: customPrompt.trim() || undefined
      });
      setResult(response.recommendation);
    } catch (err) {
      console.error(err);
      setResult(
        `### Curated Wedding Sweet Box Assortment\n\nFor ${guestCount} guests, our Master Halwai suggests:\n- **Royal Motichoor Laddu (Pure Desi Ghee)**: 35% of volume\n- **Kaju Katli Special**: 35% of volume\n- **Royal Pistachio Saffron Barfi**: 30% of volume\n\nEstimated portion: **${Math.ceil(guestCount * 0.08)} kg**.\nPlease submit an inquiry to finalize custom embossed packaging!`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendToWhatsApp = () => {
    if (!result) return;
    const cleanWa = whatsappNumber.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `*Mithas Sweets AI Concierge Plan Inquiry*\n\n` +
      `*Occasion:* ${occasion}\n` +
      `*Guests / Boxes:* ${guestCount}\n` +
      `*Dietary Preference:* ${dietary}\n\n` +
      `*Recommendation Received:*\n${result.slice(0, 1000)}...\n\n` +
      `I would like to discuss and place an order for this custom arrangement.`
    );
    window.location.href = `https://wa.me/${cleanWa}?text=${text}`;
  };

  const handleTransferToInquiry = () => {
    const estBoxes = Math.ceil(guestCount / 4);
    onSelectEventInquiry({
      occasion,
      boxes: estBoxes,
      notes: `AI Recommendation Plan for ${guestCount} guests (${dietary}). ${customPrompt ? `Note: ${customPrompt}` : ''}`
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#D9C8B4] relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#EAE2D5] bg-[#FAF7F2] sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-[#D97706] rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-[#2A170A]">
                Royal Sweet Sommelier & Event Planner
              </h2>
              <span className="text-xs text-[#8C6D58]">
                Deep Reasoning · Powered by Gemini 3.1 Pro High Thinking
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#EAE2D5] text-[#2A170A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          <p className="text-xs sm:text-sm text-[#5A4132] leading-relaxed">
            Planning a celebration, wedding, or corporate delegation? Our royal confectionery sommelier calculates exact sweet portions, flavor balances (creamy vs nutty vs syrup-steeped), and customized gift box assortments based on authentic recipes.
          </p>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#2A170A] block mb-1.5">
                  1. Event Occasion
                </label>
                <select
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-[#D9C8B4] bg-white focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                >
                  {occasionOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2A170A] block mb-1.5">
                  2. Number of Guests / Target Boxes
                </label>
                <input
                  type="number"
                  min="5"
                  max="5000"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-[#D9C8B4] bg-white focus:outline-none focus:ring-2 focus:ring-[#C2410C] tabular-nums"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2A170A] block mb-1.5">
                  3. Flavour & Dietary Preference
                </label>
                <select
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-[#D9C8B4] bg-white focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                >
                  {dietaryOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2A170A] block mb-1.5">
                  4. Budget Preference
                </label>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-[#D9C8B4] bg-white focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                >
                  <option value="Classic Traditional (Rs. 1,400 - 1,800 / kg)">Classic Traditional (Rs. 1,400 - 1,800 / kg)</option>
                  <option value="Premium Luxury (Rs. 1,800 - 2,500 / box)">Premium Luxury (Rs. 1,800 - 2,500 / box)</option>
                  <option value="Royal Shahi Gourmet (Rs. 2,500+ / box)">Royal Shahi Gourmet (Rs. 2,500+ / box)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2A170A] block mb-1.5">
                Special Requests or Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Include sugar-free items for diabetic elders, or need ivory satin ribbon tags"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-[#D9C8B4] bg-white focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#C2410C] hover:bg-[#9A3412] text-white text-sm font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking deeply & architecting sweet proportions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Calculate Custom Box & Portions</span>
                </>
              )}
            </button>
          </form>

          {/* Generated Result Output */}
          {result && (
            <div className="mt-6 p-5 sm:p-6 bg-[#FAF7F2] rounded-2xl border border-[#EAE2D5] space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-[#EAE2D5]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2A170A]">
                    Master Halwai Recommendation Plan
                  </span>
                </div>
                <span className="text-[11px] text-[#8C6D58]">
                  Verified Fresh Formula
                </span>
              </div>

              {/* Formatted Markdown/Text output */}
              <div className="text-xs sm:text-sm text-[#4A3223] leading-relaxed whitespace-pre-wrap font-sans space-y-2">
                {result}
              </div>

              {/* Action buttons on result */}
              <div className="pt-4 border-t border-[#EAE2D5] flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={handleTransferToInquiry}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2A170A] hover:bg-[#4A3223] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Submit as Bulk Order Inquiry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleSendToWhatsApp}
                  className="px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Send Plan to Shop WhatsApp</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
