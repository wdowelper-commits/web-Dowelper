import React, { useState } from 'react';
import { X, Upload, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { Product } from '../../types';
import { api } from '../../services/api';

interface ProductFormModalProps {
  product: Partial<Product> | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: string[];
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  isOpen,
  onClose,
  onSaved,
  categories
}) => {
  if (!isOpen || !product) return null;

  const [formData, setFormData] = useState<Partial<Product>>({
    name: product.name || '',
    name_ur: product.name_ur || '',
    description: product.description || '',
    description_ur: product.description_ur || '',
    category: product.category || 'Mithai',
    sell_mode: product.sell_mode || 'kg',
    price_per_kg: product.price_per_kg || product.price_per_unit || 1600,
    price_per_piece: product.price_per_piece || 90,
    piece_weight_g: product.piece_weight_g || 50,
    stock_grams: product.stock_grams ?? 5000,
    low_stock_threshold_grams: product.low_stock_threshold_grams ?? 500,
    is_featured: product.is_featured ?? false,
    is_available: product.is_available ?? true,
    image: product.image || '',
    ingredients: product.ingredients || ''
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);
    try {
      const publicUrl = await api.uploadImage(file);
      setFormData(prev => ({ ...prev, image: publicUrl }));
    } catch (err: any) {
      setError(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setError('Product Name (English) is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: any = {
        name: formData.name.trim(),
        name_ur: formData.name_ur?.trim() || undefined,
        description: formData.description || '',
        description_ur: formData.description_ur || '',
        category: formData.category || 'Mithai',
        sell_mode: formData.sell_mode || 'kg',
        price_per_kg: (formData.sell_mode === 'kg' || formData.sell_mode === 'both') ? Number(formData.price_per_kg) : undefined,
        price_per_piece: (formData.sell_mode === 'piece' || formData.sell_mode === 'both') ? Number(formData.price_per_piece) : undefined,
        piece_weight_g: (formData.sell_mode === 'piece' || formData.sell_mode === 'both') ? Number(formData.piece_weight_g) : undefined,
        price_per_unit: Number(formData.price_per_kg || formData.price_per_piece || 1500),
        unit: formData.sell_mode === 'piece' ? 'piece' : 'kg',
        stock_grams: Number(formData.stock_grams ?? 0),
        low_stock_threshold_grams: Number(formData.low_stock_threshold_grams ?? 500),
        is_featured: Boolean(formData.is_featured),
        is_available: Boolean(formData.is_available && (Number(formData.stock_grams) > 0)),
        in_stock: Number(formData.stock_grams ?? 0) > 0,
        image: formData.image || '',
        ingredients: formData.ingredients || ''
      };

      if (product.id) {
        await api.updateProduct(product.id, payload);
      } else {
        await api.createProduct(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save sweet item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 max-h-[92vh] overflow-y-auto border border-[#D9C8B4] shadow-2xl relative">
        <div className="flex justify-between items-center pb-3 border-b border-[#EAE2D5]">
          <h3 className="text-lg font-serif font-bold text-[#2A170A]">
            {product.id ? 'Edit Sweet in Catalog' : 'Add New Sweet to Catalog'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">Name (English) *</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Pistachio Khoya Barfi"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl focus:outline-none focus:border-[#C2410C]"
              />
            </div>
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">Name (Urdu / اردو)</label>
              <input
                type="text"
                value={formData.name_ur || ''}
                onChange={(e) => setFormData({ ...formData, name_ur: e.target.value })}
                placeholder="e.g. پستہ کھویا برفی"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl focus:outline-none focus:border-[#C2410C]"
              />
            </div>
          </div>

          {/* Category & Sell Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl font-medium"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">Sell Mode</label>
              <div className="flex gap-4 pt-1">
                {(['kg', 'piece', 'both'] as const).map((mode) => (
                  <label key={mode} className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="sell_mode"
                      value={mode}
                      checked={formData.sell_mode === mode}
                      onChange={() => setFormData({ ...formData, sell_mode: mode })}
                      className="text-[#C2410C] focus:ring-[#C2410C]"
                    />
                    <span className="capitalize">{mode}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing depending on sell_mode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#FAF7F2] p-3 rounded-2xl border border-[#EAE2D5]">
            {(formData.sell_mode === 'kg' || formData.sell_mode === 'both') && (
              <div>
                <label className="font-semibold text-[#8C6D58] block mb-1">Price per Kg (Rs)</label>
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={formData.price_per_kg || 1600}
                  onChange={(e) => setFormData({ ...formData, price_per_kg: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-[#D9C8B4] rounded-xl font-mono"
                />
              </div>
            )}

            {(formData.sell_mode === 'piece' || formData.sell_mode === 'both') && (
              <>
                <div>
                  <label className="font-semibold text-[#8C6D58] block mb-1">Price per Piece (Rs)</label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    value={formData.price_per_piece || 90}
                    onChange={(e) => setFormData({ ...formData, price_per_piece: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-[#D9C8B4] rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#8C6D58] block mb-1">Weight per Piece (g)</label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={formData.piece_weight_g || 50}
                    onChange={(e) => setFormData({ ...formData, piece_weight_g: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-[#D9C8B4] rounded-xl font-mono"
                  />
                </div>
              </>
            )}
          </div>

          {/* Stock in Grams & Threshold */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">Stock in Grams (Required) *</label>
              <input
                type="number"
                required
                min="0"
                step="100"
                value={formData.stock_grams}
                onChange={(e) => setFormData({ ...formData, stock_grams: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl font-mono"
              />
              <span className="text-[10px] text-[#8C6D58] mt-0.5 block">
                = {(Number(formData.stock_grams || 0) / 1000).toFixed(2)} Kg total stock
              </span>
            </div>

            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">Low Stock Threshold (Grams)</label>
              <input
                type="number"
                min="100"
                step="100"
                value={formData.low_stock_threshold_grams}
                onChange={(e) => setFormData({ ...formData, low_stock_threshold_grams: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl font-mono"
              />
              <span className="text-[10px] text-[#8C6D58] mt-0.5 block">
                Triggers warning when stock drops below this weight
              </span>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-6 py-1">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_available}
                onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                className="rounded text-[#C2410C] focus:ring-[#C2410C]"
              />
              <span className="font-semibold text-[#2A170A]">Available for Ordering</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="rounded text-[#C2410C] focus:ring-[#C2410C]"
              />
              <span className="font-semibold text-[#2A170A]">Feature as Signature Classic</span>
            </label>
          </div>

          {/* Image Upload to Supabase Storage */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#8C6D58] block">Product Image</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.image || ''}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://... or upload a photo"
                className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl font-mono text-[11px]"
              />
              <label className="px-4 py-2 bg-[#2A170A] hover:bg-[#C2410C] text-white font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs">
                {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileChange}
                />
              </label>
            </div>

            {formData.image && (
              <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-[#D9C8B4] bg-[#FFF8EE] mt-2">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Descriptions */}
          <div className="space-y-2">
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">Description (English)</label>
              <textarea
                rows={2}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Taste profile, khoya quality, pure ghee notes..."
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-[#8C6D58] block mb-1">Description (Urdu / اردو)</label>
              <textarea
                rows={2}
                value={formData.description_ur || ''}
                onChange={(e) => setFormData({ ...formData, description_ur: e.target.value })}
                placeholder="خالص کھویا، دیسی گھی..."
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl"
              />
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-[#EAE2D5]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#D9C8B4] text-[#5A4132] font-semibold rounded-xl hover:bg-[#FAF7F2] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[#C2410C] hover:bg-[#9A3412] text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{product.id ? 'Save Changes' : 'Create Sweet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
