import { supabase, isSupabaseConfigured } from './supabase';
import { 
  Product, CartItem, Order, EventInquiry, ContactMessage, 
  ShopSettings, Review, GiftBox, Coupon, CustomerProfile, OrderStatusHistoryItem 
} from '../types';

export const DEFAULT_SETTINGS: ShopSettings = {
  shop_name: 'Mithas Sweets',
  tagline: 'Fresh Traditional Sweets & Confections',
  phone: '03027628552',
  whatsapp: '923027628552',
  address: '',
  city: '',
  timings: 'Monday – Sunday: 9:00 AM – 11:00 PM',
  delivery_areas: 'Delivery available in covered areas',
  delivery_fee: 250,
  free_delivery_threshold: 4000,
  minimum_order: 500,
  bank_name: 'Meezan Bank Limited',
  bank_title: 'Mithas Sweets & Bakers',
  bank_iban: 'PK00MEZN0000001234567890',
  bank_account_no: '02010103456789',
  jazzcash_title: 'Mithas Sweets',
  jazzcash_number: '03027628552',
  easypaisa_title: 'Mithas Sweets',
  easypaisa_number: '03027628552',
  social_instagram: 'https://instagram.com/mithassweets',
  social_facebook: 'https://facebook.com/mithassweets',
  about_text: 'Welcome to our shop! We offer freshly prepared traditional sweets, barfi, laddus, and customized gift boxes prepared daily with the finest pure ingredients.',
  currency: 'PKR'
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-gulab-jamun',
    name: 'Desi Ghee Gulab Jamun',
    name_ur: 'دیسی گھی گلاب جامن',
    category: 'Mithai',
    sell_mode: 'both',
    price_per_kg: 1600,
    price_per_piece: 90,
    price_per_unit: 1600,
    unit: 'kg',
    piece_weight_g: 55,
    stock_grams: 12000,
    low_stock_threshold_grams: 1500,
    description: 'Soft, warm, golden dumplings soaked in aromatic cardamom and saffron syrup made with 100% pure desi ghee.',
    description_ur: 'خالص دیسی گھی، الائچی اور زعفرانی شیرے میں ڈوبے ہوئے تازہ اور نرم گلاب جامن۔',
    image: 'https://images.unsplash.com/photo-1574085733277-851d9d856a3a?w=400&q=80',
    is_featured: true,
    in_stock: true,
    is_available: true,
    ingredients: 'Khoya, Desi Ghee, Cardamom, Saffron Syrup, Pistachio',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-pistachio-barfi',
    name: 'Pistachio Khoya Barfi',
    name_ur: 'پستہ کھویا برفی',
    category: 'Barfi',
    sell_mode: 'kg',
    price_per_kg: 1800,
    price_per_piece: 100,
    price_per_unit: 1800,
    unit: 'kg',
    piece_weight_g: 45,
    stock_grams: 8000,
    low_stock_threshold_grams: 1000,
    description: 'Rich slow-simmered milk fudge garnished with roasted Persian pistachios and silver leaf (waraq).',
    description_ur: 'گاڑھے دودھ کے کھوئے اور بھنے ہوئے پستے سے تیار کردہ روایتی برفی۔',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    is_featured: true,
    in_stock: true,
    is_available: true,
    ingredients: 'Full Cream Buffalo Milk, Pistachios, Chandi Waraq, Cardamom',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-motichoor-laddu',
    name: 'Shahi Motichoor Laddu',
    name_ur: 'شاہی موتی چور لڈو',
    category: 'Laddu',
    sell_mode: 'both',
    price_per_kg: 1400,
    price_per_piece: 75,
    price_per_unit: 1400,
    unit: 'kg',
    piece_weight_g: 50,
    stock_grams: 15000,
    low_stock_threshold_grams: 2000,
    description: 'Tender tiny besan pearls fried in pure desi ghee, infused with saffron water and crushed melon seeds.',
    description_ur: 'باریک موتی دانوں سے تیار کردہ خوشبودار دیسی گھی کے شاہی موتی چور لڈو۔',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80',
    is_featured: true,
    in_stock: true,
    is_available: true,
    ingredients: 'Gram Flour (Besan), Pure Desi Ghee, Maghaz (Melon Seeds), Saffron',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-sohan-halwa',
    name: 'Multani Sohan Halwa',
    name_ur: 'ملتانی سوہن حلوہ',
    category: 'Halwa',
    sell_mode: 'kg',
    price_per_kg: 2200,
    price_per_unit: 2200,
    unit: 'kg',
    stock_grams: 6000,
    low_stock_threshold_grams: 1000,
    description: 'Crisp, caramelized traditional sprouted wheat halwa packed with almonds, walnuts, and cashews.',
    description_ur: 'انگوری آٹے اور خالص گھی میں پکا ہوا گری دار میوہ جات سے بھرپور سوہن حلوہ۔',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80',
    is_featured: false,
    in_stock: true,
    is_available: true,
    ingredients: 'Sprouted Wheat (Samnak), Desi Ghee, Almonds, Walnuts, Pistachios',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-kaju-katli',
    name: 'Royal Kaju Katli',
    name_ur: 'شاہی کاجو قتلی',
    category: 'Dry Fruit Sweets',
    sell_mode: 'kg',
    price_per_kg: 2600,
    price_per_piece: 140,
    price_per_unit: 2600,
    unit: 'kg',
    piece_weight_g: 30,
    stock_grams: 4500,
    low_stock_threshold_grams: 800,
    description: 'Delicate diamond-cut sweets crafted from premium ground cashews and delicate edible silver foil.',
    description_ur: 'بہترین کاجو اور چاندی کے ورق سے بنی ہوئی شاہی کاجو قتلی۔',
    image: 'https://images.unsplash.com/photo-1606914501449-5a96b6ce24ca?w=400&q=80',
    is_featured: true,
    in_stock: true,
    is_available: true,
    ingredients: 'Grade-A Cashews, Cane Sugar, Silver Foil',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-rasgulla',
    name: 'Saffron Spongy Rasgulla',
    name_ur: 'زعفرانی رس گلہ',
    category: 'Mithai',
    sell_mode: 'both',
    price_per_kg: 1500,
    price_per_piece: 80,
    price_per_unit: 1500,
    unit: 'kg',
    piece_weight_g: 60,
    stock_grams: 9000,
    low_stock_threshold_grams: 1200,
    description: 'Light, airy fresh chhena balls simmered in light rosewater and Kashmiri saffron syrup.',
    description_ur: 'تازہ چھینا اور عرقِ گلاب کے شیرے میں بنے ہوئے نرم اور رس دار رس گلے۔',
    image: 'https://images.unsplash.com/photo-1574085733277-851d9d856a3a?w=400&q=80',
    is_featured: false,
    in_stock: true,
    is_available: true,
    ingredients: 'Fresh Cow Milk Chhena, Saffron, Rose Syrup',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-besan-laddu',
    name: 'Desi Ghee Besan Laddu',
    name_ur: 'دیسی گھی بیسن لڈو',
    category: 'Laddu',
    sell_mode: 'both',
    price_per_kg: 1450,
    price_per_piece: 80,
    price_per_unit: 1450,
    unit: 'kg',
    piece_weight_g: 50,
    stock_grams: 10000,
    low_stock_threshold_grams: 1500,
    description: 'Coarse gram flour roasted slowly to golden perfection in desi ghee with crunchy almonds.',
    description_ur: 'خالص دیسی گھی میں بھنے ہوئے بیسن اور بادام سے تیار کردہ لڈو۔',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80',
    is_featured: false,
    in_stock: true,
    is_available: true,
    ingredients: 'Roasted Besan, Desi Ghee, Almonds, Elaichi',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-habshi-halwa',
    name: 'Shahi Habshi Halwa',
    name_ur: 'شاہی حبشی حلوہ',
    category: 'Halwa',
    sell_mode: 'kg',
    price_per_kg: 2000,
    price_per_unit: 2000,
    unit: 'kg',
    stock_grams: 5000,
    low_stock_threshold_grams: 1000,
    description: 'Traditional dark caramelized milk fudge infused with mace, nutmeg, and crunchy pistachio slivers.',
    description_ur: 'شاہی انداز میں تیار کردہ حبشی حلوہ جس میں مغزیات اور خوشبو شامل ہے۔',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80',
    is_featured: false,
    in_stock: true,
    is_available: true,
    ingredients: 'Milk Solids, Desi Ghee, Nutmeg, Mace, Mixed Nuts',
    created_at: new Date().toISOString()
  }
];

export const INITIAL_GIFT_BOXES: GiftBox[] = [
  {
    id: 'box-500g',
    name_en: 'Classic Royal Gold Box (500g)',
    name_ur: 'شاہی گولڈ ڈبہ (500 گرام)',
    size_grams: 500,
    box_price: 150,
    image_path: 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=400&q=80',
    is_active: true
  },
  {
    id: 'box-1000g',
    name_en: 'Festive Celebration Velvet Box (1kg)',
    name_ur: 'جشن مبارک مخمل ڈبہ (1 کلو)',
    size_grams: 1000,
    box_price: 250,
    image_path: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=400&q=80',
    is_active: true
  },
  {
    id: 'box-2000g',
    name_en: 'Grand Luxury Heritage Hamper (2kg)',
    name_ur: 'شاہانہ لگژری ڈبہ (2 کلو)',
    size_grams: 2000,
    box_price: 450,
    image_path: 'https://images.unsplash.com/photo-1582716401301-b2407dc7563d?w=400&q=80',
    is_active: true
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  { code: 'MITHAS10', discount_type: 'percentage', discount_value: 10, min_order_amount: 1500, is_active: true },
  { code: 'SWEET200', discount_type: 'fixed', discount_value: 200, min_order_amount: 2000, is_active: true },
  { code: 'WELCOME', discount_type: 'percentage', discount_value: 5, min_order_amount: 1000, is_active: true }
];

// In-memory / localStorage cache for immediate interactive preview
const getCachedProducts = (): Product[] => {
  try {
    const raw = localStorage.getItem('mithas_cached_products');
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_PRODUCTS;
};

const setCachedProducts = (prods: Product[]) => {
  try {
    localStorage.setItem('mithas_cached_products', JSON.stringify(prods));
  } catch {}
};

export const api = {
  // -------------------------------------------------------------
  // PRODUCTS
  // -------------------------------------------------------------
  async getProducts(params?: { category?: string; search?: string }): Promise<Product[]> {
    try {
      let query = supabase.from('products').select('*');
      if (params?.category && params.category !== 'All') {
        query = query.eq('category', params.category);
      }
      if (params?.search) {
        query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
      }
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return getCachedProducts();
      }

      // Map fields ensuring stock numbers
      const mapped = data.map((item: any) => ({
        ...item,
        price_per_unit: Number(item.price_per_unit || item.price_per_kg || 0),
        price_per_kg: item.price_per_kg ? Number(item.price_per_kg) : undefined,
        price_per_piece: item.price_per_piece ? Number(item.price_per_piece) : undefined,
        stock_grams: Number(item.stock_grams ?? 5000),
        low_stock_threshold_grams: Number(item.low_stock_threshold_grams ?? 500),
        sell_mode: item.sell_mode || 'kg',
        in_stock: Boolean(item.in_stock && (item.stock_grams > 0 || item.stock_grams === undefined)),
        is_available: Boolean(item.is_available && (item.stock_grams > 0 || item.stock_grams === undefined))
      }));
      setCachedProducts(mapped);
      return mapped;
    } catch (e) {
      console.warn('Using cached products fallback:', e);
      return getCachedProducts();
    }
  },

  async getProduct(id: string): Promise<Product> {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error || !data) {
      const match = getCachedProducts().find(p => p.id === id);
      if (match) return match;
      throw new Error('Product not found');
    }
    return data;
  },

  async createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    const newId = 'prod-' + Math.random().toString(36).substring(2, 9);
    const newProd = {
      id: newId,
      ...product,
      stock_grams: Number(product.stock_grams || 5000),
      low_stock_threshold_grams: Number(product.low_stock_threshold_grams || 500),
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase.from('products').insert([newProd]).select().single();
      if (!error && data) {
        const cached = getCachedProducts();
        setCachedProducts([data, ...cached]);
        return data;
      }
    } catch {}

    const cached = getCachedProducts();
    const updated = [newProd as Product, ...cached];
    setCachedProducts(updated);
    return newProd as Product;
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          ...product,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        const cached = getCachedProducts().map(p => p.id === id ? { ...p, ...data } : p);
        setCachedProducts(cached);
        return data;
      }
    } catch {}

    const cached = getCachedProducts().map(p => p.id === id ? { ...p, ...product } : p);
    setCachedProducts(cached);
    return cached.find(p => p.id === id)!;
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      await supabase.from('products').delete().eq('id', id);
    } catch {}
    const cached = getCachedProducts().filter(p => p.id !== id);
    setCachedProducts(cached);
  },

  // -------------------------------------------------------------
  // GIFT BOXES
  // -------------------------------------------------------------
  async getGiftBoxes(): Promise<GiftBox[]> {
    try {
      const { data, error } = await supabase
        .from('gift_boxes')
        .select('*')
        .eq('is_active', true)
        .order('size_grams', { ascending: true });
      if (!error && data && data.length > 0) return data;
    } catch {}
    return INITIAL_GIFT_BOXES;
  },

  async createGiftBox(box: Omit<GiftBox, 'id'>): Promise<GiftBox> {
    const { data, error } = await supabase
      .from('gift_boxes')
      .insert([box])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // -------------------------------------------------------------
  // STORAGE (Sweets Images & Payment Proofs)
  // -------------------------------------------------------------
  async uploadImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error } = await supabase.storage
      .from('sweets-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (error) {
      // Fallback object url
      return URL.createObjectURL(file);
    }

    const { data } = supabase.storage.from('sweets-images').getPublicUrl(filePath);
    return data.publicUrl;
  },

  async uploadPaymentProof(orderNumber: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const cleanNumber = orderNumber.replace(/[^a-zA-Z0-9-]/g, '');
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `orders/${cleanNumber}/${fileName}`;

    const { error } = await supabase.storage
      .from('payment-proofs')
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.warn('Failed to upload proof to storage bucket, saving filename reference:', error);
      return filePath;
    }
    return filePath;
  },

  async getPaymentProofSignedUrl(filePath: string): Promise<string | null> {
    if (!filePath) return null;
    try {
      // If already a full URL
      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return filePath;
      }
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(filePath, 3600); // 1 hour validity

      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
      // Fallback try public URL if bucket happens to be public
      const { data: publicData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);
      return publicData?.publicUrl || null;
    } catch {
      return null;
    }
  },

  // -------------------------------------------------------------
  // COUPONS
  // -------------------------------------------------------------
  async validateCoupon(code: string, subtotal: number): Promise<{
    valid: boolean;
    discount_amount?: number;
    discount_type?: 'percentage' | 'fixed';
    discount_value?: number;
    message?: string;
    code?: string;
  }> {
    const cleanCode = code.trim().toUpperCase();

    try {
      const { data, error } = await supabase.rpc('validate_coupon', {
        p_code: cleanCode,
        p_subtotal: subtotal
      });
      if (!error && data) {
        return data;
      }
    } catch {}

    // Fallback in-client coupon validation
    const found = INITIAL_COUPONS.find(c => c.code.toUpperCase() === cleanCode && c.is_active);
    if (!found) {
      return { valid: false, message: 'Coupon code not found or expired' };
    }
    if (subtotal < found.min_order_amount) {
      return { 
        valid: false, 
        message: `Minimum order amount for this coupon is Rs. ${found.min_order_amount.toLocaleString()}` 
      };
    }
    const discount = found.discount_type === 'percentage'
      ? Math.round((subtotal * found.discount_value) / 100)
      : Math.min(found.discount_value, subtotal);

    return {
      valid: true,
      code: found.code,
      discount_type: found.discount_type,
      discount_value: found.discount_value,
      discount_amount: discount
    };
  },

  async getAdminCoupons(): Promise<Coupon[]> {
    try {
      const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch {}
    return INITIAL_COUPONS;
  },

  async createCoupon(coupon: Omit<Coupon, 'id'>): Promise<Coupon> {
    const { data, error } = await supabase.from('coupons').insert([coupon]).select().single();
    if (error) throw error;
    return data;
  },

  async deleteCoupon(code: string): Promise<void> {
    await supabase.from('coupons').delete().eq('code', code);
  },

  // -------------------------------------------------------------
  // ORDERS (RPC place_order, track_order, attach_payment_proof)
  // -------------------------------------------------------------
  async createOrder(payload: {
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    delivery_type: 'delivery' | 'pickup';
    delivery_address?: string;
    delivery_city?: string;
    pickup_time?: string;
    delivery_slot?: string;
    special_notes?: string;
    items: CartItem[];
    payment_method: 'cod' | 'bank' | 'jazzcash' | 'easypaisa';
    coupon_code?: string;
    loyalty_points_redeemed?: number;
  }): Promise<{ order: Order; whatsappUrl: string; whatsappMessage: string }> {
    const settings = await api.getSettings();
    const cleanPhone = payload.customer_phone.replace(/[^0-9]/g, '');

    let orderNumber = `MS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    let orderId = 'order-' + Math.random().toString(36).substring(2, 9);
    let finalSubtotal = payload.items.reduce((acc, it) => acc + it.total, 0);
    let finalDeliveryFee = payload.delivery_type === 'delivery' 
      ? (finalSubtotal >= settings.free_delivery_threshold ? 0 : settings.delivery_fee) 
      : 0;
    let finalDiscount = 0;

    // Call Postgres RPC place_order
    try {
      const { data, error } = await supabase.rpc('place_order', { payload });
      if (!error && data && data.order_number) {
        orderNumber = data.order_number;
        orderId = data.order_id || orderId;
        finalSubtotal = Number(data.subtotal || finalSubtotal);
        finalDeliveryFee = Number(data.delivery_fee || finalDeliveryFee);
        finalDiscount = Number(data.discount || 0);
      } else if (error) {
        console.warn('Supabase place_order RPC returned error or table not yet migrated, proceeding with direct/client transaction:', error.message);
        // Attempt direct insert into orders table if RPC not found
        try {
          const directOrder = {
            id: orderId,
            order_number: orderNumber,
            customer_name: payload.customer_name,
            customer_phone: cleanPhone,
            customer_email: payload.customer_email || null,
            delivery_type: payload.delivery_type,
            delivery_address: payload.delivery_address || null,
            delivery_city: payload.delivery_city || null,
            pickup_time: payload.pickup_time || null,
            delivery_slot: payload.delivery_slot || 'Morning',
            special_notes: payload.special_notes || null,
            items: payload.items,
            subtotal: finalSubtotal,
            delivery_fee: finalDeliveryFee,
            discount_amount: finalDiscount,
            total: Math.max(finalSubtotal + finalDeliveryFee - finalDiscount, 0),
            payment_method: payload.payment_method,
            payment_status: 'pending',
            status: 'New'
          };
          await supabase.from('orders').insert([directOrder]);
        } catch {}
      }
    } catch (e: any) {
      console.warn('Exception calling place_order:', e);
    }

    const grandTotal = Math.max(finalSubtotal + finalDeliveryFee - finalDiscount, 0);

    const createdOrder: Order = {
      id: orderId,
      order_number: orderNumber,
      customer_name: payload.customer_name,
      customer_phone: cleanPhone,
      customer_email: payload.customer_email,
      delivery_type: payload.delivery_type,
      delivery_address: payload.delivery_address,
      delivery_city: payload.delivery_city,
      pickup_time: payload.pickup_time,
      delivery_slot: payload.delivery_slot,
      special_notes: payload.special_notes,
      items: payload.items,
      subtotal: finalSubtotal,
      delivery_fee: finalDeliveryFee,
      discount_amount: finalDiscount,
      total: grandTotal,
      payment_method: payload.payment_method,
      payment_status: 'pending',
      status: 'New',
      created_at: new Date().toISOString()
    };

    // Save to local storage order history
    try {
      const historyRaw = localStorage.getItem('mithas_order_history') || '[]';
      const history = JSON.parse(historyRaw);
      localStorage.setItem('mithas_order_history', JSON.stringify([createdOrder, ...history]));
    } catch {}

    // Build WhatsApp dispatch link
    const itemsSummary = payload.items
      .map(i => `• ${i.name} (${i.quantity} ${i.unit}): Rs. ${i.total.toLocaleString()}`)
      .join('\n');

    const shopDisplayName = settings.shop_name || 'Mithas Sweets';
    const cleanWhatsapp = (settings.whatsapp || '923027628552').replace(/[^0-9]/g, '');

    const whatsappMessage = 
`*${shopDisplayName} - New Order Confirmed!* 🍯

*Order No:* ${createdOrder.order_number}
*Customer:* ${payload.customer_name}
*Contact:* ${payload.customer_phone}
*Type:* ${payload.delivery_type === 'delivery' ? 'Home Delivery' : 'Store Pickup'}
*Slot:* ${payload.delivery_slot || 'Standard'}
${payload.delivery_type === 'delivery' ? `*Address:* ${payload.delivery_address}${payload.delivery_city ? ', ' + payload.delivery_city : ''}\n` : `*Pickup Note:* Details will be shared on WhatsApp\n`}
*Items:*
${itemsSummary}

*Subtotal:* Rs. ${finalSubtotal.toLocaleString()}
*Delivery Fee:* ${finalDeliveryFee === 0 ? 'FREE' : `Rs. ${finalDeliveryFee.toLocaleString()}`}
${finalDiscount > 0 ? `*Discount:* -Rs. ${finalDiscount.toLocaleString()}\n` : ''}*Total Amount:* Rs. ${grandTotal.toLocaleString()}
*Payment:* ${payload.payment_method.toUpperCase()}

Please verify and dispatch fresh batch. Shukriya! ✨`;

    const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(whatsappMessage)}`;

    // Fire-and-forget trigger for Supabase Edge Function send-notification
    try {
      supabase.functions.invoke('send-notification', {
        body: {
          type: 'order_created',
          order_number: createdOrder.order_number,
          customer_name: createdOrder.customer_name,
          customer_phone: createdOrder.customer_phone,
          customer_email: createdOrder.customer_email,
          total: createdOrder.total,
          delivery_type: createdOrder.delivery_type,
          delivery_address: createdOrder.delivery_address,
          delivery_slot: createdOrder.delivery_slot,
          payment_method: createdOrder.payment_method,
          items: createdOrder.items.map(it => ({
            name: it.name,
            quantity: it.quantity,
            unit: it.unit,
            total: it.total
          })),
          shop_email: settings.shop_email
        }
      }).catch(err => {
        console.warn('send-notification Edge Function skipped/offline:', err);
      });
    } catch {}

    return {
      order: createdOrder,
      whatsappUrl,
      whatsappMessage
    };
  },

  async trackOrder(orderNumber: string, phone: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase.rpc('track_order', {
        p_order_number: orderNumber.trim(),
        p_phone: phone.trim()
      });
      if (!error && data) {
        return data as Order;
      }
    } catch {}

    // Fallback direct query if RPC not set
    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const { data } = await supabase
        .from('orders')
        .select('*')
        .ilike('order_number', orderNumber.trim())
        .single();
      if (data && data.customer_phone.includes(cleanPhone.slice(-7))) {
        return data as Order;
      }
    } catch {}

    // Local storage lookup
    try {
      const historyRaw = localStorage.getItem('mithas_order_history') || '[]';
      const history: Order[] = JSON.parse(historyRaw);
      const match = history.find(o => 
        o.order_number.toUpperCase() === orderNumber.trim().toUpperCase()
      );
      if (match) return match;
    } catch {}

    return null;
  },

  async attachPaymentProof(orderNumber: string, phone: string, filePath: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('attach_payment_proof', {
        p_order_number: orderNumber.trim(),
        p_phone: phone.trim(),
        p_file_path: filePath
      });
      if (!error && data === true) return true;
    } catch {}

    try {
      await supabase
        .from('orders')
        .update({
          payment_proof_path: filePath,
          payment_status: 'pending'
        })
        .ilike('order_number', orderNumber.trim());
      return true;
    } catch {
      return false;
    }
  },

  async getAdminOrders(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch {}

    // Fallback to locally saved orders
    try {
      const historyRaw = localStorage.getItem('mithas_order_history') || '[]';
      return JSON.parse(historyRaw);
    } catch {}
    return [];
  },

  async updateOrderStatus(id: string, status: Order['status'], note?: string, cancelReason?: string): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const adminEmail = userData.user?.email || 'admin@mithassweets.com';

      const updatePayload: any = { status };
      if (cancelReason) {
        updatePayload.cancel_reason = cancelReason;
      }
      await supabase.from('orders').update(updatePayload).eq('id', id);

      await supabase.from('order_status_history').insert([{
        order_id: id,
        status,
        changed_by: adminEmail,
        note: note || (cancelReason ? `Cancelled: ${cancelReason}` : `Status updated to ${status}`)
      }]);
    } catch (e) {
      console.warn('Error updating order status:', e);
    }

    // Update local cache
    try {
      const historyRaw = localStorage.getItem('mithas_order_history') || '[]';
      const history: Order[] = JSON.parse(historyRaw);
      const updated = history.map(o => o.id === id ? { ...o, status, cancel_reason: cancelReason || o.cancel_reason } : o);
      localStorage.setItem('mithas_order_history', JSON.stringify(updated));
    } catch {}
  },

  async getOrderStatusHistory(orderId: string): Promise<OrderStatusHistoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      if (!error && data) return data;
    } catch {}
    return [];
  },

  async updateOrderPaymentStatus(id: string, payment_status: 'pending' | 'verified' | 'rejected', note?: string): Promise<void> {
    try {
      await supabase.from('orders').update({ payment_status, payment_note: note }).eq('id', id);
    } catch (e) {
      console.warn('Error updating payment status:', e);
    }
  },

  // -------------------------------------------------------------
  // CUSTOMER AUTH & PROFILES
  // -------------------------------------------------------------
  async getCustomerProfile(userId: string): Promise<CustomerProfile | null> {
    try {
      const { data } = await supabase.from('customers').select('*').eq('id', userId).single();
      if (data) return data;
    } catch {}
    return null;
  },

  async saveCustomerAddress(userId: string, address: string): Promise<void> {
    try {
      const profile = await api.getCustomerProfile(userId);
      const existing = profile?.saved_addresses || [];
      if (!existing.includes(address)) {
        await supabase.from('customers').update({
          saved_addresses: [...existing, address]
        }).eq('id', userId);
      }
    } catch {}
  },

  // -------------------------------------------------------------
  // EVENTS & INQUIRIES
  // -------------------------------------------------------------
  async submitInquiry(payload: {
    name: string;
    phone: string;
    email?: string;
    event_type: string;
    event_date: string;
    estimated_boxes: number;
    budget_range?: string;
    custom_requirements?: string;
  }): Promise<{ inquiry: EventInquiry; message: string }> {
    const newInquiry: EventInquiry = {
      id: 'inq-' + Math.random().toString(36).substring(2, 9),
      ...payload,
      status: 'New',
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('event_inquiries').insert([newInquiry]);
      
      // Fire-and-forget notification to shop owner
      const settings = await api.getSettings().catch(() => null);
      supabase.functions.invoke('send-notification', {
        body: {
          type: 'inquiry_created',
          name: newInquiry.name,
          phone: newInquiry.phone,
          email: newInquiry.email,
          event_type: newInquiry.event_type,
          event_date: newInquiry.event_date,
          estimated_boxes: newInquiry.estimated_boxes,
          budget_range: newInquiry.budget_range,
          custom_requirements: newInquiry.custom_requirements,
          shop_email: settings?.shop_email
        }
      }).catch(() => {});
    } catch {}

    return {
      inquiry: newInquiry,
      message: 'Mubarak! Your bulk catering inquiry has been submitted. Our concierge team will reach out on WhatsApp shortly.'
    };
  },

  async getAdminInquiries(): Promise<EventInquiry[]> {
    try {
      const { data, error } = await supabase
        .from('event_inquiries')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch {}
    return [];
  },

  async updateInquiryStatus(id: string, status: EventInquiry['status']): Promise<void> {
    try {
      await supabase.from('event_inquiries').update({ status }).eq('id', id);
    } catch {}
  },

  async updateInquiryQuote(id: string, quoteAmount: number, quoteNote?: string): Promise<void> {
    try {
      await supabase.from('event_inquiries').update({ 
        quote_amount: quoteAmount, 
        quote_note: quoteNote,
        status: 'Quoted'
      }).eq('id', id);
    } catch {}
  },

  // -------------------------------------------------------------
  // CONTACT MESSAGES
  // -------------------------------------------------------------
  async submitContact(payload: {
    name: string;
    phone: string;
    email?: string;
    subject: string;
    message: string;
  }): Promise<{ message: string }> {
    const newMsg: ContactMessage = {
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      ...payload,
      is_read: false,
      status: 'Unread',
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('contact_messages').insert([newMsg]);
    } catch {}

    return {
      message: 'Thank you for reaching out! Our team has received your message and will respond promptly.'
    };
  },

  async getAdminMessages(): Promise<ContactMessage[]> {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch {}
    return [];
  },

  async updateMessageStatus(id: string, status: ContactMessage['status']): Promise<void> {
    try {
      await supabase.from('contact_messages').update({ 
        status, 
        is_read: status === 'Read' || status === 'Resolved' 
      }).eq('id', id);
    } catch {}
  },

  async markMessageAsRead(id: string): Promise<void> {
    try {
      await supabase.from('contact_messages').update({ 
        is_read: true, 
        status: 'Read' 
      }).eq('id', id);
    } catch {}
  },

  // -------------------------------------------------------------
  // REVIEWS
  // -------------------------------------------------------------
  async getReviews(): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch {}
    return [];
  },

  async submitReview(payload: {
    customer_name: string;
    city?: string;
    rating: number;
    comment: string;
    order_number?: string;
  }): Promise<{ message: string }> {
    const newReview = {
      id: 'rev-' + Math.random().toString(36).substring(2, 9),
      ...payload,
      is_approved: false,
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('reviews').insert([newReview]);
    } catch {}

    return {
      message: 'Shukriya! Your genuine review has been submitted and will appear on the storefront after verification.'
    };
  },

  async getAdminReviews(): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch {}
    return [];
  },

  async updateReviewApproval(id: string, is_approved: boolean): Promise<void> {
    try {
      await supabase.from('reviews').update({ is_approved }).eq('id', id);
    } catch {}
  },

  async deleteReview(id: string): Promise<void> {
    try {
      await supabase.from('reviews').delete().eq('id', id);
    } catch {}
  },

  // -------------------------------------------------------------
  // SHOP SETTINGS
  // -------------------------------------------------------------
  async getSettings(): Promise<ShopSettings> {
    try {
      const { data, error } = await supabase.from('settings').select('*');
      if (!error && data && data.length > 0) {
        const mapped: any = { ...DEFAULT_SETTINGS };
        for (const row of data) {
          if (row.key === 'delivery_fee' || row.key === 'free_delivery_threshold' || row.key === 'minimum_order') {
            mapped[row.key] = Number(row.value);
          } else {
            mapped[row.key] = row.value;
          }
        }
        return mapped;
      }
    } catch {}

    // Fallback local storage
    try {
      const saved = localStorage.getItem('mithas_settings');
      if (saved) return JSON.parse(saved);
    } catch {}

    return DEFAULT_SETTINGS;
  },

  async updateSettings(settings: Partial<ShopSettings>): Promise<ShopSettings> {
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value: String(value ?? '')
      }));

      for (const item of updates) {
        await supabase.from('settings').upsert(item);
      }
    } catch {}

    try {
      const current = await api.getSettings();
      const merged = { ...current, ...settings };
      localStorage.setItem('mithas_settings', JSON.stringify(merged));
      return merged;
    } catch {}

    return { ...DEFAULT_SETTINGS, ...settings };
  },

  // -------------------------------------------------------------
  // ADMIN AUTH & STATUS
  // -------------------------------------------------------------
  async adminLogin(email: string, password: string): Promise<{ token: string; user?: any }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(error.message || 'Invalid admin credentials');
    }

    return {
      token: data.session?.access_token || 'supabase_token',
      user: data.user
    };
  },

  async adminLogout(): Promise<void> {
    await supabase.auth.signOut();
  },

  async checkIsAdmin(): Promise<boolean> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return false;

      const { data, error } = await supabase.rpc('is_admin');
      if (!error && typeof data === 'boolean') {
        return data;
      }
      if (error) {
        console.warn('is_admin RPC error:', error.message);
      }
      return false;
    } catch {
      return false;
    }
  },

  // -------------------------------------------------------------
  // AI CONCIERGE (Client-side with fallback)
  // -------------------------------------------------------------
  async getAiConciergeRecommendation(payload: {
    query?: string;
    occasion?: string;
    guestCount?: number | string;
    dietaryPreferences?: string;
    budget?: string;
  }): Promise<{ recommendation: string; modelUsed: string }> {
    const occasion = payload.occasion || 'Wedding / Baraat';
    const guests = Number(payload.guestCount) || 100;
    const dietary = payload.dietaryPreferences || 'Traditional Desi Ghee';
    const totalBoxes = Math.max(Math.ceil(guests * 0.4), 25);

    return {
      modelUsed: 'Mithas Master Sommelier',
      recommendation: 
`Based on your prestigious celebration (${occasion}) for ~${guests} esteemed guests:

• Recommended Package: Royal Desi Ghee Heritage Boxes
• Recommended Box Count: ${totalBoxes} signature gift boxes (1kg each)
• Selected Mithai Assortment:
  1. Shahi Motichoor Laddu (Golden festive favorite)
  2. Pistachio Khoya Barfi (Handcrafted with Persian pistachios)
  3. Desi Ghee Gulab Jamun (Cardamom & saffron infused)
  4. Royal Kaju Katli (Edible silver foil finish)

• Fresh Batch Guarantee: Prepared in pure desi ghee 4 hours prior to dispatch.
• Custom Ribbon & Name Card: Complimentary for your ${occasion} guest gifts.`
    };
  }
};
