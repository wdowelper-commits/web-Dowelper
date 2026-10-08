import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Lock, ShieldCheck, Plus, Edit, Trash2, CheckCircle2, Clock, 
  Truck, AlertCircle, RefreshCw, DollarSign, Package, Users, Settings, 
  MessageSquare, Upload, Image as ImageIcon, Loader2, Database, Mail,
  Star, Copy, Check, ExternalLink, Sparkles, FileText, ChefHat, Volume2,
  Calendar, Eye, Printer, Award, ArrowUpRight, ShoppingBag, Search, Filter, LogOut
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, Legend 
} from 'recharts';
import { Product, Order, EventInquiry, ContactMessage, ShopSettings, Review, GiftBox, Coupon } from '../types';
import { api } from '../services/api';
import { supabase } from '../services/supabase';

// Subcomponents
import { OrderDetailModal } from './admin/OrderDetailModal';
import { ProductFormModal } from './admin/ProductFormModal';
import { InquiryDetailModal } from './admin/InquiryDetailModal';
import { MessageDetailModal } from './admin/MessageDetailModal';
import { KitchenView } from './admin/KitchenView';
import { SettingsTab } from './admin/SettingsTab';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onRefreshProducts: () => void;
  settings?: ShopSettings;
  onRefreshSettings: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  products,
  onRefreshProducts,
  settings,
  onRefreshSettings
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'kitchen' | 'orders' | 'products' | 'gift_boxes' | 'coupons' | 'reviews' | 'inquiries' | 'messages' | 'settings' | 'sql'
  >('dashboard');

  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [inquiries, setInquiries] = useState<EventInquiry[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [giftBoxes, setGiftBoxes] = useState<GiftBox[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Sound chime reference & realtime
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<EventInquiry | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  // Stock quick adjustment state
  const [stockAdjustId, setStockAdjustId] = useState<string | null>(null);
  const [stockDelta, setStockDelta] = useState<number>(500);
  const [stockReason, setStockReason] = useState<string>('Restock');

  // Orders Filters
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>('All');
  const [orderFilterPayment, setOrderFilterPayment] = useState<string>('All');
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [orderDateFrom, setOrderDateFrom] = useState<string>('');
  const [orderDateTo, setOrderDateTo] = useState<string>('');

  // Inquiries filter
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<string>('All');

  // Coupon Creation
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [newCouponValue, setNewCouponValue] = useState(10);
  const [newCouponMinOrder, setNewCouponMinOrder] = useState(1500);

  const [copiedSql, setCopiedSql] = useState(false);

  // Synthesize clean audio chime with Web Audio API (Part C requirement)
  const playNewOrderNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.25); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch {}
  };

  // Check auth session & call is_admin() RPC
  const verifyAdminAuth = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setIsAuthenticated(false);
        return false;
      }

      const { data: isAdmin, error } = await supabase.rpc('is_admin');
      if (error || isAdmin !== true) {
        // Sign out unauthorized user
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        return false;
      }

      setIsAuthenticated(true);
      return true;
    } catch {
      setIsAuthenticated(false);
      return false;
    }
  };

  useEffect(() => {
    if (isOpen) {
      verifyAdminAuth().then((authed) => {
        if (authed) {
          loadAdminData();
        }
      });
    }
  }, [isOpen]);

  // Realtime subscription on orders table (Part C)
  useEffect(() => {
    if (!isAuthenticated || !isOpen) return;

    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const newRow = payload.new as Order;
          if (soundEnabled) {
            playNewOrderNotificationSound();
          }
          setToastMessage(`New order received: ${newRow.order_number || 'MS-XXXX'}`);
          setTimeout(() => setToastMessage(null), 5000);
          loadAdminData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, isOpen, soundEnabled]);

  // Auto-refresh interval (Part I requirement: kitchen view 60s)
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      const interval = setInterval(() => {
        loadAdminData();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isOpen]);

  // Fetch admin records
  const loadAdminData = async () => {
    setLoadingData(true);
    try {
      // Protect query with session verification
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setIsAuthenticated(false);
        return;
      }

      const [ords, inqs, msgs, revs, coups, boxes] = await Promise.all([
        api.getAdminOrders(),
        api.getAdminInquiries(),
        api.getAdminMessages(),
        api.getAdminReviews(),
        api.getAdminCoupons(),
        api.getGiftBoxes()
      ]);

      setOrders(ords);
      setInquiries(inqs);
      setMessages(msgs);
      setReviews(revs);
      setCoupons(coups);
      setGiftBoxes(boxes);
    } catch (err: any) {
      console.warn('Admin load error:', err);
      if (err.message && (err.message.includes('JWT') || err.message.includes('unauthorized'))) {
        setIsAuthenticated(false);
      }
    } finally {
      setLoadingData(false);
    }
  };

  // Handle Login with is_admin() verification
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword
      });

      if (error) {
        throw new Error(error.message || 'Invalid credentials');
      }

      // Call is_admin() RPC
      const { data: isAdmin, error: rpcErr } = await supabase.rpc('is_admin');
      if (rpcErr || isAdmin !== true) {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setAuthError('Access denied. You are not authorized as admin.');
        return;
      }

      setIsAuthenticated(true);
      await loadAdminData();
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setOrders([]);
  };

  // Product quick-adjust stock
  const handleQuickStockAdjust = async (product: Product, delta: number, reason: string) => {
    const currentGrams = product.stock_grams ?? 0;
    const newGrams = Math.max(0, currentGrams + delta);
    try {
      await api.updateProduct(product.id, {
        stock_grams: newGrams,
        in_stock: newGrams > 0,
        is_available: newGrams > 0 ? product.is_available : false
      });
      onRefreshProducts();
      loadAdminData();
    } catch (err: any) {
      alert('Failed to update stock: ' + err.message);
    }
  };

  // Product inline toggle
  const handleToggleProduct = async (product: Product, field: 'is_available' | 'is_featured') => {
    try {
      await api.updateProduct(product.id, {
        [field]: !product[field]
      });
      onRefreshProducts();
      loadAdminData();
    } catch (err: any) {
      alert(`Failed to update ${field}: ` + err.message);
    }
  };

  // Product Delete
  const handleDeleteProduct = async (product: Product) => {
    const hasOrders = orders.some(o => o.items.some(it => it.product_id === product.id || it.name === product.name));
    let msg = `Are you sure you want to delete "${product.name}"?`;
    if (hasOrders) {
      msg = `Warning: "${product.name}" is referenced in past customer orders. Deleting may affect historical line items. Are you sure you wish to delete?`;
    }

    if (confirm(msg)) {
      try {
        await api.deleteProduct(product.id);
        onRefreshProducts();
        loadAdminData();
      } catch (err: any) {
        alert('Failed to delete product: ' + err.message);
      }
    }
  };

  // Coupon Creation
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    try {
      await api.createCoupon({
        code: newCouponCode.trim().toUpperCase(),
        discount_type: newCouponType,
        discount_value: Number(newCouponValue),
        min_order_amount: Number(newCouponMinOrder),
        is_active: true
      });
      setNewCouponCode('');
      loadAdminData();
    } catch (err: any) {
      alert('Failed to create coupon: ' + err.message);
    }
  };

  // Calculations for Dashboard Stats (Part B)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.created_at && o.created_at.startsWith(todayStr));
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.status !== 'Cancelled' ? o.total : 0), 0);

  const totalOrdersCount = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'Cancelled' ? o.total : 0), 0);

  const pendingOrders = orders.filter(o => o.status === 'New' || o.status === 'Confirmed');
  const pendingPaymentVerifications = orders.filter(
    o => o.payment_status === 'pending' && o.payment_method !== 'cod'
  );
  const lowStockProductsList = products.filter(
    p => p.stock_grams <= (p.low_stock_threshold_grams || 500)
  );

  // Weekly bar chart data (Last 7 days: date vs order count and revenue)
  const last7DaysData = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const dayDateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' });

    const matchingOrders = orders.filter(o => o.created_at && o.created_at.startsWith(dayDateStr));
    const dayRevenue = matchingOrders.reduce((acc, o) => acc + (o.status !== 'Cancelled' ? o.total : 0), 0);

    return {
      date: dayLabel,
      orders: matchingOrders.length,
      revenue: dayRevenue
    };
  });

  // 5 Most recent orders
  const recent5Orders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const getTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  // Filtered orders list (Part C)
  const filteredOrders = orders.filter(ord => {
    if (orderFilterStatus !== 'All' && ord.status !== orderFilterStatus) return false;
    if (orderFilterPayment !== 'All' && ord.payment_status !== orderFilterPayment) return false;
    if (orderDateFrom && ord.created_at && ord.created_at.split('T')[0] < orderDateFrom) return false;
    if (orderDateTo && ord.created_at && ord.created_at.split('T')[0] > orderDateTo) return false;
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      const matchNum = ord.order_number?.toLowerCase().includes(q);
      const matchName = ord.customer_name?.toLowerCase().includes(q);
      const matchPhone = ord.customer_phone?.toLowerCase().includes(q);
      if (!matchNum && !matchName && !matchPhone) return false;
    }
    return true;
  });

  // Filtered inquiries
  const filteredInquiries = inquiries.filter(inq => {
    if (inquiryStatusFilter !== 'All' && inq.status !== inquiryStatusFilter) return false;
    return true;
  });

  const unreadMessagesCount = messages.filter(m => m.is_read === false || m.status === 'Unread').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-[#FAF7F2] rounded-3xl w-full max-w-7xl h-[94vh] flex flex-col shadow-2xl border border-[#D9C8B4] overflow-hidden">
        
        {/* Top Header */}
        <div className="px-6 py-4 bg-[#2A170A] text-white flex items-center justify-between border-b border-amber-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-600/20 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-amber-100">
                Mithas Sweets — Owner Administration
              </h2>
              <span className="text-[11px] text-amber-200/70 font-mono">
                Postgres RLS · Auth Protected System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {toastMessage && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold animate-pulse">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span>{toastMessage}</span>
              </div>
            )}

            {isAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    soundEnabled ? 'bg-amber-800/60 text-amber-200' : 'bg-neutral-800 text-neutral-400'
                  }`}
                  title="Toggle new order audio alert"
                >
                  <Volume2 className="w-4 h-4" />
                  <span className="hidden sm:inline">{soundEnabled ? 'Chime Active' : 'Muted'}</span>
                </button>

                <button
                  type="button"
                  onClick={loadAdminData}
                  disabled={loadingData}
                  className="p-2 bg-amber-900/50 hover:bg-amber-800 rounded-xl text-amber-200 text-xs transition-colors cursor-pointer"
                  title="Refresh records"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-200 border border-red-800 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-300 transition-colors cursor-pointer"
              title="Close Admin Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Realtime Toast Popover on Mobile */}
        {toastMessage && (
          <div className="md:hidden bg-amber-600 text-white text-xs px-4 py-2 flex items-center justify-between font-semibold">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {!isAuthenticated ? (
          /* PART A: SECURE LOGIN SCREEN */
          <div className="flex-1 flex items-center justify-center p-6 bg-[#FAF7F2]">
            <div className="bg-white p-8 rounded-3xl max-w-md w-full shadow-2xl border border-[#D9C8B4] space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-amber-50 text-[#C2410C] rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
                  <Lock className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#2A170A]">Admin Authentication</h3>
                <p className="text-xs text-[#6B5544]">
                  Sign in with authorized owner credentials. Role is validated against the Supabase database via the <code>is_admin()</code> function.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#8C6D58] block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="owner@mithassweets.com"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl focus:outline-none focus:border-[#C2410C]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#8C6D58] block mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl focus:outline-none focus:border-[#C2410C]"
                  />
                </div>

                {authError && (
                  <div className="p-3 bg-red-50 text-red-800 text-xs rounded-xl flex items-center gap-2 border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 bg-[#C2410C] hover:bg-[#9A3412] text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Sign In as Admin</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED WORKSPACE */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Navigation on Desktop */}
            <div className="hidden md:flex w-64 bg-white border-r border-[#EAE2D5] p-3 space-y-1 shrink-0 flex-col justify-start overflow-y-auto">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: DollarSign },
                { id: 'orders', label: 'Orders Management', icon: Package, badge: orders.length },
                { id: 'kitchen', label: 'Kitchen View', icon: ChefHat, badge: pendingOrders.length || undefined },
                { id: 'products', label: 'Products Catalog', icon: ShoppingBag, badge: lowStockProductsList.length ? `${lowStockProductsList.length} low` : undefined },
                { id: 'inquiries', label: 'Event Inquiries', icon: Calendar, badge: inquiries.filter(i => i.status === 'New').length || undefined },
                { id: 'messages', label: 'Contact Messages', icon: MessageSquare, badge: unreadMessagesCount || undefined },
                { id: 'reviews', label: 'Reviews', icon: Star, badge: reviews.filter(r => !r.is_approved).length || undefined },
                { id: 'settings', label: 'Shop Settings', icon: Settings },
                { id: 'coupons', label: 'Coupons', icon: FileText },
                { id: 'gift_boxes', label: 'Gift Boxes', icon: Award },
                { id: 'sql', label: 'Database Setup SQL', icon: Database },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#2A170A] text-white shadow-xs'
                        : 'text-[#5A4132] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                        isActive ? 'bg-amber-600 text-white' : 'bg-amber-100 text-[#8C6D58]'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom Tab Bar on Mobile */}
            <div className="md:hidden flex overflow-x-auto bg-white border-b border-[#EAE2D5] px-2 py-1.5 gap-1 shrink-0 no-scrollbar">
              {[
                { id: 'dashboard', label: 'Stats', icon: DollarSign },
                { id: 'orders', label: 'Orders', icon: Package },
                { id: 'kitchen', label: 'Kitchen', icon: ChefHat },
                { id: 'products', label: 'Catalog', icon: ShoppingBag },
                { id: 'inquiries', label: 'Events', icon: Calendar },
                { id: 'messages', label: 'Messages', icon: MessageSquare },
                { id: 'reviews', label: 'Reviews', icon: Star },
                { id: 'settings', label: 'Settings', icon: Settings },
              ].map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap ${
                      isActive ? 'bg-[#2A170A] text-white' : 'text-[#5A4132] bg-[#FAF7F2]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              
              {/* PART B: ADMIN DASHBOARD (HOME TAB) */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Top Live Stats Loaded from Supabase */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                    {/* Today's Orders & Revenue */}
                    <div className="bg-white p-5 rounded-3xl border border-[#EAE2D5] shadow-xs space-y-1">
                      <span className="text-[11px] font-bold text-[#8C6D58] uppercase tracking-wider block">Today's Orders</span>
                      <div className="text-2xl font-serif font-bold text-[#2A170A]">
                        {todayOrders.length}
                      </div>
                      <span className="text-xs font-mono font-bold text-[#C2410C] block">
                        Rs. {todayRevenue.toLocaleString()}
                      </span>
                    </div>

                    {/* Total All-Time Orders & Revenue */}
                    <div className="bg-white p-5 rounded-3xl border border-[#EAE2D5] shadow-xs space-y-1">
                      <span className="text-[11px] font-bold text-[#8C6D58] uppercase tracking-wider block">All-Time Revenue</span>
                      <div className="text-2xl font-serif font-bold text-[#2A170A]">
                        Rs. {totalRevenue.toLocaleString()}
                      </div>
                      <span className="text-xs text-[#8C6D58] block">
                        {totalOrdersCount} total orders
                      </span>
                    </div>

                    {/* Pending Orders (New or Confirmed) */}
                    <div className="bg-white p-5 rounded-3xl border border-[#EAE2D5] shadow-xs space-y-1">
                      <span className="text-[11px] font-bold text-[#8C6D58] uppercase tracking-wider block">Pending Orders</span>
                      <div className="text-2xl font-serif font-bold text-amber-700">
                        {pendingOrders.length}
                      </div>
                      <span className="text-xs text-[#8C6D58] block">
                        Status: New / Confirmed
                      </span>
                    </div>

                    {/* Pending Payment Verifications */}
                    <div className="bg-white p-5 rounded-3xl border border-[#EAE2D5] shadow-xs space-y-1">
                      <span className="text-[11px] font-bold text-[#8C6D58] uppercase tracking-wider block">Unverified Payments</span>
                      <div className="text-2xl font-serif font-bold text-purple-700">
                        {pendingPaymentVerifications.length}
                      </div>
                      <span className="text-xs text-[#8C6D58] block">
                        Online / Bank receipts
                      </span>
                    </div>

                    {/* Low Stock Products */}
                    <div className="bg-white p-5 rounded-3xl border border-[#EAE2D5] shadow-xs space-y-1">
                      <span className="text-[11px] font-bold text-[#8C6D58] uppercase tracking-wider block">Low Stock Sweets</span>
                      <div className="text-2xl font-serif font-bold text-red-600">
                        {lowStockProductsList.length}
                      </div>
                      <span className="text-xs text-[#8C6D58] block">
                        Under threshold weight
                      </span>
                    </div>
                  </div>

                  {/* Weekly Bar Chart (recharts: date vs order count and revenue) */}
                  <div className="bg-white p-6 rounded-3xl border border-[#EAE2D5] shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <h3 className="text-base font-serif font-bold text-[#2A170A]">Last 7 Days Performance</h3>
                        <p className="text-xs text-[#8C6D58]">Daily breakdown of order count and total revenue (PKR)</p>
                      </div>
                      <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-[#C2410C] rounded-lg border border-amber-200 self-start">
                        Live Supabase Aggregate
                      </span>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={last7DaysData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F2ECE1" />
                          <XAxis dataKey="date" stroke="#8C6D58" fontSize={11} />
                          <YAxis yAxisId="left" stroke="#C2410C" fontSize={11} />
                          <YAxis yAxisId="right" orientation="right" stroke="#2A170A" fontSize={11} />
                          <Tooltip 
                            formatter={(value: any, name: any) => [
                              name === 'revenue' ? `Rs. ${Number(value).toLocaleString()}` : `${value} orders`,
                              name === 'revenue' ? 'Daily Revenue' : 'Orders Count'
                            ]}
                            contentStyle={{ backgroundColor: '#FAF7F2', borderRadius: '12px', border: '1px solid #D9C8B4' }}
                          />
                          <Legend />
                          <Bar yAxisId="left" dataKey="revenue" fill="#C2410C" name="revenue" radius={[4, 4, 0, 0]} />
                          <Bar yAxisId="right" dataKey="orders" fill="#2A170A" name="orders" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 5 Most Recent Orders */}
                  <div className="bg-white rounded-3xl border border-[#EAE2D5] shadow-xs p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-base font-serif font-bold text-[#2A170A]">5 Most Recent Orders</h3>
                        <p className="text-xs text-[#8C6D58]">Latest customer bookings received</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('orders')}
                        className="text-xs font-semibold text-[#C2410C] hover:underline cursor-pointer"
                      >
                        View All Orders →
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAF7F2] text-[#8C6D58] uppercase border-b border-[#EAE2D5]">
                          <tr>
                            <th className="p-3">Order Number</th>
                            <th className="p-3">Customer</th>
                            <th className="p-3">Total</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Time Ago</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F2ECE1]">
                          {recent5Orders.length > 0 ? (
                            recent5Orders.map(ord => (
                              <tr 
                                key={ord.id} 
                                onClick={() => setSelectedOrder(ord)}
                                className="hover:bg-[#FAF7F2] cursor-pointer"
                              >
                                <td className="p-3 font-mono font-bold text-[#C2410C]">{ord.order_number}</td>
                                <td className="p-3 font-semibold text-[#2A170A]">{ord.customer_name}</td>
                                <td className="p-3 font-mono font-bold">Rs. {ord.total.toLocaleString()}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    ord.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                                    ord.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-amber-100 text-amber-900'
                                  }`}>
                                    {ord.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right text-[#8C6D58]">{getTimeAgo(ord.created_at)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-[#8C6D58]">
                                No customer orders recorded yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* PART C: ORDER MANAGEMENT TAB */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-[#2A170A]">Customer Orders</h3>
                      <p className="text-xs text-[#8C6D58]">
                        Review receipts, verify payments, update delivery statuses, and print invoices.
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 bg-white border border-[#D9C8B4] rounded-xl self-start">
                      {filteredOrders.length} matching orders
                    </span>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="bg-white p-4 rounded-3xl border border-[#EAE2D5] shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                    {/* Search */}
                    <div>
                      <label className="font-semibold text-[#8C6D58] block mb-1">Search</label>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8C6D58]" />
                        <input
                          type="text"
                          value={orderSearch}
                          onChange={(e) => setOrderSearch(e.target.value)}
                          placeholder="Order no, name, phone"
                          className="w-full pl-8 pr-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="font-semibold text-[#8C6D58] block mb-1">Order Status</label>
                      <select
                        value={orderFilterStatus}
                        onChange={(e) => setOrderFilterStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl font-semibold"
                      >
                        <option value="All">All Statuses</option>
                        <option value="New">New</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Payment Status Filter */}
                    <div>
                      <label className="font-semibold text-[#8C6D58] block mb-1">Payment Status</label>
                      <select
                        value={orderFilterPayment}
                        onChange={(e) => setOrderFilterPayment(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl font-semibold"
                      >
                        <option value="All">All Payments</option>
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    {/* Date From */}
                    <div>
                      <label className="font-semibold text-[#8C6D58] block mb-1">From Date</label>
                      <input
                        type="date"
                        value={orderDateFrom}
                        onChange={(e) => setOrderDateFrom(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl"
                      />
                    </div>

                    {/* Date To */}
                    <div>
                      <label className="font-semibold text-[#8C6D58] block mb-1">To Date</label>
                      <input
                        type="date"
                        value={orderDateTo}
                        onChange={(e) => setOrderDateTo(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Orders Table */}
                  <div className="bg-white rounded-3xl border border-[#EAE2D5] overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAF7F2] text-[#8C6D58] uppercase tracking-wider border-b border-[#EAE2D5]">
                          <tr>
                            <th className="p-3">Order Number</th>
                            <th className="p-3">Customer</th>
                            <th className="p-3">Phone</th>
                            <th className="p-3">Items Summary</th>
                            <th className="p-3">Total</th>
                            <th className="p-3">Payment</th>
                            <th className="p-3">Payment Status</th>
                            <th className="p-3">Order Status</th>
                            <th className="p-3">Created At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F2ECE1]">
                          {filteredOrders.length > 0 ? (
                            filteredOrders.map(ord => (
                              <tr 
                                key={ord.id}
                                onClick={() => setSelectedOrder(ord)}
                                className="hover:bg-[#FAF7F2] cursor-pointer transition-colors"
                              >
                                <td className="p-3 font-mono font-bold text-[#C2410C]">
                                  {ord.order_number}
                                </td>
                                <td className="p-3 font-semibold text-[#2A170A]">
                                  {ord.customer_name}
                                </td>
                                <td className="p-3 font-mono text-[#5A4132]">
                                  {ord.customer_phone}
                                </td>
                                <td className="p-3 max-w-xs truncate">
                                  {ord.items.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}
                                </td>
                                <td className="p-3 font-mono font-bold text-[#2A170A]">
                                  Rs. {ord.total.toLocaleString()}
                                </td>
                                <td className="p-3 uppercase font-medium">
                                  {ord.payment_method}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    ord.payment_status === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                                    ord.payment_status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-amber-100 text-amber-900'
                                  }`}>
                                    {ord.payment_status}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    ord.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                                    ord.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                    ord.status === 'Preparing' ? 'bg-purple-100 text-purple-800' :
                                    'bg-amber-100 text-amber-900'
                                  }`}>
                                    {ord.status}
                                  </span>
                                </td>
                                <td className="p-3 text-[#8C6D58]">
                                  {new Date(ord.created_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={9} className="p-8 text-center text-[#8C6D58]">
                                No orders matching the selected filters.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* PART D: PRODUCT MANAGEMENT TAB */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-[#2A170A]">Sweets & Mithai Inventory</h3>
                      <p className="text-xs text-[#8C6D58]">
                        Weights in grams, low-stock thresholds, kilogram/piece selling modes, and live toggles.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct({
                          name: '',
                          category: 'Mithai',
                          sell_mode: 'kg',
                          price_per_kg: 1600,
                          stock_grams: 5000,
                          low_stock_threshold_grams: 500,
                          is_available: true,
                          is_featured: false
                        });
                        setIsProductModalOpen(true);
                      }}
                      className="px-4 py-2.5 bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all self-start"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Sweet</span>
                    </button>
                  </div>

                  {/* Product Table */}
                  <div className="bg-white rounded-3xl border border-[#EAE2D5] overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAF7F2] text-[#8C6D58] uppercase tracking-wider border-b border-[#EAE2D5]">
                          <tr>
                            <th className="p-3">Thumbnail</th>
                            <th className="p-3">Sweet Name</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Sell Mode</th>
                            <th className="p-3">Price</th>
                            <th className="p-3">Stock (g)</th>
                            <th className="p-3">Available</th>
                            <th className="p-3">Featured</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F2ECE1]">
                          {products.map(prod => {
                            const isLow = prod.stock_grams <= (prod.low_stock_threshold_grams || 500);
                            return (
                              <tr key={prod.id} className="hover:bg-[#FAF7F2]/50">
                                <td className="p-3">
                                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#D9C8B4] shrink-0">
                                    {prod.image ? (
                                      <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[10px] text-[#C2410C] font-bold p-1 text-center">
                                        Mithai
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="font-bold text-[#2A170A]">{prod.name}</div>
                                  {prod.name_ur && <span className="text-[11px] text-[#8C6D58] block">{prod.name_ur}</span>}
                                </td>
                                <td className="p-3 font-medium">{prod.category}</td>
                                <td className="p-3 uppercase font-mono font-semibold">{prod.sell_mode}</td>
                                <td className="p-3 font-mono">
                                  {prod.sell_mode === 'piece' ? (
                                    <span>Rs. {prod.price_per_piece} / pc</span>
                                  ) : prod.sell_mode === 'both' ? (
                                    <div>
                                      <span>Rs. {prod.price_per_kg} / kg</span>
                                      <span className="text-[10px] text-[#8C6D58] block">Rs. {prod.price_per_piece} / pc</span>
                                    </div>
                                  ) : (
                                    <span>Rs. {prod.price_per_kg || prod.price_per_unit} / kg</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`font-mono font-bold ${isLow ? 'text-red-600' : 'text-[#2A170A]'}`}>
                                      {prod.stock_grams}g
                                    </span>
                                    {isLow && (
                                      <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                                        LOW
                                      </span>
                                    )}
                                  </div>
                                  {/* Quick +/- buttons */}
                                  <div className="flex items-center gap-1 mt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleQuickStockAdjust(prod, -500, 'Sale / Waste')}
                                      className="px-1.5 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-[10px] font-bold"
                                      title="Deduct 500g"
                                    >
                                      -500g
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleQuickStockAdjust(prod, 1000, 'Batch Restock')}
                                      className="px-1.5 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-[10px] font-bold"
                                      title="Add 1000g"
                                    >
                                      +1kg
                                    </button>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <input
                                    type="checkbox"
                                    checked={prod.is_available}
                                    onChange={() => handleToggleProduct(prod, 'is_available')}
                                    className="rounded text-[#C2410C] focus:ring-[#C2410C] cursor-pointer"
                                  />
                                </td>
                                <td className="p-3">
                                  <input
                                    type="checkbox"
                                    checked={prod.is_featured}
                                    onChange={() => handleToggleProduct(prod, 'is_featured')}
                                    className="rounded text-[#C2410C] focus:ring-[#C2410C] cursor-pointer"
                                  />
                                </td>
                                <td className="p-3 text-right space-x-1.5">
                                  <button
                                    onClick={() => {
                                      setEditingProduct(prod);
                                      setIsProductModalOpen(true);
                                    }}
                                    className="p-1.5 text-[#5A4132] hover:bg-[#FAF7F2] rounded-lg"
                                    title="Edit Sweet"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(prod)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                    title="Delete Sweet"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* PART E: EVENT INQUIRIES TAB */}
              {activeTab === 'inquiries' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-[#2A170A]">Bespoke Event Catering Inquiries</h3>
                      <p className="text-xs text-[#8C6D58]">
                        Review bulk requests, prepare cost quotations, and dispatch proposals directly to customer WhatsApp.
                      </p>
                    </div>

                    <select
                      value={inquiryStatusFilter}
                      onChange={(e) => setInquiryStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-white rounded-xl border border-[#D9C8B4] text-xs font-semibold self-start"
                    >
                      <option value="All">All Inquiries</option>
                      <option value="New">New</option>
                      <option value="Quoted">Quoted</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredInquiries.length > 0 ? (
                      filteredInquiries.map(inq => (
                        <div
                          key={inq.id}
                          onClick={() => setSelectedInquiry(inq)}
                          className="bg-white p-5 rounded-3xl border border-[#EAE2D5] hover:border-[#D9C8B4] hover:shadow-md transition-all cursor-pointer space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-[#2A170A] text-sm">{inq.name}</h4>
                                <span className="text-xs text-[#8C6D58] font-mono">{inq.phone}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                inq.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' :
                                inq.status === 'Quoted' ? 'bg-blue-100 text-blue-800' :
                                inq.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-amber-100 text-amber-900'
                              }`}>
                                {inq.status}
                              </span>
                            </div>

                            <div className="text-xs text-[#5A4132] space-y-1">
                              <div>Occasion: <strong>{inq.event_type}</strong></div>
                              <div>Date: <strong>{inq.event_date}</strong></div>
                              <div>Estimated Volume: <strong>{inq.estimated_boxes} Boxes</strong></div>
                            </div>

                            {inq.quote_amount && (
                              <div className="p-2 bg-[#FAF7F2] rounded-xl text-xs flex justify-between font-bold">
                                <span>Quoted:</span>
                                <span className="text-[#C2410C]">Rs. {inq.quote_amount.toLocaleString()}</span>
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-[#F2ECE1] flex justify-between items-center text-xs">
                            <span className="text-[#8C6D58]">{new Date(inq.created_at).toLocaleDateString()}</span>
                            <span className="text-[#C2410C] font-semibold">Open Proposal →</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 p-8 text-center text-xs text-[#8C6D58] bg-white rounded-3xl border border-[#EAE2D5]">
                        No catering inquiries found for the selected filter.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PART F: CONTACT MESSAGES TAB */}
              {activeTab === 'messages' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-[#2A170A]">Customer Queries & Feedback</h3>
                    <p className="text-xs text-[#8C6D58]">
                      Messages received from the storefront contact form. Open to read and reply on WhatsApp.
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl border border-[#EAE2D5] overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF7F2] text-[#8C6D58] uppercase tracking-wider border-b border-[#EAE2D5]">
                        <tr>
                          <th className="p-3">Status</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Phone</th>
                          <th className="p-3">Subject</th>
                          <th className="p-3">Received At</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F2ECE1]">
                        {messages.length > 0 ? (
                          messages.map(msg => {
                            const isUnread = msg.is_read === false || msg.status === 'Unread';
                            return (
                              <tr
                                key={msg.id}
                                onClick={async () => {
                                  setSelectedMessage(msg);
                                  if (isUnread) {
                                    await api.markMessageAsRead(msg.id);
                                    loadAdminData();
                                  }
                                }}
                                className={`hover:bg-[#FAF7F2] cursor-pointer transition-colors ${
                                  isUnread ? 'bg-amber-50/40 font-bold' : ''
                                }`}
                              >
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase ${
                                    isUnread ? 'bg-amber-500 text-white font-bold' : 'bg-neutral-100 text-neutral-600 font-medium'
                                  }`}>
                                    {isUnread ? 'Unread' : 'Read'}
                                  </span>
                                </td>
                                <td className="p-3 text-[#2A170A]">{msg.name}</td>
                                <td className="p-3 font-mono">{msg.phone}</td>
                                <td className="p-3 text-[#2A170A]">{msg.subject}</td>
                                <td className="p-3 text-[#8C6D58]">{new Date(msg.created_at).toLocaleString()}</td>
                                <td className="p-3 text-right">
                                  <span className="text-[#C2410C] font-semibold hover:underline">Read Message →</span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-[#8C6D58]">
                              No messages received yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PART G: REVIEWS TAB */}
              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-[#2A170A]">Review Moderation</h3>
                    <p className="text-xs text-[#8C6D58]">
                      Verify genuine reviews before they become visible on the public storefront.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {reviews.length > 0 ? (
                      reviews.map(rev => (
                        <div key={rev.id} className="p-5 bg-white rounded-3xl border border-[#EAE2D5] flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs shadow-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#2A170A] text-sm">{rev.customer_name}</span>
                              <span className="text-[#8C6D58]">({rev.city || 'Verified Buyer'})</span>
                              <span className="text-amber-500 font-bold">★ {rev.rating} / 5</span>
                            </div>
                            <p className="text-[#4A3223] italic">"{rev.comment}"</p>
                            <span className="text-[10px] text-[#8C6D58] block">
                              Submitted {new Date(rev.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <button
                              type="button"
                              onClick={async () => {
                                await api.updateReviewApproval(rev.id, !rev.is_approved);
                                loadAdminData();
                              }}
                              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                                rev.is_approved 
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                                  : 'bg-[#C2410C] hover:bg-[#9A3412] text-white shadow-xs'
                              }`}
                            >
                              {rev.is_approved ? 'Approved (Click to Revoke)' : 'Approve for Storefront'}
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm('Delete this review permanently?')) {
                                  await api.deleteReview(rev.id);
                                  loadAdminData();
                                }
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-xl cursor-pointer"
                              title="Delete Review"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-xs text-[#8C6D58] bg-white rounded-3xl border border-[#EAE2D5]">
                        No customer reviews submitted yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PART H: SETTINGS TAB */}
              {activeTab === 'settings' && (
                <SettingsTab
                  settings={settings}
                  onRefresh={onRefreshSettings}
                />
              )}

              {/* PART I: KITCHEN VIEW TAB */}
              {activeTab === 'kitchen' && (
                <KitchenView
                  orders={orders}
                  onRefresh={loadAdminData}
                />
              )}

              {/* TAB: COUPONS */}
              {activeTab === 'coupons' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-[#EAE2D5] space-y-4">
                    <h4 className="text-sm font-serif font-bold text-[#2A170A]">Create Promotional Coupon</h4>
                    <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="font-semibold text-[#8C6D58] block mb-1">Coupon Code *</label>
                        <input
                          type="text"
                          required
                          value={newCouponCode}
                          onChange={(e) => setNewCouponCode(e.target.value)}
                          placeholder="SWEET2026"
                          className="w-full px-3 py-2 uppercase bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-[#8C6D58] block mb-1">Discount Type</label>
                        <select
                          value={newCouponType}
                          onChange={(e) => setNewCouponType(e.target.value as any)}
                          className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl font-semibold"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount (Rs)</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-semibold text-[#8C6D58] block mb-1">Value</label>
                        <input
                          type="number"
                          required
                          value={newCouponValue}
                          onChange={(e) => setNewCouponValue(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl font-mono"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="submit"
                          className="w-full py-2 bg-[#2A170A] hover:bg-[#C2410C] text-white font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
                        >
                          Create Coupon
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="bg-white rounded-3xl border border-[#EAE2D5] overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF7F2] text-[#8C6D58] uppercase border-b border-[#EAE2D5]">
                        <tr>
                          <th className="p-3">Code</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Discount</th>
                          <th className="p-3">Min Order</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F2ECE1]">
                        {coupons.map(c => (
                          <tr key={c.code}>
                            <td className="p-3 font-mono font-bold text-[#C2410C]">{c.code}</td>
                            <td className="p-3 capitalize">{c.discount_type}</td>
                            <td className="p-3 font-bold">
                              {c.discount_type === 'percentage' ? `${c.discount_value}%` : `Rs. ${c.discount_value}`}
                            </td>
                            <td className="p-3 font-mono">Rs. {c.min_order_amount?.toLocaleString() || 0}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                Active
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={async () => {
                                  await api.deleteCoupon(c.code);
                                  loadAdminData();
                                }}
                                className="text-red-600 hover:underline cursor-pointer"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB: GIFT BOXES */}
              {activeTab === 'gift_boxes' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-serif font-bold text-[#2A170A]">Royal Gift Packaging Boxes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {giftBoxes.map(box => (
                      <div key={box.id} className="bg-white p-5 rounded-3xl border border-[#EAE2D5] space-y-3 shadow-xs">
                        {box.image_path ? (
                          <img src={box.image_path} alt={box.name_en} className="w-full h-36 object-cover rounded-2xl" />
                        ) : (
                          <div className="w-full h-36 rounded-2xl flex items-center justify-center bg-[#FFF8EE] border border-[#F0DCC4]">
                            <span className="text-[#C2410C] font-semibold text-xs text-center px-2">{box.name_en}</span>
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-serif font-bold text-[#2A170A]">{box.name_en}</h4>
                          <span className="text-xs text-[#8C6D58]">{box.name_ur}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-[#F2ECE1] text-xs">
                          <span className="text-[#8C6D58]">Capacity: {box.size_grams}g</span>
                          <span className="font-bold text-[#C2410C]">Rs. {box.box_price.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: SQL SCHEMA SETUP REFERENCE */}
              {activeTab === 'sql' && (
                <div className="bg-white p-6 rounded-3xl border border-[#EAE2D5] space-y-4 shadow-xs">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-serif font-bold text-[#2A170A]">Supabase Schema Upgrade SQL</h3>
                      <p className="text-xs text-[#8C6D58]">
                        Exact SQL scripts with RLS security policies, <code>is_admin()</code> function, and storage policies.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `-- View /supabase_schema.sql for complete definitions including is_admin() and place_order RPC.`
                        );
                        setCopiedSql(true);
                        setTimeout(() => setCopiedSql(false), 2000);
                      }}
                      className="px-4 py-2 bg-[#2A170A] hover:bg-[#C2410C] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedSql ? 'Copied' : 'Copy SQL Notes'}</span>
                    </button>
                  </div>
                  <div className="text-xs text-[#5A4132] bg-[#FAF7F2] p-4 rounded-2xl border border-[#D9C8B4] font-mono leading-relaxed overflow-x-auto">
                    {`-- To enable is_admin() for your user account:
INSERT INTO user_roles (user_id, role)
VALUES ('<YOUR_AUTH_USER_UUID>', 'owner')
ON CONFLICT (user_id) DO UPDATE SET role = 'owner';`}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal (Part C) */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onRefresh={loadAdminData}
          shopName={settings?.shop_name || 'Mithas Sweets'}
          shopPhone={settings?.phone || '03027628552'}
        />
      )}

      {/* Product Form Modal (Part D) */}
      {isProductModalOpen && (
        <ProductFormModal
          product={editingProduct}
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
          onSaved={() => {
            onRefreshProducts();
            loadAdminData();
          }}
          categories={['Mithai', 'Barfi', 'Laddu', 'Halwa', 'Dry Fruit Sweets', 'Cakes']}
        />
      )}

      {/* Event Inquiry Modal (Part E) */}
      {selectedInquiry && (
        <InquiryDetailModal
          inquiry={selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          onRefresh={loadAdminData}
          shopWhatsapp={settings?.whatsapp || '923027628552'}
        />
      )}

      {/* Contact Message Modal (Part F) */}
      {selectedMessage && (
        <MessageDetailModal
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
          shopWhatsapp={settings?.whatsapp || '923027628552'}
        />
      )}
    </div>
  );
};
