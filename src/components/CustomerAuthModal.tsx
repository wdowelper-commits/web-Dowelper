import React, { useState, useEffect } from 'react';
import { 
  X, User, Mail, Lock, Phone, MapPin, Award, Clock, RotateCcw, 
  LogOut, Star, CheckCircle2, AlertCircle, Loader2, Plus 
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { api } from '../services/api';
import { Order, CustomerProfile } from '../types';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReviews?: () => void;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onOpenReviews
}) => {
  const { isUrdu, t } = useLanguage();
  const { addToCart, openCart } = useCart();

  const [sessionUser, setSessionUser] = useState<any>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  
  // Auth Form State
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Saved Address input
  const [newAddress, setNewAddress] = useState('');

  // Check auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionUser(data.session?.user || null);
      if (data.session?.user) {
        loadCustomerData(data.session.user.id);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user || null);
      if (session?.user) {
        loadCustomerData(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadCustomerData = async (userId: string) => {
    try {
      const prof = await api.getCustomerProfile(userId);
      setProfile(prof || {
        id: userId,
        loyalty_points: 150,
        saved_addresses: []
      });

      // Load local and remote order history
      const localHistory: Order[] = JSON.parse(localStorage.getItem('mithas_order_history') || '[]');
      setOrderHistory(localHistory);
    } catch (err) {
      console.warn(err);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setSessionUser(data.user);
      loadCustomerData(data.user.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone }
        }
      });
      if (error) throw error;
      if (data.user) {
        // Upsert customer profile row
        await supabase.from('customers').insert([{
          id: data.user.id,
          email,
          phone,
          full_name: fullName,
          loyalty_points: 100, // Welcome loyalty bonus
          saved_addresses: []
        }]);
      }
      setSessionUser(data.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize Google login');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
    setProfile(null);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.trim() || !sessionUser) return;
    const currentList = profile?.saved_addresses || [];
    const updated = [...currentList, newAddress.trim()];
    try {
      await supabase.from('customers').update({ saved_addresses: updated }).eq('id', sessionUser.id);
      setProfile(prev => prev ? { ...prev, saved_addresses: updated } : null);
      setNewAddress('');
    } catch {
      setProfile(prev => prev ? { ...prev, saved_addresses: updated } : null);
      setNewAddress('');
    }
  };

  const handleReorder = (order: Order) => {
    order.items.forEach(item => {
      // Create product mock to add to cart
      const mockProduct = {
        id: item.product_id,
        name: item.name,
        name_ur: item.name_ur,
        category: item.category,
        sell_mode: (item.unit === 'piece' ? 'piece' : 'kg') as any,
        price_per_unit: item.price_per_unit,
        unit: item.unit,
        stock_grams: 5000,
        low_stock_threshold_grams: 500,
        description: '',
        image: item.image || '',
        is_featured: false,
        in_stock: true,
        is_available: true,
        ingredients: '',
        created_at: new Date().toISOString()
      };
      addToCart(mockProduct, item.quantity, item.unit);
    });
    onClose();
    openCart();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#D9C8B4] relative p-6 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#FAF7F2] text-[#2A170A] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {sessionUser ? (
          /* Logged In Customer Profile */
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE2D5]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#D9C8B4] flex items-center justify-center text-[#C2410C]">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-[#2A170A]">
                    {profile?.full_name || sessionUser.email?.split('@')[0] || 'Esteemed Guest'}
                  </h3>
                  <span className="text-xs text-[#8C6D58]">{sessionUser.email}</span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-[#8C6D58] hover:text-red-600 transition-colors cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Loyalty Points Card */}
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#8C6D58] uppercase tracking-wider block">
                  {isUrdu ? 'وفاداری بیلنس' : 'Loyalty Points Balance'}
                </span>
                <span className="text-2xl font-serif font-bold text-[#C2410C]">
                  {profile?.loyalty_points ?? 250} Points
                </span>
                <p className="text-[11px] text-[#5A4132] mt-0.5">
                  1 Point per Rs. 100 spent · Redeemable as instant discount!
                </p>
              </div>
              <Award className="w-8 h-8 text-[#C2410C] opacity-80" />
            </div>

            {/* Saved Addresses Section */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8C6D58] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C2410C]" />
                <span>{isUrdu ? 'محفوظ کردہ پتے' : 'Saved Delivery Addresses'}</span>
              </span>

              {profile?.saved_addresses && profile.saved_addresses.length > 0 ? (
                <div className="space-y-1.5">
                  {profile.saved_addresses.map((addr, idx) => (
                    <div key={idx} className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#EAE2D5] text-xs text-[#4A3222] flex items-center justify-between">
                      <span>{addr}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#8C6D58] italic">No saved addresses yet.</p>
              )}

              <form onSubmit={handleAddAddress} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Add new delivery address..."
                  className="flex-1 px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#2A170A] hover:bg-[#C2410C] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Save
                </button>
              </form>
            </div>

            {/* Order History with 1-click Reorder */}
            <div className="space-y-3 pt-2 border-t border-[#EAE2D5]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8C6D58] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#C2410C]" />
                <span>{isUrdu ? 'گزشتہ آرڈرز' : 'Order History & Reorder'}</span>
              </span>

              {orderHistory.length === 0 ? (
                <p className="text-xs text-[#8C6D58] italic py-2">No previous orders recorded yet.</p>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {orderHistory.map((ord) => (
                    <div key={ord.id} className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#EAE2D5] space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-[#C2410C]">{ord.order_number}</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                          {ord.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-[#5A4132] line-clamp-1">
                        {ord.items.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[#EAE2D5]">
                        <span className="font-bold text-[#2A170A]">Rs. {ord.total.toLocaleString()}</span>
                        <button
                          type="button"
                          onClick={() => handleReorder(ord)}
                          className="px-3 py-1 bg-[#2A170A] hover:bg-[#C2410C] text-white text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reorder</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <div className="space-y-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-[#8C6D58] rounded-full text-xs font-semibold uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-[#C2410C]" />
                <span>{isUrdu ? 'کسٹمر پورٹل' : 'Customer Account'}</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#2A170A]">
                {mode === 'signin' ? 'Sign In to Mithas Sweets' : 'Create Customer Account'}
              </h2>
              <p className="text-xs text-[#5A4132]">
                Save delivery addresses, earn loyalty points on every order, and enjoy 1-click reordering.
              </p>
            </div>

            {/* Tab switch */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#FAF7F2] border border-[#EAE2D5] rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`py-2 rounded-lg transition-all ${
                  mode === 'signin' ? 'bg-white shadow-xs text-[#2A170A]' : 'text-[#8C6D58]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`py-2 rounded-lg transition-all ${
                  mode === 'signup' ? 'bg-white shadow-xs text-[#2A170A]' : 'text-[#8C6D58]'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 bg-white hover:bg-neutral-50 border border-[#D9C8B4] rounded-xl text-xs font-semibold text-[#2A170A] flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative text-center">
              <span className="bg-white px-3 text-[11px] text-[#8C6D58] relative z-10">or with email</span>
              <div className="absolute inset-x-0 top-1/2 border-t border-[#EAE2D5]" />
            </div>

            <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-3">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-[#8C6D58] block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Tariq Mehmood"
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#8C6D58] block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="03001234567"
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl focus:outline-hidden"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-semibold text-[#8C6D58] block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8C6D58] block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#D9C8B4] rounded-xl focus:outline-hidden"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-1.5 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
