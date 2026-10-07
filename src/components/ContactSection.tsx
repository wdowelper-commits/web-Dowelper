import React, { useState } from 'react';
import { MapPin, Phone, MessageCircle, Clock, Mail, Send, CheckCircle2, Loader2, Truck } from 'lucide-react';
import { api } from '../services/api';
import { ShopSettings } from '../types';

interface ContactSectionProps {
  settings?: ShopSettings;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ settings }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const shopName = settings?.shop_name || 'Mithas Sweets';
  const shopPhone = settings?.phone || '03027628552';
  const shopWhatsapp = settings?.whatsapp || '923027628552';
  const shopTimings = settings?.timings || 'Monday – Sunday: 9:00 AM – 11:30 PM';
  const deliveryAreas = settings?.delivery_areas || 'Available across delivery areas';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.submitContact({
        name,
        phone,
        email: email || undefined,
        subject,
        message
      });
      setSuccessMsg(res.message);
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send message. Please reach out via WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWhatsApp = () => {
    const cleanWa = shopWhatsapp.replace(/[^0-9]/g, '') || '923027628552';
    const text = encodeURIComponent(`Hello ${shopName}! I have an inquiry regarding your sweets.`);
    window.location.href = `https://wa.me/${cleanWa}?text=${text}`;
  };

  return (
    <div className="py-12 md:py-20 bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#C2410C]">
            Direct Contact
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2A170A]">
            Get in Touch with {shopName}
          </h2>
          <p className="text-xs sm:text-sm text-[#5A4132]">
            Contact our team directly by phone or WhatsApp for instant order booking and event inquiries.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Details & Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8DFC9] shadow-xs space-y-6">
              <h3 className="text-xl font-serif font-bold text-[#2A170A]">
                Customer Contact Details
              </h3>

              <div className="space-y-4 text-xs sm:text-sm text-[#5A4132]">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#FAF7F2] text-[#C2410C] shrink-0 border border-[#EAE2D5]">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-[#2A170A] font-semibold">Phone:</strong>
                    <a href={`tel:${shopPhone}`} className="hover:text-[#C2410C] font-mono transition-colors text-sm font-bold text-[#2A170A]">
                      {shopPhone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#FAF7F2] text-[#C2410C] shrink-0 border border-[#EAE2D5]">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-[#2A170A] font-semibold">WhatsApp:</strong>
                    <span className="font-mono text-sm font-bold text-[#2A170A]">{shopWhatsapp}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#FAF7F2] text-[#C2410C] shrink-0 border border-[#EAE2D5]">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-[#2A170A] font-semibold">Operating Timings:</strong>
                    <span>{shopTimings}</span>
                  </div>
                </div>

                {deliveryAreas && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-[#FAF7F2] text-[#C2410C] shrink-0 border border-[#EAE2D5]">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="block text-[#2A170A] font-semibold">Delivery Coverage:</strong>
                      <span>{deliveryAreas}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* WhatsApp direct button */}
              <div className="pt-2">
                <button
                  onClick={handleOpenWhatsApp}
                  className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat with Us on WhatsApp ({shopWhatsapp})</span>
                </button>
              </div>
            </div>

            {/* Store Pickup Notice (no physical address) */}
            <div className="bg-[#FAF7F2] rounded-3xl p-6 border border-[#EAE2D5] space-y-2">
              <span className="text-xs font-bold text-[#C2410C] uppercase tracking-wider block">
                Store Pickup Notice
              </span>
              <p className="text-xs text-[#5A4132] leading-relaxed">
                Pickup details will be shared on WhatsApp after you place the order.
              </p>
            </div>
          </div>

          {/* Contact Message Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border border-[#D9C8B4] shadow-sm space-y-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#2A170A]">
                Send an Online Message
              </h3>
              <p className="text-xs text-[#6B5544] mt-1">
                Have a question about bulk orders, pricing, or custom boxes? Submit your message below.
              </p>
            </div>

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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#2A170A] block mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D9C8B4] bg-white focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2A170A] block mb-1">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter your contact number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D9C8B4] bg-white focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#2A170A] block mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D9C8B4] bg-white focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2A170A] block mb-1">
                    Subject *
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D9C8B4] bg-white focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Sweet Box Order">Sweet Box Order</option>
                    <option value="Event Catering">Event Catering</option>
                    <option value="Customer Feedback">Customer Feedback</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#2A170A] block mb-1">
                  Your Message *
                </label>
                <textarea
                  rows={4}
                  placeholder="How can we assist you with your sweet order?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D9C8B4] bg-white focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                  required
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
                    <span>Sending Message...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
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
