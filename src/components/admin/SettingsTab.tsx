import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, Save, CheckCircle2, AlertCircle, 
  Store, CreditCard, Truck, Phone, Globe, DollarSign 
} from 'lucide-react';
import { ShopSettings } from '../../types';
import { api } from '../../services/api';

interface SettingsTabProps {
  settings?: ShopSettings;
  onRefresh: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ settings, onRefresh }) => {
  const [form, setForm] = useState<Partial<ShopSettings>>({
    shop_name: settings?.shop_name || 'Mithas Sweets',
    tagline: settings?.tagline || settings?.shop_tagline || 'Fresh Traditional Sweets',
    phone: settings?.phone || settings?.shop_phone || '03027628552',
    whatsapp: settings?.whatsapp || settings?.shop_whatsapp || '923027628552',
    shop_email: settings?.shop_email || 'orders@mithassweets.com',
    timings: settings?.timings || settings?.shop_timings || 'Monday – Sunday: 9:00 AM – 11:30 PM',
    delivery_fee: settings?.delivery_fee ?? 250,
    free_delivery_threshold: settings?.free_delivery_threshold ?? 4000,
    minimum_order: settings?.minimum_order ?? 500,
    payment_cod_enabled: settings?.payment_cod_enabled ?? true,
    bank_name: settings?.bank_name || 'Meezan Bank Limited',
    bank_title: settings?.bank_title || settings?.bank_account_name || 'Mithas Sweets & Bakers',
    bank_account_no: settings?.bank_account_no || settings?.bank_account_number || '02010103456789',
    bank_iban: settings?.bank_iban || 'PK00MEZN0000001234567890',
    jazzcash_title: settings?.jazzcash_title || settings?.jazzcash_account_name || 'Mithas Sweets',
    jazzcash_number: settings?.jazzcash_number || '03027628552',
    easypaisa_title: settings?.easypaisa_title || settings?.easypaisa_account_name || 'Mithas Sweets',
    easypaisa_number: settings?.easypaisa_number || '03027628552',
    social_instagram: settings?.social_instagram || 'https://instagram.com/mithassweets',
    social_facebook: settings?.social_facebook || 'https://facebook.com/mithassweets',
    social_tiktok: settings?.social_tiktok || '',
    about_text: settings?.about_text || 'Welcome to our shop! We offer freshly prepared traditional sweets, barfi, laddus, and customized gift boxes prepared daily with the finest pure ingredients.',
    pickup_enabled: settings?.pickup_enabled ?? true
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await api.updateSettings({
        ...form,
        shop_tagline: form.tagline,
        shop_phone: form.phone,
        shop_whatsapp: form.whatsapp,
        shop_timings: form.timings,
        bank_account_name: form.bank_title,
        bank_account_number: form.bank_account_no,
        jazzcash_account_name: form.jazzcash_title,
        easypaisa_account_name: form.easypaisa_title,
      });

      setSuccess(true);
      onRefresh();
      setTimeout(() => setSuccess(false), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#EAE2D5] p-6 sm:p-8 space-y-6">
      <div>
        <h3 className="text-xl font-serif font-bold text-[#2A170A]">
          Shop Configuration & Payment Settings
        </h3>
        <p className="text-xs text-[#8C6D58] mt-1">
          Values are saved in the Supabase key-value settings table and sync across the entire storefront in realtime.
        </p>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>All operational settings successfully updated in Supabase!</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-800 rounded-xl text-xs flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Section 1: Storefront Identity */}
        <div className="space-y-3">
          <span className="font-bold uppercase tracking-wider text-[#C2410C] text-[11px] block">
            1. Store Identity & Contact
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">Shop Name *</label>
              <input
                type="text"
                required
                value={form.shop_name || ''}
                onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">Tagline</label>
              <input
                type="text"
                value={form.tagline || ''}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">Contact Phone</label>
              <input
                type="text"
                value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">WhatsApp Number (e.g. 923027628552)</label>
              <input
                type="text"
                value={form.whatsapp || ''}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">Shop Email</label>
              <input
                type="email"
                value={form.shop_email || ''}
                onChange={(e) => setForm({ ...form, shop_email: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">Store Timings</label>
              <input
                type="text"
                value={form.timings || ''}
                onChange={(e) => setForm({ ...form, timings: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Delivery & Ordering Rules */}
        <div className="space-y-3 pt-3 border-t border-[#EAE2D5]">
          <span className="font-bold uppercase tracking-wider text-[#C2410C] text-[11px] block">
            2. Delivery & Ordering Rules
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">Standard Delivery Fee (Rs)</label>
              <input
                type="number"
                min="0"
                value={form.delivery_fee}
                onChange={(e) => setForm({ ...form, delivery_fee: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">Free Delivery Threshold (Rs)</label>
              <input
                type="number"
                min="0"
                value={form.free_delivery_threshold}
                onChange={(e) => setForm({ ...form, free_delivery_threshold: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">Minimum Order Amount (Rs)</label>
              <input
                type="number"
                min="0"
                value={form.minimum_order}
                onChange={(e) => setForm({ ...form, minimum_order: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="flex gap-6 pt-1">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.payment_cod_enabled}
                onChange={(e) => setForm({ ...form, payment_cod_enabled: e.target.checked })}
                className="rounded text-[#C2410C] focus:ring-[#C2410C]"
              />
              <span className="font-semibold text-[#2A170A]">Cash on Delivery (COD) Enabled</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.pickup_enabled}
                onChange={(e) => setForm({ ...form, pickup_enabled: e.target.checked })}
                className="rounded text-[#C2410C] focus:ring-[#C2410C]"
              />
              <span className="font-semibold text-[#2A170A]">Store Pickup Option Enabled</span>
            </label>
          </div>
        </div>

        {/* Section 3: Bank & Mobile Wallets */}
        <div className="space-y-3 pt-3 border-t border-[#EAE2D5]">
          <span className="font-bold uppercase tracking-wider text-[#C2410C] text-[11px] block">
            3. Bank Accounts & Wallets
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">Bank Name</label>
              <input
                type="text"
                value={form.bank_name || ''}
                onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">Bank Account Title</label>
              <input
                type="text"
                value={form.bank_title || ''}
                onChange={(e) => setForm({ ...form, bank_title: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">Account Number</label>
              <input
                type="text"
                value={form.bank_account_no || ''}
                onChange={(e) => setForm({ ...form, bank_account_no: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">IBAN</label>
              <input
                type="text"
                value={form.bank_iban || ''}
                onChange={(e) => setForm({ ...form, bank_iban: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">JazzCash Account Title</label>
              <input
                type="text"
                value={form.jazzcash_title || ''}
                onChange={(e) => setForm({ ...form, jazzcash_title: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">JazzCash Mobile Number</label>
              <input
                type="text"
                value={form.jazzcash_number || ''}
                onChange={(e) => setForm({ ...form, jazzcash_number: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">EasyPaisa Account Title</label>
              <input
                type="text"
                value={form.easypaisa_title || ''}
                onChange={(e) => setForm({ ...form, easypaisa_title: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">EasyPaisa Mobile Number</label>
              <input
                type="text"
                value={form.easypaisa_number || ''}
                onChange={(e) => setForm({ ...form, easypaisa_number: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Socials & Editorial */}
        <div className="space-y-3 pt-3 border-t border-[#EAE2D5]">
          <span className="font-bold uppercase tracking-wider text-[#C2410C] text-[11px] block">
            4. Social Media Links & Editorial
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">Instagram URL</label>
              <input
                type="text"
                value={form.social_instagram || ''}
                onChange={(e) => setForm({ ...form, social_instagram: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">Facebook URL</label>
              <input
                type="text"
                value={form.social_facebook || ''}
                onChange={(e) => setForm({ ...form, social_facebook: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">TikTok URL</label>
              <input
                type="text"
                value={form.social_tiktok || ''}
                onChange={(e) => setForm({ ...form, social_tiktok: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-[#8C6D58] block mb-1">About Us Editorial Story</label>
            <textarea
              rows={4}
              value={form.about_text || ''}
              onChange={(e) => setForm({ ...form, about_text: e.target.value })}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl leading-relaxed"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-[#EAE2D5] flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#C2410C] hover:bg-[#9A3412] text-white font-semibold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving All Settings...' : 'Save All Settings to Supabase'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
