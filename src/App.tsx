import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { ProductQuickView } from './components/ProductQuickView';
import { GiftBoxesSection } from './components/GiftBoxesSection';
import { CartDrawer } from './components/CartDrawer';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { EventsSection } from './components/EventsSection';
import { AboutSection } from './components/AboutSection';
import { CustomerReviewsSection } from './components/CustomerReviewsSection';
import { ContactSection } from './components/ContactSection';
import { AdminPortal } from './components/AdminPortal';
import { Footer } from './components/Footer';
import { Product, Order, ShopSettings } from './types';
import { api } from './services/api';
import { CartProvider, useCart } from './context/CartContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { 
  Search, ArrowRight, RefreshCw 
} from 'lucide-react';

function AppContent() {
  const { isUrdu, t } = useLanguage();
  const { addToCart } = useCart();

  // Navigation
  const [activeTab, setActiveTab] = useState<'home' | 'menu' | 'gift_boxes' | 'events' | 'about' | 'contact'>('home');

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

  // Modals state
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);
  const [isCustomerAuthOpen, setIsCustomerAuthOpen] = useState(false);
  const [trackerInitialNumber, setTrackerInitialNumber] = useState<string | undefined>(undefined);

  // Confirmed order state
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [confirmedWhatsAppUrl, setConfirmedWhatsAppUrl] = useState<string | undefined>(undefined);

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

    // Check if tracking order in URL hash
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#track-')) {
        const orderNum = decodeURIComponent(hash.replace('#track-', ''));
        if (orderNum) {
          setTrackerInitialNumber(orderNum);
          setIsOrderTrackerOpen(true);
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleOrderSuccess = (order: Order, whatsappUrl: string) => {
    setConfirmedOrder(order);
    setConfirmedWhatsAppUrl(whatsappUrl);
  };

  // Filtered & sorted products for Menu
  const categories = ['All', 'Barfi', 'Laddu', 'Halwa', 'Mithai', 'Dry Fruit Sweets'];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.name_ur && p.name_ur.includes(searchQuery)) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.ingredients && p.ingredients.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    const priceA = a.price_per_kg || a.price_per_unit;
    const priceB = b.price_per_kg || b.price_per_unit;
    if (sortBy === 'price-asc') return priceA - priceB;
    if (sortBy === 'price-desc') return priceB - priceA;
    return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
  });

  const featuredSweets = products.filter(p => p.is_featured).slice(0, 4);

  return (
    <div className={`min-h-screen flex flex-col bg-[#FAF7F2] text-[#2A170A] ${isUrdu ? 'font-urdu' : ''}`}>
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab: string) => setActiveTab(tab as any)}
        openAdmin={() => setIsAdminOpen(true)}
        openOrderTracker={() => {
          setTrackerInitialNumber(undefined);
          setIsOrderTrackerOpen(true);
        }}
        openCustomerAuth={() => setIsCustomerAuthOpen(true)}
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
              settings={settings}
            />

            {/* Featured Sweets Showcase */}
            <section className="py-16 md:py-24 bg-white border-b border-[#EAE2D5]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div className="space-y-2">
                    <span className="text-xs uppercase tracking-widest text-[#C2410C] font-bold">
                      {isUrdu ? 'خاص شاہی سوغاتیں' : 'Signature Confections'}
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2A170A] tracking-tight">
                      {isUrdu ? 'آج کی تقریب کے لیے تازہ تیار کردہ' : "Crafted Fresh for Today's Dawat"}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#5A4132] max-w-xl">
                      {isUrdu 
                        ? 'ہر صبح خالص دیسی گھی، زعفران اور اعلیٰ میوہ جات سے کڑاہی میں تازہ پکائی جاتی ہے۔' 
                        : 'Each batch is prepared in morning kadhais with pure desi ghee and hand-sorted nuts. Melt-in-your-mouth texture.'}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('menu');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#C2410C] hover:text-[#9A3412] hover:underline cursor-pointer whitespace-nowrap"
                  >
                    <span>{isUrdu ? `تمام ${products.length} مٹھائیاں دیکھیں` : `View All ${products.length} Sweets`}</span>
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
                        onAddToCart={(p, qty, unit) => addToCart(p, qty, unit)}
                        onQuickView={setQuickViewProduct}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Custom Gift Boxes Section */}
            <GiftBoxesSection />


            {/* Real Customer Reviews Section */}
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
                  {isUrdu ? 'شاہی مینو' : 'The Royal Catalog'}
                </span>
                <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#2A170A]">
                  {isUrdu ? 'تازہ روایتی مٹھائیوں کا مینو' : 'Fresh Handcrafted Sweets Menu'}
                </h1>
                <p className="text-xs sm:text-sm text-[#5A4132] max-w-2xl leading-relaxed">
                  {isUrdu 
                    ? 'اپنی پسند کے مطابق کلو یا دانے کے حساب سے آرڈر کریں۔ تمام مٹھائیاں محفوظ ایئر ٹائٹ ڈبوں میں پیک کی جاتی ہیں۔'
                    : 'Select your desired portions in kg or pieces. All sweets are freshly packaged in airtight food-grade boxes to preserve maximum crispness, aroma, and delicate textures.'}
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
                      placeholder={isUrdu ? 'برفی، گلاب جامن، حلوہ، لڈو تلاش کریں...' : 'Search barfi, gulab jamun, halwa, dry fruits...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#D9C8B4] bg-[#FAF7F2] focus:outline-hidden focus:ring-2 focus:ring-[#C2410C]"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <span className="text-xs text-[#8C6D58] shrink-0 font-medium">{isUrdu ? 'ترتیب:' : 'Sort by:'}</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="text-xs px-3 py-2.5 rounded-xl border border-[#D9C8B4] bg-white text-[#2A170A] focus:outline-hidden focus:ring-2 focus:ring-[#C2410C]"
                    >
                      <option value="featured">{isUrdu ? 'شاہی انتخاب' : 'Featured Classics'}</option>
                      <option value="price-asc">{isUrdu ? 'قیمت: کم سے زیادہ' : 'Price: Low to High'}</option>
                      <option value="price-desc">{isUrdu ? 'قیمت: زیادہ سے کم' : 'Price: High to Low'}</option>
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
                      onAddToCart={(p, qty, unit) => addToCart(p, qty, unit)}
                      onQuickView={setQuickViewProduct}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* GIFT BOXES VIEW */}
        {activeTab === 'gift_boxes' && (
          <GiftBoxesSection />
        )}

        {/* EVENTS VIEW */}
        {activeTab === 'events' && (
          <EventsSection
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
        onOrderSuccess={handleOrderSuccess}
        settings={settings}
      />

      {/* Product Quick View Modal */}
      <ProductQuickView
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={(p, qty, unit) => addToCart(p, qty, unit)}
      />


      {/* Customer Account & Order History Modal */}
      <CustomerAuthModal
        isOpen={isCustomerAuthOpen}
        onClose={() => setIsCustomerAuthOpen(false)}
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

export default function App() {
  return (
    <LanguageProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </LanguageProvider>
  );
}
