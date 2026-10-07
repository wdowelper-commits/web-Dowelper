import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { ProductQuickView } from './components/ProductQuickView';
import { AiConciergeModal } from './components/AiConciergeModal';
import { CartDrawer } from './components/CartDrawer';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { EventsSection } from './components/EventsSection';
import { AboutSection } from './components/AboutSection';
import { CustomerReviewsSection } from './components/CustomerReviewsSection';
import { ContactSection } from './components/ContactSection';
import { AdminPortal } from './components/AdminPortal';
import { Footer } from './components/Footer';
import { Product, CartItem, Order, ShopSettings } from './types';
import { api } from './services/api';
import { 
  Search, Filter, Sparkles, ArrowRight, Star, Heart, Award, 
  CheckCircle2, RefreshCw, AlertCircle 
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'home' | 'menu' | 'events' | 'about' | 'contact'>('home');

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);

  // Menu filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  // Shop settings
  const [settings, setSettings] = useState<ShopSettings | undefined>(undefined);

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('mithas_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isAiConciergeOpen, setIsAiConciergeOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);
  const [trackerInitialNumber, setTrackerInitialNumber] = useState<string | undefined>(undefined);

  // Confirmed order state
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [confirmedWhatsAppUrl, setConfirmedWhatsAppUrl] = useState<string | undefined>(undefined);

  // Bulk inquiry transfer from AI concierge
  const [inquiryInitialData, setInquiryInitialData] = useState<{ occasion: string; boxes: number; notes: string } | null>(null);

  // Save cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('mithas_cart', JSON.stringify(cartItems));
    } catch (err) {
      console.error('Failed to save cart to local storage', err);
    }
  }, [cartItems]);

  // Load products & settings on mount
  const loadInitialData = async () => {
    setLoadingProducts(true);
    setProductError(null);
    try {
      const [prods, sett] = await Promise.all([
        api.getProducts(),
        api.getSettings()
      ]);
      setProducts(prods);
      setSettings(sett);
    } catch (err: any) {
      console.error(err);
      setProductError('Failed to load menu. Please refresh or try again.');
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Cart Actions
  const handleAddToCart = (product: Product, quantity: number) => {
    const itemTotal = Math.round(product.price_per_unit * quantity);
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.product_id === product.id && item.unit === product.unit);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          total: Math.round(product.price_per_unit * newQty)
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            product_id: product.id,
            name: product.name,
            category: product.category,
            price_per_unit: product.price_per_unit,
            unit: product.unit,
            quantity,
            total: itemTotal,
            image: product.image
          }
        ];
      }
    });
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const newQty = Math.max(0.5, item.quantity + delta);
          return {
            ...item,
            quantity: newQty,
            total: Math.round(item.price_per_unit * newQty)
          };
        }
        return item;
      });
    });
  };

  const handleRemoveCartItem = (itemId: string) => {
    setCartItems(prev => prev.filter(i => i.id !== itemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleOrderSuccess = (order: Order, whatsappUrl: string) => {
    setIsCartOpen(false);
    setConfirmedOrder(order);
    setConfirmedWhatsAppUrl(whatsappUrl);
    handleClearCart();
  };

  // Filtered & sorted products for Menu
  const categories = ['All', 'Barfi', 'Laddu', 'Halwa', 'Mithai', 'Dry Fruit Sweets', 'Cakes'];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.ingredients && p.ingredients.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price_per_unit - b.price_per_unit;
    if (sortBy === 'price-desc') return b.price_per_unit - a.price_per_unit;
    return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
  });

  const featuredSweets = products.filter(p => p.is_featured).slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2A170A]">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab: string) => setActiveTab(tab as any)}
        cartCount={cartItems.reduce((acc, i) => acc + (i.quantity >= 1 ? Math.floor(i.quantity) : 1), 0)}
        openCart={() => setIsCartOpen(true)}
        openAiConcierge={() => setIsAiConciergeOpen(true)}
        openAdmin={() => setIsAdminOpen(true)}
        openOrderTracker={() => {
          setTrackerInitialNumber(undefined);
          setIsOrderTrackerOpen(true);
        }}
        settings={settings}
      />

      {/* Main Page Routing */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <div>
            {/* Hero Section */}
            <Hero
              onExploreMenu={() => {
                setActiveTab('menu');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onBulkOrders={() => {
                setActiveTab('events');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenAiPlanner={() => setIsAiConciergeOpen(true)}
              settings={settings}
            />

            {/* Featured Sweets Showcase */}
            <section className="py-16 md:py-24 bg-white border-b border-[#EAE2D5]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div className="space-y-2">
                    <span className="text-xs uppercase tracking-widest text-[#C2410C] font-bold">
                      Signature Confections
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2A170A] tracking-tight">
                      Crafted Fresh for Today's Dawat
                    </h2>
                    <p className="text-xs sm:text-sm text-[#5A4132] max-w-xl">
                      Each batch is prepared in morning kadhais with pure desi ghee and hand-sorted nuts. Melt-in-your-mouth texture with zero artificial essences.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('menu');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#C2410C] hover:text-[#9A3412] hover:underline cursor-pointer whitespace-nowrap"
                  >
                    <span>View All {products.length} Sweets</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {loadingProducts ? (
                  <div className="py-12 flex justify-center items-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#C2410C]" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {featuredSweets.map((prod) => (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        onAddToCart={handleAddToCart}
                        onQuickView={setQuickViewProduct}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* AI Sommelier Banner Prompt */}
            <section className="py-14 bg-[#FAF7F2] border-b border-[#EAE2D5]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-gradient-to-r from-[#2A170A] to-[#452614] rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
                  <div className="absolute right-0 top-0 -mt-12 -mr-12 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="space-y-3 max-w-2xl relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 border border-amber-300/30 rounded-full text-xs font-semibold text-amber-200">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Thinking Mode · Gemini 3.1 Pro Intelligence</span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-serif font-bold text-amber-50">
                      Unsure How Much Mithai to Order for Your Event?
                    </h3>

                    <p className="text-xs sm:text-sm text-amber-100/80 leading-relaxed">
                      Consult our AI Royal Sweet Sommelier. Enter your guest count, occasion, and dietary preferences to receive precise sweet portion calculations, luxury gift box assortments, and budget breakdowns.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsAiConciergeOpen(true)}
                    className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-[#2A170A] text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98 shrink-0 relative z-10"
                  >
                    <Sparkles className="w-4 h-4 text-[#2A170A]" />
                    <span>Open AI Sweet Sommelier</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Real Customer Reviews Section (Only reviews submitted through site and approved by admin) */}
            <CustomerReviewsSection />
          </div>
        )}

        {/* MENU VIEW */}
        {activeTab === 'menu' && (
          <div className="py-12 md:py-20 bg-[#FAF7F2]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
              {/* Header */}
              <div className="space-y-3">
                <span className="text-xs uppercase tracking-widest text-[#C2410C] font-bold">
                  The Royal Catalog
                </span>
                <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#2A170A]">
                  Fresh Handcrafted Sweets Menu
                </h1>
                <p className="text-xs sm:text-sm text-[#5A4132] max-w-2xl leading-relaxed">
                  Select your desired portions in kg or pieces. All sweets are freshly packaged in airtight food-grade boxes to preserve maximum crispness, aroma, and delicate textures.
                </p>
              </div>

              {/* Filters & Search Control Bar */}
              <div className="bg-white p-4 sm:p-6 rounded-3xl border border-[#E8DFC9] shadow-xs space-y-4">
                {/* Search & Sort Row */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C6D58]" />
                    <input
                      type="text"
                      placeholder="Search barfi, gulab jamun, halwa, dry fruits, cakes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D9C8B4] bg-[#FAF7F2] focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <span className="text-xs text-[#8C6D58] shrink-0 font-medium">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="text-xs px-3 py-2.5 rounded-xl border border-[#D9C8B4] bg-white text-[#2A170A] focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                    >
                      <option value="featured">Featured Classics</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                    </select>
                  </div>
                </div>

                {/* Categories Segmented Control Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-[#2A170A] text-white shadow-xs'
                          : 'bg-[#FAF7F2] text-[#5A4132] hover:bg-[#F2ECE1] border border-[#EAE2D5]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Grid */}
              {loadingProducts ? (
                <div className="py-20 flex justify-center items-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#C2410C]" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-[#EAE2D5] space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#FAF7F2] text-[#8C6D58] mx-auto flex items-center justify-center">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-[#2A170A]">No sweets matched your search</h3>
                  <p className="text-xs text-[#6B5544]">
                    Try searching for "barfi", "laddu", "kaju", or clear the current category filter.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-[#C2410C] hover:underline"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      onAddToCart={handleAddToCart}
                      onQuickView={setQuickViewProduct}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* EVENTS VIEW */}
        {activeTab === 'events' && (
          <EventsSection
            initialData={inquiryInitialData}
            whatsappNumber={settings?.whatsapp}
          />
        )}

        {/* ABOUT VIEW */}
        {activeTab === 'about' && (
          <AboutSection settings={settings} />
        )}

        {/* CONTACT VIEW */}
        {activeTab === 'contact' && (
          <ContactSection settings={settings} />
        )}
      </main>

      {/* Global Footer */}
      <Footer
        onNavigate={(tab: string) => {
          setActiveTab(tab as any);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenOrderTracker={() => {
          setTrackerInitialNumber(undefined);
          setIsOrderTrackerOpen(true);
        }}
        settings={settings}
      />

      {/* Cart & Checkout Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onOrderSuccess={handleOrderSuccess}
        settings={settings}
      />

      {/* Product Quick View Modal */}
      <ProductQuickView
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* AI Sweet Concierge Modal (Gemini 3.1 Pro High Thinking) */}
      <AiConciergeModal
        isOpen={isAiConciergeOpen}
        onClose={() => setIsAiConciergeOpen(false)}
        whatsappNumber={settings?.whatsapp}
        onSelectEventInquiry={(data) => {
          setInquiryInitialData(data);
          setActiveTab('events');
          setTimeout(() => {
            document.getElementById('inquiry-form')?.scrollIntoView({ behavior: 'smooth' });
          }, 200);
        }}
      />

      {/* Order Confirmation Screen Modal */}
      <OrderConfirmationModal
        order={confirmedOrder}
        whatsappUrl={confirmedWhatsAppUrl}
        onClose={() => setConfirmedOrder(null)}
        onTrackOrder={(orderNumber) => {
          setTrackerInitialNumber(orderNumber);
          setIsOrderTrackerOpen(true);
        }}
      />

      {/* Order Tracking Modal */}
      <OrderTrackerModal
        isOpen={isOrderTrackerOpen}
        onClose={() => setIsOrderTrackerOpen(false)}
        initialOrderNumber={trackerInitialNumber}
      />

      {/* Admin Management Portal */}
      <AdminPortal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        onRefreshProducts={loadInitialData}
        settings={settings}
        onRefreshSettings={loadInitialData}
      />
    </div>
  );
}
