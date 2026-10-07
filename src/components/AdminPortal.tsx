import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Lock, ShieldCheck, Plus, Edit, Trash2, CheckCircle2, Clock, 
  Truck, AlertCircle, RefreshCw, DollarSign, Package, Users, Settings, 
  MessageSquare, Upload, Image as ImageIcon, Loader2, Database, Mail,
  Star, Copy, Check, ExternalLink, Sparkles, FileText
} from 'lucide-react';
import { Product, Order, EventInquiry, ContactMessage, ShopSettings, Review } from '../types';
import { api } from '../services/api';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onRefreshProducts: () => void;
  settings?: ShopSettings;
  onRefreshSettings: () => void;
}

const SUPABASE_SCHEMA_SQL = `-- ====================================================================
-- MITHAS SWEETS - SUPABASE SCHEMA SETUP SCRIPT
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ====================================================================

-- 1. Products Table (Mithai Catalog)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_per_unit NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  description TEXT,
  image TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  in_stock BOOLEAN DEFAULT TRUE,
  ingredients TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Orders Table (Customer Orders)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  delivery_type TEXT NOT NULL,
  delivery_address TEXT,
  delivery_city TEXT,
  pickup_time TEXT,
  special_notes TEXT,
  items JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  delivery_fee NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT DEFAULT 'New' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Event Inquiries Table (Bulk Gifting & Orders)
CREATE TABLE IF NOT EXISTS public.event_inquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  event_type TEXT NOT NULL,
  event_date TEXT NOT NULL,
  estimated_boxes INTEGER NOT NULL,
  budget_range TEXT,
  custom_requirements TEXT,
  status TEXT DEFAULT 'New' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Contact Messages Table (Customer Queries)
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'Unread' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Customer Reviews Table (Only real reviews submitted through site)
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  city TEXT,
  rating INTEGER DEFAULT 5 NOT NULL,
  comment TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Settings Table (Shop Configuration & Accounts)
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public read access to settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Allow public read access to approved reviews" ON public.reviews FOR SELECT USING (is_approved = true);

-- 8. Sweets Images Storage Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('sweets-images', 'sweets-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access for sweets-images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'sweets-images');`;

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  products,
  onRefreshProducts,
  settings,
  onRefreshSettings
}) => {
  if (!isOpen) return null;

  const [token, setToken] = useState<string | null>(localStorage.getItem('mithas_admin_token'));
  const [adminEmail, setAdminEmail] = useState<string>(localStorage.getItem('mithas_admin_email') || '');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<{ supabaseConfigured: boolean; defaultEmail: string } | null>(null);

  // Active admin tab
  const [activeAdminTab, setActiveAdminTab] = useState<'orders' | 'products' | 'inquiries' | 'messages' | 'reviews' | 'settings' | 'database'>('orders');

  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [inquiries, setInquiries] = useState<EventInquiry[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Product Add / Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Barfi',
    price_per_unit: 1800,
    unit: 'kg',
    description: '',
    image: '/src/assets/images/mithas_barfi_assortment_1791385657557.jpg',
    is_featured: false,
    in_stock: true,
    ingredients: ''
  });

  // Bulk Product Import Modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkInputText, setBulkInputText] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<Partial<ShopSettings>>({});
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

  // Quick settings template paste modal
  const [isQuickSettingsModalOpen, setIsQuickSettingsModalOpen] = useState(false);
  const [quickTemplateText, setQuickTemplateText] = useState('');

  // Supabase test state
  const [testResult, setTestResult] = useState<any>(null);
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Check Supabase connection status
  useEffect(() => {
    api.getAdminStatus().then(status => {
      setSupabaseStatus(status);
      if (!emailInput && status.defaultEmail) {
        setEmailInput(status.defaultEmail);
      }
    }).catch(console.error);
  }, []);

  // Load orders / inquiries / reviews if token exists
  const loadAdminData = async () => {
    if (!token) return;
    setLoadingData(true);
    try {
      const [ordList, inqList, msgList, revList] = await Promise.all([
        api.getAdminOrders(token),
        api.getAdminInquiries(token),
        api.getAdminMessages(token),
        api.getAdminReviews(token)
      ]);
      setOrders(ordList);
      setInquiries(inqList);
      setMessages(msgList);
      setReviews(revList);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('401') || err.message?.includes('session') || err.message?.includes('credentials')) {
        setToken(null);
        localStorage.removeItem('mithas_admin_token');
        localStorage.removeItem('mithas_admin_email');
      }
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadAdminData();
    }
  }, [token]);

  useEffect(() => {
    if (settings) {
      setSettingsForm(settings);
    }
  }, [settings]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const authResult = await api.adminLogin(emailInput.trim(), passwordInput.trim());
      setToken(authResult.token);
      const userEmail = authResult.user?.email || emailInput.trim();
      setAdminEmail(userEmail);
      localStorage.setItem('mithas_admin_token', authResult.token);
      localStorage.setItem('mithas_admin_email', userEmail);
      setPasswordInput('');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setAdminEmail('');
    localStorage.removeItem('mithas_admin_token');
    localStorage.removeItem('mithas_admin_email');
  };

  // Image Upload handler
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploadingImage(true);
    setUploadSuccess(false);
    try {
      const publicUrl = await api.uploadImage(token, file);
      setProductForm(prev => ({ ...prev, image: publicUrl }));
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      alert(`Image upload error: ${err.message}. You can also paste an image URL.`);
    } finally {
      setUploadingImage(false);
    }
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      if (editingProduct) {
        await api.updateProduct(token, editingProduct.id, productForm);
      } else {
        await api.createProduct(token, productForm);
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      onRefreshProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to save product');
    }
  };

  // Open Edit Product
  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      category: p.category,
      price_per_unit: p.price_per_unit,
      unit: p.unit,
      description: p.description,
      image: p.image,
      is_featured: p.is_featured,
      in_stock: p.in_stock,
      ingredients: p.ingredients || ''
    });
    setIsProductModalOpen(true);
  };

  // Open Add Product
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: 'Barfi',
      price_per_unit: 1800,
      unit: 'kg',
      description: '',
      image: '/src/assets/images/mithas_barfi_assortment_1791385657557.jpg',
      is_featured: false,
      in_stock: true,
      ingredients: ''
    });
    setIsProductModalOpen(true);
  };

  // Toggle in_stock
  const handleToggleStock = async (p: Product) => {
    if (!token) return;
    try {
      await api.updateProduct(token, p.id, { in_stock: !p.in_stock });
      onRefreshProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to update stock');
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to remove this sweet from catalog?')) return;
    try {
      await api.deleteProduct(token, id);
      onRefreshProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  // Clear all products
  const handleClearAllProducts = async () => {
    if (!token) return;
    if (!confirm('CAUTION: This will delete ALL sweets from the catalog so you can enter your own real sweets. Are you sure?')) return;
    try {
      await api.clearAllProducts(token);
      onRefreshProducts();
      alert('All products removed. You can now add your sweets or use "Bulk Import Sweets".');
    } catch (err: any) {
      alert(err.message || 'Failed to clear products');
    }
  };

  // Bulk Import Sweets
  const handleBulkImport = async () => {
    if (!token || !bulkInputText.trim()) return;
    setBulkLoading(true);
    setBulkMessage(null);

    try {
      // Parse line by line
      // Supported format:
      // Name | Category | Price | Unit | Description
      // OR Name, Category, Price
      // OR line with just Name (defaults applied)
      const lines = bulkInputText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const parsedItems: any[] = [];

      for (const line of lines) {
        if (line.startsWith('#') || line.startsWith('//')) continue;
        
        let parts = line.includes('|') ? line.split('|') : line.split(',');
        parts = parts.map(p => p.trim());

        if (parts.length >= 1 && parts[0]) {
          const name = parts[0];
          const category = parts[1] || 'Mithai';
          const price = parseFloat(parts[2]) || 1500;
          const unit = parts[3] || 'kg';
          const description = parts[4] || `${name} freshly made with pure ingredients.`;

          parsedItems.push({
            name,
            category,
            price_per_unit: price,
            unit,
            description,
            image: '/src/assets/images/mithas_barfi_assortment_1791385657557.jpg',
            is_featured: false,
            in_stock: true,
            ingredients: ''
          });
        }
      }

      if (parsedItems.length === 0) {
        throw new Error('No valid sweets found. Please paste in format: Name | Category | Price | Unit | Description');
      }

      const res = await api.bulkImportProducts(token, parsedItems);
      setBulkMessage(`Successfully imported ${res.count} sweets into catalog!`);
      setBulkInputText('');
      onRefreshProducts();
      setTimeout(() => {
        setIsBulkModalOpen(false);
        setBulkMessage(null);
      }, 2000);
    } catch (err: any) {
      setBulkMessage(`Error: ${err.message}`);
    } finally {
      setBulkLoading(false);
    }
  };

  // Order status update
  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    if (!token) return;
    try {
      await api.updateOrderStatus(token, orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  // Inquiry status update
  const handleUpdateInquiryStatus = async (inqId: string, newStatus: EventInquiry['status']) => {
    if (!token) return;
    try {
      await api.updateInquiryStatus(token, inqId, newStatus);
      setInquiries(prev => prev.map(i => i.id === inqId ? { ...i, status: newStatus } : i));
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Review approval and deletion
  const handleToggleReviewApproval = async (id: string, current: boolean) => {
    if (!token) return;
    try {
      await api.updateReviewApproval(token, id, !current);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, is_approved: !current } : r));
    } catch (err: any) {
      alert(err.message || 'Failed to update review status');
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this customer review?')) return;
    try {
      await api.deleteReview(token, id);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete review');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await api.updateSettings(token, settingsForm);
      onRefreshSettings();
      setSettingsSavedMsg(true);
      setTimeout(() => setSettingsSavedMsg(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    }
  };

  // Parse quick template text from user
  const handleParseQuickTemplate = () => {
    if (!quickTemplateText.trim()) return;

    const lines = quickTemplateText.split('\n');
    const updated: Partial<ShopSettings> = { ...settingsForm };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      const lower = line.toLowerCase();

      if (lower.includes('shop name:')) {
        const val = line.split(/shop name:\s*/i)[1]?.trim();
        if (val && !val.includes('[') && val !== '..') updated.shop_name = val;
      } else if (lower.includes('tagline:')) {
        const val = line.split(/tagline:\s*/i)[1]?.trim();
        if (val && !val.includes('[') && val !== '..') updated.tagline = val;
      } else if (lower.includes('address:') && lower.includes('city:')) {
        const addrPart = line.match(/address:\s*([^,]+)/i)?.[1]?.trim();
        const cityPart = line.match(/city:\s*(.+)/i)?.[1]?.trim();
        if (addrPart && !addrPart.includes('[') && addrPart !== '..') updated.address = addrPart;
        if (cityPart && !cityPart.includes('[') && cityPart !== '..') updated.city = cityPart;
      } else if (lower.includes('phone:') || lower.includes('whatsapp:')) {
        const phoneMatch = line.match(/phone:\s*([^,\n]+)/i)?.[1]?.trim();
        const waMatch = line.match(/whatsapp:\s*([^,\n]+)/i)?.[1]?.trim();
        if (phoneMatch && !phoneMatch.includes('[') && phoneMatch !== '..') updated.phone = phoneMatch;
        if (waMatch && !waMatch.includes('[') && waMatch !== '..') updated.whatsapp = waMatch;
      } else if (lower.includes('timings:')) {
        const val = line.split(/timings:\s*/i)[1]?.trim();
        if (val && !val.includes('[') && val !== '..') updated.timings = val;
      } else if (lower.includes('delivery areas:')) {
        const areas = line.match(/delivery areas:\s*([^,]+)/i)?.[1]?.trim();
        const fee = line.match(/delivery fee:\s*([0-9]+)/i)?.[1]?.trim();
        const freeAbove = line.match(/free delivery above:\s*([0-9]+)/i)?.[1]?.trim();
        if (areas && !areas.includes('[') && areas !== '..') updated.delivery_areas = areas;
        if (fee) updated.delivery_fee = Number(fee);
        if (freeAbove) updated.free_delivery_threshold = Number(freeAbove);
      } else if (lower.includes('payment methods') || lower.includes('account details:')) {
        const val = line.split(/account details:\s*|payment methods:\s*/i)[1]?.trim();
        if (val && !val.includes('[') && val !== '..') {
          if (val.toLowerCase().includes('bank')) updated.bank_name = val;
        }
      } else if (lower.includes('social links:')) {
        const val = line.split(/social links:\s*/i)[1]?.trim();
        if (val && !val.includes('[') && val !== '..') {
          if (val.includes('instagram.com')) updated.social_instagram = val;
          if (val.includes('facebook.com')) updated.social_facebook = val;
        }
      } else if (lower.includes('about us text') || lower.includes('about us:')) {
        const val = line.split(/about us (text \(use exactly this\)|text|us):\s*/i)[1]?.trim();
        if (val && !val.includes('[') && val !== '..') updated.about_text = val;
      }
    }

    setSettingsForm(updated);
    setIsQuickSettingsModalOpen(false);
    alert('Settings form populated from your template! Click "Save Shop Settings" below to commit.');
  };

  // Test Supabase Connection
  const handleTestSupabase = async () => {
    setTestingSupabase(true);
    setTestResult(null);
    try {
      const res = await api.testSupabase();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ connected: false, error: err.message });
    } finally {
      setTestingSupabase(false);
    }
  };

  // Copy SQL script
  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Compute live overview metrics
  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'New' || o.status === 'Preparing').length;
  const newInquiries = inquiries.filter(i => i.status === 'New').length;
  const unapprovedReviews = reviews.filter(r => !r.is_approved).length;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-5xl w-full h-[92vh] shadow-2xl border border-[#D9C8B4] flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#EAE2D5] bg-[#2A170A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-serif font-bold text-amber-50">
                  {settingsForm.shop_name || 'Mithas Sweets'} · Admin Portal
                </h2>
                {supabaseStatus?.supabaseConfigured ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-semibold flex items-center gap-1">
                    <Database className="w-2.5 h-2.5" />
                    Supabase Connected
                  </span>
                ) : (
                  <button 
                    onClick={() => setActiveAdminTab('database')}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700/60 font-semibold cursor-pointer transition-colors"
                  >
                    Connect Supabase ⚡
                  </button>
                )}
              </div>
              <span className="text-[11px] text-amber-200/70">
                {adminEmail ? `Logged in: ${adminEmail}` : 'Secure Management Console'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {token && (
              <button
                onClick={handleLogout}
                className="text-xs px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                Log Out
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Not Logged In Gate (Email & Password Supabase Auth) */}
        {!token ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-[#FAF7F2]">
            <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-[#D9C8B4] shadow-lg space-y-6 text-center">
              <div className="w-14 h-14 rounded-full bg-[#FEF3C7] text-[#D97706] mx-auto flex items-center justify-center">
                <Lock className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-xl font-serif font-bold text-[#2A170A]">
                  Admin Portal Login
                </h3>
                <p className="text-xs text-[#6B5544] mt-1">
                  Authenticate using your admin email and password to manage sweets, update kitchen orders, and view inquiries.
                </p>
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div>
                  <label className="text-xs font-bold text-[#2A170A] block mb-1">
                    Admin Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      placeholder="admin@mithassweets.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-[#D9C8B4] focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2A170A] block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      placeholder="Enter password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-[#D9C8B4] focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                      required
                    />
                  </div>
                </div>

                <div className="p-3 bg-[#FAF7F2] rounded-xl text-[11px] text-[#8C6D58] space-y-1 border border-[#EAE2D5]">
                  <p><strong>Initial Demo Credentials:</strong></p>
                  <p>Email: <code className="font-mono text-[#2A170A]">{supabaseStatus?.defaultEmail || 'admin@mithassweets.com'}</code></p>
                  <p>Password: <code className="font-mono text-[#2A170A]">mithas2026</code></p>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loginLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <span>Sign In to Admin Portal</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Logged In Dashboard */
          <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F2]">
            {/* Nav Tabs */}
            <div className="bg-white px-4 sm:px-6 border-b border-[#EAE2D5] flex items-center justify-between overflow-x-auto no-scrollbar gap-2 py-2">
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setActiveAdminTab('orders')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeAdminTab === 'orders'
                      ? 'bg-[#2A170A] text-white shadow-xs'
                      : 'text-[#6B5544] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Orders ({orders.length})</span>
                  {pendingOrders > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                  )}
                </button>

                <button
                  onClick={() => setActiveAdminTab('products')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeAdminTab === 'products'
                      ? 'bg-[#2A170A] text-white shadow-xs'
                      : 'text-[#6B5544] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Sweets Catalog ({products.length})</span>
                </button>

                <button
                  onClick={() => setActiveAdminTab('inquiries')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeAdminTab === 'inquiries'
                      ? 'bg-[#2A170A] text-white shadow-xs'
                      : 'text-[#6B5544] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Event Inquiries ({inquiries.length})</span>
                  {newInquiries > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </button>

                <button
                  onClick={() => setActiveAdminTab('messages')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeAdminTab === 'messages'
                      ? 'bg-[#2A170A] text-white shadow-xs'
                      : 'text-[#6B5544] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Messages ({messages.length})</span>
                </button>

                <button
                  onClick={() => setActiveAdminTab('reviews')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeAdminTab === 'reviews'
                      ? 'bg-[#2A170A] text-white shadow-xs'
                      : 'text-[#6B5544] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>Reviews ({reviews.length})</span>
                  {unapprovedReviews > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                      {unapprovedReviews}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveAdminTab('settings')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeAdminTab === 'settings'
                      ? 'bg-[#2A170A] text-white shadow-xs'
                      : 'text-[#6B5544] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Shop Settings</span>
                </button>

                <button
                  onClick={() => setActiveAdminTab('database')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeAdminTab === 'database'
                      ? 'bg-[#047857] text-white shadow-xs'
                      : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Connect Supabase ⚡</span>
                </button>
              </div>

              <button
                onClick={loadAdminData}
                disabled={loadingData}
                className="p-1.5 text-[#6B5544] hover:text-[#2A170A] hover:bg-[#FAF7F2] rounded-lg transition-colors cursor-pointer shrink-0"
                title="Refresh database records"
              >
                <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="bg-[#FAF7F2] px-4 sm:px-6 py-2.5 border-b border-[#EAE2D5] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-[#EAE2D5]">
                <span className="text-[#8C6D58] block text-[11px]">Total Revenue</span>
                <span className="text-sm font-bold text-[#2A170A] tabular-nums">
                  Rs. {totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-[#EAE2D5]">
                <span className="text-[#8C6D58] block text-[11px]">Total Orders Placed</span>
                <span className="text-sm font-bold text-[#2A170A] tabular-nums">
                  {orders.length} orders
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-[#EAE2D5]">
                <span className="text-[#8C6D58] block text-[11px]">Active Products</span>
                <span className="text-sm font-bold text-[#2A170A] tabular-nums">
                  {products.filter(p => p.in_stock).length} / {products.length} in stock
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-[#EAE2D5]">
                <span className="text-[#8C6D58] block text-[11px]">Pending Reviews</span>
                <span className="text-sm font-bold text-amber-700 tabular-nums">
                  {unapprovedReviews} awaiting approval
                </span>
              </div>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* TAB 1: ORDERS */}
              {activeAdminTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#2A170A]">
                      Live Kitchen & Delivery Orders
                    </h3>
                    <span className="text-xs text-[#8C6D58]">
                      Click status pills to change kitchen pipeline state
                    </span>
                  </div>

                  {orders.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#6B5544] bg-white rounded-2xl border border-[#EAE2D5]">
                      No orders placed yet. Place a test order from the shop front!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((ord) => (
                        <div key={ord.id} className="bg-white p-4 rounded-2xl border border-[#E8DFC9] shadow-xs space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#F2ECE1]">
                            <div>
                              <span className="font-mono text-xs font-bold text-[#C2410C] mr-2">
                                {ord.order_number}
                              </span>
                              <span className="text-xs text-[#8C6D58]">
                                {new Date(ord.created_at).toLocaleString()}
                              </span>
                            </div>

                            {/* Status Selector */}
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-[#8C6D58] text-[11px]">Status:</span>
                              {(['New', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'] as Order['status'][]).map((st) => (
                                <button
                                  key={st}
                                  onClick={() => handleUpdateOrderStatus(ord.id, st)}
                                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                                    ord.status === st
                                      ? st === 'Delivered'
                                        ? 'bg-emerald-700 text-white font-bold'
                                        : st === 'Preparing'
                                        ? 'bg-amber-600 text-white font-bold'
                                        : 'bg-[#2A170A] text-white font-bold'
                                      : 'bg-[#FAF7F2] text-[#6B5544] hover:text-[#2A170A] border border-[#EAE2D5]'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Customer & Items Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#5A4132]">
                            <div>
                              <div><strong>Customer:</strong> {ord.customer_name} ({ord.customer_phone})</div>
                              {ord.delivery_type === 'delivery' ? (
                                <div><strong>Delivery Address:</strong> {ord.delivery_address}, {ord.delivery_city}</div>
                              ) : (
                                <div><strong>Store Pickup:</strong> {ord.pickup_time || 'Main Store'}</div>
                              )}
                              <div><strong>Payment:</strong> <span className="uppercase">{ord.payment_method}</span></div>
                              {ord.special_notes && (
                                <div className="text-amber-800"><strong>Notes:</strong> {ord.special_notes}</div>
                              )}
                            </div>

                            <div>
                              <strong className="block mb-1">Items:</strong>
                              <ul className="space-y-0.5 text-[11px] text-[#6B5544]">
                                {ord.items.map((item, idx) => (
                                  <li key={idx} className="flex justify-between">
                                    <span>• {item.name} ({item.quantity} {item.unit})</span>
                                    <span className="font-mono tabular-nums">Rs. {item.total.toLocaleString()}</span>
                                  </li>
                                ))}
                              </ul>
                              <div className="flex justify-between font-bold text-xs pt-1.5 border-t border-[#F2ECE1] mt-1 text-[#2A170A]">
                                <span>Total:</span>
                                <span className="tabular-nums text-[#C2410C]">Rs. {ord.total.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PRODUCTS */}
              {activeAdminTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-[#2A170A]">
                        Manage Sweets Catalog ({products.length} items)
                      </h3>
                      <p className="text-xs text-[#8C6D58]">
                        Stored in Supabase <code className="font-mono bg-gray-100 px-1 rounded">products</code> table & <code className="font-mono bg-gray-100 px-1 rounded">sweets-images</code> storage.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleClearAllProducts}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                        title="Delete all demo sweets so you can add your own"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear All Demo Sweets</span>
                      </button>

                      <button
                        onClick={() => setIsBulkModalOpen(true)}
                        className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#D9C8B4] text-[#2A170A] text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#C2410C]" />
                        <span>Bulk Import Sweets</span>
                      </button>

                      <button
                        onClick={handleOpenAddProduct}
                        className="px-3.5 py-1.5 bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New Sweet</span>
                      </button>
                    </div>
                  </div>

                  {products.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-3xl border border-[#E8DFC9] space-y-3">
                      <Package className="w-10 h-10 text-gray-300 mx-auto" />
                      <h4 className="text-sm font-bold text-[#2A170A]">Your sweets catalog is currently empty</h4>
                      <p className="text-xs text-[#6B5544] max-w-md mx-auto">
                        Add individual sweets with photos, or click "Bulk Import Sweets" to paste your complete list at once.
                      </p>
                      <button
                        onClick={() => setIsBulkModalOpen(true)}
                        className="px-4 py-2 bg-[#C2410C] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                      >
                        Paste Your Sweets List Now
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {products.map((p) => (
                        <div key={p.id} className="bg-white p-3.5 rounded-2xl border border-[#E8DFC9] flex items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-14 h-14 object-cover rounded-xl shrink-0 border border-[#EAE2D5]"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-[#2A170A] truncate">{p.name}</h4>
                              <div className="text-[11px] text-[#8C6D58]">
                                {p.category} · Rs. {p.price_per_unit.toLocaleString()}/{p.unit}
                              </div>
                              <div className="text-[10px] text-[#6B5544]">
                                Status: <span className={p.in_stock ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>
                                  {p.in_stock ? 'In Stock' : 'Out of Stock'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleToggleStock(p)}
                              className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                                p.in_stock
                                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                              }`}
                            >
                              {p.in_stock ? 'Mark Out' : 'Restock'}
                            </button>
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="p-1.5 hover:bg-[#FAF7F2] text-[#2A170A] rounded-lg transition-colors cursor-pointer"
                              title="Edit sweet"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 hover:bg-red-50 text-red-700 rounded-lg transition-colors cursor-pointer"
                              title="Delete sweet"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: INQUIRIES */}
              {activeAdminTab === 'inquiries' && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-[#2A170A]">
                    Wedding & Corporate Bulk Inquiries
                  </h3>

                  {inquiries.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#6B5544] bg-white rounded-2xl border border-[#EAE2D5]">
                      No event inquiries submitted yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {inquiries.map((inq) => (
                        <div key={inq.id} className="bg-white p-4 rounded-2xl border border-[#E8DFC9] shadow-xs space-y-2 text-xs">
                          <div className="flex items-center justify-between pb-2 border-b border-[#F2ECE1]">
                            <div>
                              <strong className="text-sm text-[#2A170A]">{inq.name}</strong>
                              <span className="text-[#8C6D58] ml-2">({inq.phone})</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {(['New', 'Contacted', 'Quoted', 'Confirmed'] as EventInquiry['status'][]).map((st) => (
                                <button
                                  key={st}
                                  onClick={() => handleUpdateInquiryStatus(inq.id, st)}
                                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                                    inq.status === st
                                      ? 'bg-[#C2410C] text-white font-bold'
                                      : 'bg-[#FAF7F2] text-[#6B5544] hover:text-[#2A170A] border border-[#EAE2D5]'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[#5A4132]">
                            <div><strong>Occasion:</strong> {inq.event_type}</div>
                            <div><strong>Event Date:</strong> {inq.event_date}</div>
                            <div><strong>Boxes:</strong> {inq.estimated_boxes}</div>
                            <div><strong>Budget:</strong> {inq.budget_range || 'Standard'}</div>
                          </div>

                          {inq.custom_requirements && (
                            <div className="p-2 bg-[#FAF7F2] rounded-lg text-[#6B5544]">
                              <strong>Custom Notes:</strong> {inq.custom_requirements}
                            </div>
                          )}

                          <div className="text-[11px] text-[#8C6D58]">
                            Submitted on {new Date(inq.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: MESSAGES */}
              {activeAdminTab === 'messages' && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-[#2A170A]">
                    Customer Feedback & Contact Messages
                  </h3>

                  {messages.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#6B5544] bg-white rounded-2xl border border-[#EAE2D5]">
                      No messages received yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((m) => (
                        <div key={m.id} className="bg-white p-4 rounded-2xl border border-[#E8DFC9] shadow-xs space-y-2 text-xs">
                          <div className="flex items-center justify-between pb-2 border-b border-[#F2ECE1]">
                            <div>
                              <strong className="text-sm text-[#2A170A]">{m.name}</strong>
                              <span className="text-[#8C6D58] ml-2">({m.phone})</span>
                            </div>
                            <span className="text-[11px] text-[#8C6D58]">
                              {new Date(m.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className="font-bold text-[#C2410C]">Subject: {m.subject}</span>
                          </div>
                          <p className="text-[#5A4132] whitespace-pre-wrap leading-relaxed">
                            {m.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: REVIEWS MODERATION */}
              {activeAdminTab === 'reviews' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-[#2A170A]">
                        Real Customer Reviews Moderation
                      </h3>
                      <p className="text-xs text-[#6B5544]">
                        Only approved reviews appear on your public storefront. No fake claims are ever shown.
                      </p>
                    </div>
                  </div>

                  {reviews.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#6B5544] bg-white rounded-2xl border border-[#EAE2D5]">
                      No customer reviews have been submitted through the website yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reviews.map((r) => (
                        <div key={r.id} className="bg-white p-4 rounded-2xl border border-[#E8DFC9] shadow-xs space-y-2 text-xs">
                          <div className="flex items-center justify-between pb-2 border-b border-[#F2ECE1]">
                            <div className="flex items-center gap-2">
                              <strong className="text-sm text-[#2A170A]">{r.customer_name}</strong>
                              {r.city && <span className="text-[#8C6D58]">({r.city})</span>}
                              <div className="flex items-center text-amber-500 ml-2">
                                {[...Array(r.rating)].map((_, i) => (
                                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleReviewApproval(r.id, r.is_approved)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                  r.is_approved
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}
                              >
                                {r.is_approved ? '✓ Approved (Live on Site)' : '⏳ Pending Approval (Click to Approve)'}
                              </button>

                              <button
                                onClick={() => handleDeleteReview(r.id)}
                                className="p-1 hover:bg-red-50 text-red-600 rounded-lg transition-colors cursor-pointer"
                                title="Delete review"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <p className="text-[#4A3223] italic leading-relaxed">
                            "{r.comment}"
                          </p>

                          <div className="text-[11px] text-[#8C6D58]">
                            Submitted on {new Date(r.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: SHOP SETTINGS */}
              {activeAdminTab === 'settings' && (
                <div className="max-w-3xl bg-white p-6 sm:p-8 rounded-3xl border border-[#E8DFC9] shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F2ECE1]">
                    <div>
                      <h3 className="text-lg font-serif font-bold text-[#2A170A]">
                        Shop Configuration & Payment Credentials
                      </h3>
                      <p className="text-xs text-[#6B5544]">
                        Stored dynamically in Supabase <code className="font-mono bg-gray-100 px-1 rounded">settings</code> table. Updates reflect across the entire website instantly.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsQuickSettingsModalOpen(true)}
                      className="px-3.5 py-2 bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#D9C8B4] text-[#2A170A] text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap self-start sm:self-auto"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#C2410C]" />
                      <span>Paste from Template / Fill Details</span>
                    </button>
                  </div>

                  {settingsSavedMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Shop settings saved successfully to Supabase!</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                    {/* Basic Brand */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-[#2A170A] block mb-1">Shop Name *</label>
                        <input
                          type="text"
                          value={settingsForm.shop_name || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, shop_name: e.target.value })}
                          className="w-full px-3 py-2 border border-[#D9C8B4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                          required
                        />
                      </div>
                      <div>
                        <label className="font-bold text-[#2A170A] block mb-1">Tagline</label>
                        <input
                          type="text"
                          value={settingsForm.tagline || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                          className="w-full px-3 py-2 border border-[#D9C8B4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                        />
                      </div>
                    </div>

                    {/* Optional Location Notes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-[#2A170A] block mb-1">
                          Store Location Note (Optional / Kept Private)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Sent via WhatsApp upon order"
                          value={settingsForm.address || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                          className="w-full px-3 py-2 border border-[#D9C8B4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                        />
                        <span className="text-[10px] text-[#8C6D58]">
                          Store address is removed from the public website; pickup instructions are sent on WhatsApp.
                        </span>
                      </div>
                      <div>
                        <label className="font-bold text-[#2A170A] block mb-1">City / Region (Optional)</label>
                        <input
                          type="text"
                          placeholder="Optional"
                          value={settingsForm.city || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, city: e.target.value })}
                          className="w-full px-3 py-2 border border-[#D9C8B4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                        />
                      </div>
                    </div>

                    {/* Phone & WhatsApp */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-[#2A170A] block mb-1">Store Landline / Phone</label>
                        <input
                          type="text"
                          value={settingsForm.phone || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-[#D9C8B4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-[#2A170A] block mb-1">WhatsApp Number (Orders Dispatched Here) *</label>
                        <input
                          type="text"
                          value={settingsForm.whatsapp || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                          className="w-full px-3 py-2 border border-[#D9C8B4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                          required
                        />
                      </div>
                    </div>

                    {/* Timings */}
                    <div>
                      <label className="font-bold text-[#2A170A] block mb-1">Shop Timings</label>
                      <input
                        type="text"
                        placeholder="Monday – Sunday: 9:00 AM – 11:30 PM"
                        value={settingsForm.timings || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, timings: e.target.value })}
                        className="w-full px-3 py-2 border border-[#D9C8B4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                      />
                    </div>

                    {/* Delivery areas & fees */}
                    <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#EAE2D5] space-y-3">
                      <h4 className="font-bold text-[#2A170A]">Delivery Settings</h4>
                      <div>
                        <label className="font-bold text-[#5A4132] block mb-1">Delivery Areas (Covered Zones)</label>
                        <input
                          type="text"
                          placeholder="Gulberg, DHA, Model Town, Cantt, Garden Town, Johar Town"
                          value={settingsForm.delivery_areas || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, delivery_areas: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-[#D9C8B4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="font-bold text-[#5A4132] block mb-1">Standard Delivery Fee (Rs.)</label>
                          <input
                            type="number"
                            value={settingsForm.delivery_fee ?? 250}
                            onChange={(e) => setSettingsForm({ ...settingsForm, delivery_fee: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white border border-[#D9C8B4] rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-[#5A4132] block mb-1">Free Delivery Above (Rs.)</label>
                          <input
                            type="number"
                            value={settingsForm.free_delivery_threshold ?? 4000}
                            onChange={(e) => setSettingsForm({ ...settingsForm, free_delivery_threshold: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white border border-[#D9C8B4] rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Payment methods & accounts */}
                    <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#EAE2D5] space-y-3">
                      <h4 className="font-bold text-[#C2410C]">Online Payment Accounts (Shown at Checkout)</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[#5A4132] mb-1">Bank Name</label>
                          <input
                            type="text"
                            placeholder="Meezan Bank Limited / HBL"
                            value={settingsForm.bank_name || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, bank_name: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[#5A4132] mb-1">Bank Account Title</label>
                          <input
                            type="text"
                            placeholder="Mithas Sweets Gourmet"
                            value={settingsForm.bank_title || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, bank_title: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[#5A4132] mb-1">Bank Account Number</label>
                          <input
                            type="text"
                            placeholder="0214-0108920192"
                            value={settingsForm.bank_account_no || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, bank_account_no: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border rounded-lg font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[#5A4132] mb-1">Bank IBAN</label>
                          <input
                            type="text"
                            placeholder="PK45MEZN0002140108920192"
                            value={settingsForm.bank_iban || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, bank_iban: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border rounded-lg font-mono text-[11px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[#5A4132] mb-1">JazzCash Title & Number</label>
                          <input
                            type="text"
                            placeholder="JazzCash: 0300-8472911"
                            value={settingsForm.jazzcash_number || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, jazzcash_number: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border rounded-lg font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[#5A4132] mb-1">Easypaisa Title & Number</label>
                          <input
                            type="text"
                            placeholder="Easypaisa: 0300-8472911"
                            value={settingsForm.easypaisa_number || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, easypaisa_number: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border rounded-lg font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Social links */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-[#2A170A] block mb-1">Instagram URL</label>
                        <input
                          type="url"
                          placeholder="https://instagram.com/mithassweets"
                          value={settingsForm.social_instagram || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, social_instagram: e.target.value })}
                          className="w-full px-3 py-2 border border-[#D9C8B4] rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-[#2A170A] block mb-1">Facebook URL</label>
                        <input
                          type="url"
                          placeholder="https://facebook.com/mithassweets"
                          value={settingsForm.social_facebook || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, social_facebook: e.target.value })}
                          className="w-full px-3 py-2 border border-[#D9C8B4] rounded-xl"
                        />
                      </div>
                    </div>

                    {/* About us text */}
                    <div>
                      <label className="font-bold text-[#2A170A] block mb-1">
                        About Us Text (Rendered verbatim in About section with zero fabricated claims) *
                      </label>
                      <textarea
                        rows={4}
                        value={settingsForm.about_text || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, about_text: e.target.value })}
                        className="w-full px-3 py-2 border border-[#D9C8B4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                        placeholder="Welcome to our shop! We offer freshly prepared traditional sweets, barfi, laddus, and gift hampers for weddings and special occasions."
                        required
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="py-3 px-6 bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold rounded-xl transition-all cursor-pointer shadow-md"
                      >
                        Save Shop Settings to Supabase
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 7: SUPABASE SETUP & CONNECT DATABASE */}
              {activeAdminTab === 'database' && (
                <div className="max-w-4xl bg-white p-6 sm:p-8 rounded-3xl border border-[#E8DFC9] shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F2ECE1]">
                    <div>
                      <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-emerald-600" />
                        <h3 className="text-lg font-serif font-bold text-[#2A170A]">
                          Supabase Database Connection Guide
                        </h3>
                      </div>
                      <p className="text-xs text-[#6B5544] mt-0.5">
                        Connect your live PostgreSQL database on Supabase to store orders, sweets catalog, reviews, and settings.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleTestSupabase}
                        disabled={testingSupabase}
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {testingSupabase ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        <span>Test Connection</span>
                      </button>

                      <button
                        onClick={handleCopySql}
                        className="px-3.5 py-2 bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#D9C8B4] text-[#2A170A] text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSql ? 'Copied SQL!' : 'Copy Schema SQL'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Test Connection Result Box */}
                  {testResult && (
                    <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                      testResult.connected
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-amber-50 border-amber-300 text-amber-900'
                    }`}>
                      <div className="font-bold flex items-center gap-2">
                        {testResult.connected ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Connection Successful! Supabase is Live.</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            <span>Supabase Status: Not fully active</span>
                          </>
                        )}
                      </div>
                      <p>{testResult.message || testResult.error}</p>
                      {testResult.hint && <p className="font-medium text-amber-800">Hint: {testResult.hint}</p>}
                      {testResult.totalProductsInDB !== undefined && (
                        <p className="font-mono text-[11px]">Total products in Supabase: {testResult.totalProductsInDB}</p>
                      )}
                    </div>
                  )}

                  {/* Urdu & English Step-by-Step Instructions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#EAE2D5] space-y-3">
                      <h4 className="font-bold text-[#C2410C] text-sm">
                        اردو میں ہدایات (Connecting Steps)
                      </h4>
                      <ol className="space-y-2 text-[#5A4132] list-decimal pl-4 leading-relaxed">
                        <li>
                          <strong>Supabase اکاؤنٹ:</strong> <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-[#C2410C] underline">supabase.com</a> پر جا کر مفت پروجیکٹ بنائیں.
                        </li>
                        <li>
                          <strong>API Keys حاصل کریں:</strong> Project Settings &gt; API میں جائیں۔ وہاں سے <code>Project URL</code> اور <code>service_role</code> secret key کاپی کریں۔
                        </li>
                        <li>
                          <strong>Environment File (.env):</strong> اپنی <code>.env</code> فائل میں یہ دونوں ویریبلز شامل کریں:
                          <pre className="mt-1 p-2 bg-white rounded-lg border font-mono text-[11px] overflow-x-auto text-[#2A170A]">
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."
                          </pre>
                        </li>
                        <li>
                          <strong>SQL ٹیبلز بنائیں:</strong> Supabase ڈیش بورڈ میں <strong>SQL Editor</strong> کھولیں، اوپر دیے گئے بٹن <em>"Copy Schema SQL"</em> پر کلک کر کے سکرپٹ پیسٹ کریں اور <strong>Run</strong> دبائیں۔
                        </li>
                      </ol>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-[#EAE2D5] space-y-3">
                      <h4 className="font-bold text-[#2A170A] text-sm">
                        English Instructions & Schema Details
                      </h4>
                      <ul className="space-y-2 text-[#5A4132] leading-relaxed">
                        <li>
                          <strong>Tables Provisioned:</strong> <code>products</code>, <code>orders</code>, <code>event_inquiries</code>, <code>contact_messages</code>, <code>reviews</code>, <code>settings</code>.
                        </li>
                        <li>
                          <strong>Storage Bucket:</strong> <code>sweets-images</code> is created automatically with public read access for sweet photos.
                        </li>
                        <li>
                          <strong>Security (RLS):</strong> Row Level Security is configured with public read for products, settings, and approved reviews.
                        </li>
                        <li>
                          <strong>No Downtime Fallback:</strong> While you set up your keys, the system maintains local fallback storage automatically.
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Schema Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#2A170A]">
                      <span>SQL Schema Script (Run in Supabase SQL Editor):</span>
                      <button
                        onClick={handleCopySql}
                        className="text-[#C2410C] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                      >
                        {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy Full SQL'}</span>
                      </button>
                    </div>
                    <pre className="p-4 bg-[#2A170A] text-amber-100 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-64 border border-[#3D2619]">
                      {SUPABASE_SCHEMA_SQL}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Product Add / Edit Submodal (with Supabase Storage Upload) */}
        {isProductModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 border border-[#D9C8B4] shadow-2xl relative">
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-lg font-serif font-bold text-[#2A170A]">
                {editingProduct ? 'Edit Sweet Item' : 'Add New Sweet to Menu'}
              </h3>

              <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold block mb-1">Sweet Name *</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-bold block mb-1">Category *</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full px-2.5 py-2 border rounded-xl"
                    >
                      <option value="Barfi">Barfi</option>
                      <option value="Laddu">Laddu</option>
                      <option value="Halwa">Halwa</option>
                      <option value="Mithai">Mithai</option>
                      <option value="Dry Fruit Sweets">Dry Fruit Sweets</option>
                      <option value="Cakes">Cakes</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Price (Rs.) *</label>
                    <input
                      type="number"
                      value={productForm.price_per_unit}
                      onChange={(e) => setProductForm({ ...productForm, price_per_unit: Number(e.target.value) })}
                      className="w-full px-2.5 py-2 border rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Unit *</label>
                    <select
                      value={productForm.unit}
                      onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                      className="w-full px-2.5 py-2 border rounded-xl"
                    >
                      <option value="kg">per kg</option>
                      <option value="piece">per piece</option>
                      <option value="box">per box</option>
                    </select>
                  </div>
                </div>

                {/* Image upload with Supabase Storage */}
                <div className="space-y-1.5 p-3 bg-[#FAF7F2] rounded-xl border border-[#EAE2D5]">
                  <label className="font-bold block text-[#2A170A]">
                    Sweet Image (Upload to Supabase Storage or Paste URL)
                  </label>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="px-3 py-1.5 bg-white border border-[#D9C8B4] hover:bg-gray-50 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                    </button>
                    {uploadSuccess && (
                      <span className="text-emerald-700 text-[11px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Uploaded to Supabase!
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Or enter direct image URL"
                    value={productForm.image}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                    className="w-full px-2.5 py-1.5 border rounded-lg bg-white font-mono text-[11px]"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Ingredients (comma separated)</label>
                  <input
                    type="text"
                    placeholder="Khoya, Pistachios, Cardamom, Sugar"
                    value={productForm.ingredients}
                    onChange={(e) => setProductForm({ ...productForm, ingredients: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.in_stock}
                      onChange={(e) => setProductForm({ ...productForm, in_stock: e.target.checked })}
                      className="w-4 h-4 accent-[#C2410C]"
                    />
                    <span className="font-semibold text-xs">In Stock</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.is_featured}
                      onChange={(e) => setProductForm({ ...productForm, is_featured: e.target.checked })}
                      className="w-4 h-4 accent-[#C2410C]"
                    />
                    <span className="font-semibold text-xs">Featured on Home Page</span>
                  </label>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-4 py-2 border rounded-xl text-xs hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                  >
                    {editingProduct ? 'Save Changes' : 'Create Sweet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Sweets Import Submodal */}
        {isBulkModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-[#D9C8B4] shadow-2xl relative">
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <h3 className="text-lg font-serif font-bold text-[#2A170A]">
                  Bulk Import Sweets
                </h3>
                <p className="text-xs text-[#6B5544] mt-1">
                  Paste your sweets list below. Format: <code className="font-mono bg-gray-100 px-1 rounded">Name | Category | Price | Unit | Description</code>
                </p>
              </div>

              {bulkMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs">
                  {bulkMessage}
                </div>
              )}

              <textarea
                rows={8}
                value={bulkInputText}
                onChange={(e) => setBulkInputText(e.target.value)}
                placeholder={`Pistachio Saffron Barfi | Barfi | 1950 | kg | Fresh milk khoya barfi with saffron
Kaju Katli | Mithai | 2400 | kg | Pure cashew nut confection
Motichoor Laddu | Laddu | 1450 | kg | Melt-in-mouth gram flour pearls in pure desi ghee
Multani Sohan Halwa | Halwa | 1850 | kg | Generational recipe with sprouted wheat & walnuts`}
                className="w-full p-3 font-mono text-xs border border-[#D9C8B4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkImport}
                  disabled={bulkLoading || !bulkInputText.trim()}
                  className="px-5 py-2 bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {bulkLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Import Sweets List</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Settings Paste Template Submodal */}
        {isQuickSettingsModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-[#D9C8B4] shadow-2xl relative">
              <button
                onClick={() => setIsQuickSettingsModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <h3 className="text-lg font-serif font-bold text-[#2A170A]">
                  Paste Real Shop Details
                </h3>
                <p className="text-xs text-[#6B5544] mt-1">
                  Paste your shop details template block below to auto-fill the settings form:
                </p>
              </div>

              <textarea
                rows={9}
                value={quickTemplateText}
                onChange={(e) => setQuickTemplateText(e.target.value)}
                placeholder={`Shop name: Royal Mithas Sweets
Tagline: Fresh Pure Desi Ghee Confections
Address: Shop 14-B, Main Boulevard, Gulberg III, City: Lahore
Phone: +92 42 35789123, WhatsApp: +92 300 8472911
Timings: Monday – Sunday: 9:00 AM – 11:30 PM
Delivery areas: Gulberg, DHA, Model Town, Cantt, delivery fee: 250, free delivery above: 4000
About us text (use exactly this): Welcome to our shop! We offer freshly made traditional sweets.`}
                className="w-full p-3 font-mono text-xs border border-[#D9C8B4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickSettingsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleParseQuickTemplate}
                  disabled={!quickTemplateText.trim()}
                  className="px-5 py-2 bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Parse & Auto-Fill Form</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
