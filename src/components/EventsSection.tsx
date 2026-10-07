import React, { useState } from 'react';
import { Sparkles, Gift, CheckCircle2, MessageCircle, Send, Loader2, Calendar, Users, Award } from 'lucide-react';
import { api } from '../services/api';

interface EventsSectionProps {
  initialData?: {
    occasion: string;
    boxes: number;
    notes: string;
  } | null;
  whatsappNumber?: string;
}

export const EventsSection: React.FC<EventsSectionProps> = ({
  initialData,
  whatsappNumber = '923027628552'
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [eventType, setEventType] = useState(initialData?.occasion || 'Wedding / Baraat / Walima');
  const [eventDate, setEventDate] = useState('');
  const [boxes, setBoxes] = useState<number>(initialData?.boxes || 50);
  const [budgetRange, setBudgetRange] = useState('Rs. 1,500 - 2,200 per Box');
  const [customNotes, setCustomNotes] = useState(initialData?.notes || '');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync if AI concierge sent data
  React.useEffect(() => {
    if (initialData) {
      if (initialData.occasion) setEventType(initialData.occasion);
      if (initialData.boxes) setBoxes(initialData.boxes);
      if (initialData.notes) setCustomNotes(initialData.notes);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.submitInquiry({
        name,
        phone,
        email: email || undefined,
        event_type: eventType,
        event_date: eventDate,
        estimated_boxes: boxes,
        budget_range: budgetRange,
        custom_requirements: customNotes || undefined,
      });

      setSuccessMsg(res.message);
      setName('');
      setPhone('');
      setEmail('');
      setCustomNotes('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppConsultation = () => {
    const cleanWa = whatsappNumber.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      `*Mithas Sweets Bulk / Event Inquiry*\n\n` +
      `Hello! I would like to consult with your event catering manager regarding sweet boxes for an upcoming event.\n` +
      `*Type:* ${eventType}\n` +
      `*Boxes / Quantity:* ~${boxes} boxes\n` +
      `*Date:* ${eventDate || 'Upcoming'}\n` +
      `Please share your bulk catalog and custom packaging options.`
    );
    window.location.href = `https://wa.me/${cleanWa}?text=${msg}`;
  };

  return (
    <div className="py-12 md:py-20 bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F5EBE1] border border-[#E6D7C7] rounded-full text-xs font-semibold text-[#8C4A1A]">
            <Gift className="w-3.5 h-3.5 text-[#C2410C]" />
            <span>Royal Festivities & Corporate Delegations</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#2A170A] tracking-tight text-balance">
            Bespoke Mithai Gifting for Weddings, Eid & Corporate Celebrations.
          </h2>

          <p className="text-sm sm:text-base text-[#5A4132] leading-relaxed">
            Elevate your auspicious moments with our handcrafted sweet boxes. Custom ribbons, elegant boxes, personalized messages, and fresh traditional sweets.
          </p>
        </div>

        {/* 3 Signature Packaging Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Wedding & Baraat */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8DFC9] shadow-sm hover:shadow-md transition-shadow space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-48 rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#D9C8B4]">
                <img
                  src="/src/assets/images/mithas_luxury_box_1791385642526.jpg"
                  alt="Wedding sweet box packaging"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider text-[#C2410C] font-bold">
                  Baraat & Walima Bid
                </span>
                <h3 className="text-xl font-serif font-bold text-[#2A170A] mt-1">
                  The Royal Shahi Wedding Box
                </h3>
              </div>

              <p className="text-xs text-[#6B5544] leading-relaxed">
                Opulent velvet-textured hardboard box with gold foil family monogram. Filled with Kaju Katli, Pistachio Barfi, and Motichoor Laddus.
              </p>

              <ul className="text-xs text-[#5A4132] space-y-1.5 pt-2 border-t border-[#F2ECE1]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C2410C]" />
                  <span>Custom Bride & Groom Ribbon Foil</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C2410C]" />
                  <span>Portions: 0.5 kg, 1 kg, or 2 kg tiers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C2410C]" />
                  <span>Complimentary Venue Delivery</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-[#F2ECE1] flex items-center justify-between">
              <span className="text-xs font-bold text-[#2A170A]">From Rs. 1,650 / box</span>
              <button
                onClick={() => {
                  setEventType('Wedding / Baraat / Walima');
                  document.getElementById('inquiry-form')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-xs font-semibold text-[#C2410C] hover:underline cursor-pointer"
              >
                Inquire Package →
              </button>
            </div>
          </div>

          {/* Card 2: Eid Mubarak Hampers */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#C2410C] shadow-md space-y-5 flex flex-col justify-between relative">
            <div className="absolute -top-3 right-6 px-3 py-1 bg-[#C2410C] text-white text-[11px] font-bold rounded-full uppercase tracking-wider">
              Most Popular
            </div>

            <div className="space-y-4">
              <div className="h-48 rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#D9C8B4]">
                <img
                  src="/src/assets/images/mithas_barfi_assortment_1791385657557.jpg"
                  alt="Eid festive sweet hamper"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider text-[#C2410C] font-bold">
                  Festive Celebrations
                </span>
                <h3 className="text-xl font-serif font-bold text-[#2A170A] mt-1">
                  Eid Mubarak Heritage Hamper
                </h3>
              </div>

              <p className="text-xs text-[#6B5544] leading-relaxed">
                Handcrafted hexagonal hamper with saffron habshi halwa, pure desi ghee sohan halwa, roasted dry fruits, and anjeer rolls.
              </p>

              <ul className="text-xs text-[#5A4132] space-y-1.5 pt-2 border-t border-[#F2ECE1]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C2410C]" />
                  <span>Calligraphed "Eid Mubarak" Wooden Plaque</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C2410C]" />
                  <span>Fresh floral jasmines & roses garnish</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C2410C]" />
                  <span>Shelf life: 10+ days (air-tight sealed)</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-[#F2ECE1] flex items-center justify-between">
              <span className="text-xs font-bold text-[#2A170A]">From Rs. 2,400 / hamper</span>
              <button
                onClick={() => {
                  setEventType('Eid Mubarak Celebrations');
                  document.getElementById('inquiry-form')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-xs font-semibold text-[#C2410C] hover:underline cursor-pointer"
              >
                Inquire Package →
              </button>
            </div>
          </div>

          {/* Card 3: Corporate Executive */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8DFC9] shadow-sm hover:shadow-md transition-shadow space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-48 rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#D9C8B4]">
                <img
                  src="/src/assets/images/mithas_halwa_laddu_1791385679890.jpg"
                  alt="Corporate gifting sweets"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider text-[#C2410C] font-bold">
                  B2B & VIP Corporate
                </span>
                <h3 className="text-xl font-serif font-bold text-[#2A170A] mt-1">
                  Executive Corporate Tofa
                </h3>
              </div>

              <p className="text-xs text-[#6B5544] leading-relaxed">
                Refined matte-emerald gift boxes branded with your corporate logo. Curated with premium cashews, pistachios, and silver-vark barfi.
              </p>

              <ul className="text-xs text-[#5A4132] space-y-1.5 pt-2 border-t border-[#F2ECE1]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C2410C]" />
                  <span>Company Logo Embossing on Top Lid</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C2410C]" />
                  <span>GST Invoicing & Bulk Volume Discounts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C2410C]" />
                  <span>Multi-city corporate courier dispatch</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-[#F2ECE1] flex items-center justify-between">
              <span className="text-xs font-bold text-[#2A170A]">Custom Bulk Quotes</span>
              <button
                onClick={() => {
                  setEventType('Corporate Executive Gifting');
                  document.getElementById('inquiry-form')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-xs font-semibold text-[#C2410C] hover:underline cursor-pointer"
              >
                Inquire Package →
              </button>
            </div>
          </div>
        </div>

        {/* Inquiry Form Section */}
        <div id="inquiry-form" className="bg-white rounded-3xl border border-[#D9C8B4] p-6 sm:p-10 shadow-lg grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs uppercase tracking-widest text-[#C2410C] font-bold">
              Direct Event Specialist
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#2A170A]">
              Request a Bespoke Bulk Order Proposal
            </h3>
            <p className="text-xs sm:text-sm text-[#5A4132] leading-relaxed">
              Tell us your date, expected guest count, and preferences. Our event coordinator will send you custom packaging mockups, sweet tasting boxes, and discounted bulk price tiers within 4 hours.
            </p>

            <div className="pt-4 border-t border-[#EAE2D5] space-y-3 text-xs text-[#5A4132]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Complimentary Sample Tasting Box for orders over 50 boxes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>100% On-Time Delivery Guarantee for Wedding Receptions</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleWhatsAppConsultation}
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Direct WhatsApp Consultation ({whatsappNumber})</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="space-y-4 bg-[#FAF7F2] p-6 sm:p-8 rounded-2xl border border-[#EAE2D5]">
              {successMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#2A170A] block mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tariq Mehmood"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D9C8B4] bg-white focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2A170A] block mb-1">
                    WhatsApp / Phone Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="0300 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D9C8B4] bg-white focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2A170A] block mb-1">
                    Occasion / Event *
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D9C8B4] bg-white focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                  >
                    <option value="Wedding / Baraat / Walima">Wedding / Baraat / Walima</option>
                    <option value="Eid Mubarak Celebrations">Eid Mubarak Celebrations</option>
                    <option value="Corporate Executive Gifting">Corporate Executive Gifting</option>
                    <option value="Engagement / Ring Ceremony">Engagement / Ring Ceremony</option>
                    <option value="Baby Announcement / Birth Tofa">Baby Announcement / Birth Tofa</option>
                    <option value="Other Celebrations">Other Celebrations</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2A170A] block mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D9C8B4] bg-white focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2A170A] block mb-1">
                    Estimated Boxes / Kg *
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    value={boxes}
                    onChange={(e) => setBoxes(Number(e.target.value))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D9C8B4] bg-white focus:outline-none focus:ring-2 focus:ring-[#C2410C] tabular-nums"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2A170A] block mb-1">
                    Target Budget Range
                  </label>
                  <select
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D9C8B4] bg-white focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                  >
                    <option value="Rs. 1,200 - 1,800 per Box">Rs. 1,200 - 1,800 per Box</option>
                    <option value="Rs. 1,800 - 2,500 per Box">Rs. 1,800 - 2,500 per Box</option>
                    <option value="Rs. 2,500+ Luxury Royal Tier">Rs. 2,500+ Luxury Royal Tier</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#2A170A] block mb-1">
                  Custom Requirements & Message (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell us about sweet selections, box colors, family monograms, delivery addresses..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D9C8B4] bg-white focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Inquiry...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Bulk Order Inquiry</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
