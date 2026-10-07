import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Product {
  id: string;
  name: string;
  category: string;
  price_per_unit: number;
  unit: string;
  description: string;
  image: string;
  is_featured: boolean;
  in_stock: boolean;
  ingredients: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  name: string;
  category: string;
  price_per_unit: number;
  unit: string;
  quantity: number;
  total: number;
  image?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_type: 'delivery' | 'pickup';
  delivery_address?: string;
  delivery_city?: string;
  pickup_time?: string;
  special_notes?: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: 'cod' | 'bank' | 'jazzcash' | 'easypaisa';
  status: 'New' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  created_at: string;
}

export interface EventInquiry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  event_type: string;
  event_date: string;
  estimated_boxes: number;
  budget_range?: string;
  custom_requirements?: string;
  status: 'New' | 'Contacted' | 'Quoted' | 'Confirmed' | 'Archived';
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  status: 'Unread' | 'Read' | 'Resolved';
  created_at: string;
}

export interface Review {
  id: string;
  customer_name: string;
  city?: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
}

export interface ShopSettings {
  shop_name: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  timings: string;
  delivery_areas: string;
  delivery_fee: number;
  free_delivery_threshold: number;
  bank_title: string;
  bank_name: string;
  bank_iban: string;
  bank_account_no: string;
  jazzcash_title: string;
  jazzcash_number: string;
  easypaisa_title: string;
  easypaisa_number: string;
  social_instagram: string;
  social_facebook: string;
  about_text: string;
  currency: string;
}

const DEFAULT_SETTINGS: ShopSettings = {
  shop_name: 'Mithas Sweets',
  tagline: 'Fresh Traditional Sweets & Confections',
  phone: '03027628552',
  whatsapp: '923027628552',
  address: '',
  city: '',
  timings: 'Monday – Sunday: 9:00 AM – 11:30 PM',
  delivery_areas: 'Delivery available in designated areas',
  delivery_fee: 250,
  free_delivery_threshold: 4000,
  bank_name: 'Meezan Bank Limited',
  bank_title: 'Mithas Sweets',
  bank_iban: 'PK45MEZN0002140108920192',
  bank_account_no: '0214-0108920192',
  jazzcash_title: 'Mithas Sweets',
  jazzcash_number: '03027628552',
  easypaisa_title: 'Mithas Sweets',
  easypaisa_number: '03027628552',
  social_instagram: 'https://instagram.com',
  social_facebook: 'https://facebook.com',
  about_text: 'Welcome to our shop! We offer freshly prepared traditional sweets, barfi, laddus, and gift hampers for celebrations and special occasions. All orders are packed fresh upon confirmation.',
  currency: 'Rs.',
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-barfi-pista',
    name: 'Pistachio Saffron Barfi',
    category: 'Barfi',
    price_per_unit: 1950,
    unit: 'kg',
    description: 'Fresh milk khoya barfi layered with pistachios and saffron.',
    image: '/src/assets/images/mithas_barfi_assortment_1791385657557.jpg',
    is_featured: true,
    in_stock: true,
    ingredients: 'Khoya, Saffron, Pistachios, Sugar, Cardamom',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-barfi-kaju',
    name: 'Kaju Katli',
    category: 'Barfi',
    price_per_unit: 2400,
    unit: 'kg',
    description: 'Diamond-cut cashew sweet made with roasted cashew nuts.',
    image: '/src/assets/images/mithas_barfi_assortment_1791385657557.jpg',
    is_featured: true,
    in_stock: true,
    ingredients: 'Cashew nuts, Sugar, Water',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-barfi-besan',
    name: 'Besan Barfi',
    category: 'Barfi',
    price_per_unit: 1450,
    unit: 'kg',
    description: 'Roasted gram flour barfi with almonds and cardamom.',
    image: '/src/assets/images/mithas_barfi_assortment_1791385657557.jpg',
    is_featured: false,
    in_stock: true,
    ingredients: 'Gram flour, Clarified butter, Sugar, Almonds',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-laddu-motichoor',
    name: 'Motichoor Laddu',
    category: 'Laddu',
    price_per_unit: 1550,
    unit: 'kg',
    description: 'Fine gram flour pearls soaked in syrup with cardamom and melon seeds.',
    image: '/src/assets/images/mithas_halwa_laddu_1791385679890.jpg',
    is_featured: true,
    in_stock: true,
    ingredients: 'Gram flour, Sugar, Cardamom, Melon seeds',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-laddu-gond',
    name: 'Gond Dry Fruit Laddu',
    category: 'Laddu',
    price_per_unit: 1850,
    unit: 'kg',
    description: 'Traditional laddu with edible gum, almonds, cashews, and wheat flour.',
    image: '/src/assets/images/mithas_halwa_laddu_1791385679890.jpg',
    is_featured: false,
    in_stock: true,
    ingredients: 'Edible gum, Almonds, Cashews, Wheat flour, Sugar',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-halwa-sohan',
    name: 'Multani Sohan Halwa',
    category: 'Halwa',
    price_per_unit: 2200,
    unit: 'kg',
    description: 'Dense sweet halwa loaded with walnuts, almonds, and pistachios.',
    image: '/src/assets/images/mithas_halwa_laddu_1791385679890.jpg',
    is_featured: true,
    in_stock: true,
    ingredients: 'Wheat milk, Sugar, Walnuts, Almonds, Pistachios',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-halwa-habshi',
    name: 'Habshi Halwa',
    category: 'Halwa',
    price_per_unit: 2050,
    unit: 'kg',
    description: 'Caramelized milk mawa halwa seasoned with cardamom and cashews.',
    image: '/src/assets/images/mithas_halwa_laddu_1791385679890.jpg',
    is_featured: false,
    in_stock: true,
    ingredients: 'Milk khoya, Sugar, Sprouted wheat, Cashews, Cardamom',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-mithai-gulabjamun',
    name: 'Gulab Jamun',
    category: 'Mithai',
    price_per_unit: 1400,
    unit: 'kg',
    description: 'Khoya dumplings steeped in aromatic rose and cardamom sugar syrup.',
    image: '/src/assets/images/mithas_hero_spread_1791385618514.jpg',
    is_featured: true,
    in_stock: true,
    ingredients: 'Khoya, Chenna, Sugar syrup, Rose water, Cardamom',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-mithai-rasgulla',
    name: 'Rasgulla',
    category: 'Mithai',
    price_per_unit: 1350,
    unit: 'kg',
    description: 'Soft cottage cheese balls simmered in light sugar syrup.',
    image: '/src/assets/images/mithas_hero_spread_1791385618514.jpg',
    is_featured: false,
    in_stock: true,
    ingredients: 'Fresh milk chenna, Sugar syrup, Cardamom',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-mithai-chamcham',
    name: 'Malai Cham Cham',
    category: 'Mithai',
    price_per_unit: 1650,
    unit: 'kg',
    description: 'Chenna sweets layered with rabri cream and pistachios.',
    image: '/src/assets/images/mithas_hero_spread_1791385618514.jpg',
    is_featured: false,
    in_stock: true,
    ingredients: 'Chenna, Clotted cream, Sugar, Pistachios',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-dryfruit-anjeer',
    name: 'Anjeer Dry Fruit Roll',
    category: 'Dry Fruit Sweets',
    price_per_unit: 2550,
    unit: 'kg',
    description: 'Fig and roasted nut rolls made without added cane sugar.',
    image: '/src/assets/images/mithas_luxury_box_1791385642526.jpg',
    is_featured: true,
    in_stock: true,
    ingredients: 'Dried figs, Almonds, Cashews, Pistachios',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-dryfruit-khajoor',
    name: 'Date & Nut Squares',
    category: 'Dry Fruit Sweets',
    price_per_unit: 2250,
    unit: 'kg',
    description: 'Bite-sized squares crafted with dates and mixed roasted nuts.',
    image: '/src/assets/images/mithas_luxury_box_1791385642526.jpg',
    is_featured: false,
    in_stock: true,
    ingredients: 'Dates, Almonds, Walnuts, Sesame',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-cake-rasmalai',
    name: 'Rasmalai Tres Leches Cake',
    category: 'Cakes',
    price_per_unit: 2900,
    unit: 'piece',
    description: 'Sponge cake soaked in saffron milk and topped with rasmalai chunks.',
    image: '/src/assets/images/mithas_luxury_box_1791385642526.jpg',
    is_featured: true,
    in_stock: true,
    ingredients: 'Flour, Milk, Cream, Rasmalai, Saffron, Pistachios',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-cake-gulabjamun',
    name: 'Gulab Jamun Cheesecake',
    category: 'Cakes',
    price_per_unit: 3100,
    unit: 'piece',
    description: 'Baked cheesecake with gulab jamuns on biscuit crust.',
    image: '/src/assets/images/mithas_luxury_box_1791385642526.jpg',
    is_featured: false,
    in_stock: true,
    ingredients: 'Cream cheese, Gulab jamuns, Biscuit base, Cardamom',
    created_at: new Date().toISOString()
  }
];

// Read Supabase environment variables exclusively on the server
const rawSupabaseUrl = process.env.SUPABASE_URL?.trim();
const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

export const isSupabaseConfigured = Boolean(
  rawSupabaseUrl &&
  rawServiceKey &&
  rawSupabaseUrl.startsWith('http') &&
  !rawSupabaseUrl.includes('your-project.supabase.co') &&
  !rawServiceKey.includes('your_service_role_key')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(rawSupabaseUrl!, rawServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Local fallback store
let memoryProducts: Product[] = [...INITIAL_PRODUCTS];
let memoryOrders: Order[] = [];
let memoryInquiries: EventInquiry[] = [];
let memoryMessages: ContactMessage[] = [];
let memoryReviews: Review[] = [];
let memorySettings: ShopSettings = { ...DEFAULT_SETTINGS };

let hasAttemptedSeed = false;

export async function ensureSupabaseSeeded(): Promise<void> {
  if (!supabase || hasAttemptedSeed) return;
  hasAttemptedSeed = true;

  try {
    const { count, error: countErr } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (!countErr && (count === null || count === 0)) {
      console.log('Seeding Supabase products table with initial sweets list...');
      await supabase.from('products').insert(INITIAL_PRODUCTS);
    }

    const { count: settingsCount, error: sErr } = await supabase
      .from('settings')
      .select('*', { count: 'exact', head: true });

    if (!sErr && (settingsCount === null || settingsCount === 0)) {
      const settingsEntries = Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
        key,
        value: String(value)
      }));
      await supabase.from('settings').insert(settingsEntries);
    }

    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(b => b.name === 'sweets-images');
      if (!bucketExists) {
        await supabase.storage.createBucket('sweets-images', { public: true });
      }
    } catch {
      // storage bucket optional check
    }
  } catch (err: any) {
    console.warn('Notice during Supabase seeding:', err.message);
  }
}

// ---------------- PRODUCTS ----------------

export async function getAllProducts(filters?: { category?: string; search?: string }): Promise<Product[]> {
  if (supabase) {
    await ensureSupabaseSeeded();
    let query = supabase.from('products').select('*');

    if (filters?.category && filters.category !== 'All') {
      query = query.eq('category', filters.category);
    }

    if (filters?.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      query = query.or(`name.ilike.${term},description.ilike.${term},ingredients.ilike.${term}`);
    }

    query = query.order('is_featured', { ascending: false }).order('name', { ascending: true });

    const { data, error } = await query;
    if (error) {
      console.error('Supabase getAllProducts error:', error.message);
      return filterMemoryProducts(filters);
    }
    return (data || []).map(p => ({
      ...p,
      price_per_unit: Number(p.price_per_unit),
      is_featured: Boolean(p.is_featured),
      in_stock: Boolean(p.in_stock),
    }));
  }

  return filterMemoryProducts(filters);
}

function filterMemoryProducts(filters?: { category?: string; search?: string }): Product[] {
  return memoryProducts.filter(p => {
    const matchCat = !filters?.category || filters.category === 'All' || p.category === filters.category;
    const matchSearch = !filters?.search || 
      p.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      p.description.toLowerCase().includes(filters.search.toLowerCase());
    return matchCat && matchSearch;
  }).sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
}

export async function getProductById(id: string): Promise<Product | null> {
  if (supabase) {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return {
      ...data,
      price_per_unit: Number(data.price_per_unit),
      is_featured: Boolean(data.is_featured),
      in_stock: Boolean(data.in_stock),
    };
  }
  return memoryProducts.find(p => p.id === id) || null;
}

export async function createProduct(data: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
  const id = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const newProduct: Product = {
    id,
    ...data,
    created_at: now
  };

  if (supabase) {
    const { data: inserted, error } = await supabase.from('products').insert([newProduct]).select().single();
    if (error) throw new Error(error.message);
    return {
      ...inserted,
      price_per_unit: Number(inserted.price_per_unit),
      is_featured: Boolean(inserted.is_featured),
      in_stock: Boolean(inserted.in_stock),
    };
  }

  memoryProducts.push(newProduct);
  return newProduct;
}

export async function updateProduct(id: string, data: Partial<Omit<Product, 'id' | 'created_at'>>): Promise<Product | null> {
  if (supabase) {
    const { data: updated, error } = await supabase
      .from('products')
      .update(data)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!updated) return null;
    return {
      ...updated,
      price_per_unit: Number(updated.price_per_unit),
      is_featured: Boolean(updated.is_featured),
      in_stock: Boolean(updated.in_stock),
    };
  }

  const idx = memoryProducts.findIndex(p => p.id === id);
  if (idx === -1) return null;
  memoryProducts[idx] = { ...memoryProducts[idx], ...data };
  return memoryProducts[idx];
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  const initialLen = memoryProducts.length;
  memoryProducts = memoryProducts.filter(p => p.id !== id);
  return memoryProducts.length < initialLen;
}

export async function clearAllProducts(): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase.from('products').delete().neq('id', '___non_existent___');
    if (error) throw new Error(error.message);
    return true;
  }
  memoryProducts = [];
  return true;
}

export async function bulkCreateProducts(prods: Omit<Product, 'id' | 'created_at'>[]): Promise<Product[]> {
  const now = new Date().toISOString();
  const createdList: Product[] = prods.map((p, idx) => ({
    id: `prod-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
    ...p,
    created_at: now
  }));

  if (supabase) {
    const { data, error } = await supabase.from('products').insert(createdList).select();
    if (error) throw new Error(error.message);
    return (data || []).map(item => ({
      ...item,
      price_per_unit: Number(item.price_per_unit),
      is_featured: Boolean(item.is_featured),
      in_stock: Boolean(item.in_stock),
    }));
  }

  memoryProducts.push(...createdList);
  return createdList;
}

// ---------------- ORDERS ----------------

export async function createOrder(data: {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_type: 'delivery' | 'pickup';
  delivery_address?: string;
  delivery_city?: string;
  pickup_time?: string;
  special_notes?: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: 'cod' | 'bank' | 'jazzcash' | 'easypaisa';
}): Promise<Order> {
  const id = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const randomCode = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `ORD-${randomCode}`;
  const now = new Date().toISOString();

  const newOrder: Order = {
    id,
    order_number: orderNumber,
    customer_name: data.customer_name,
    customer_phone: data.customer_phone,
    customer_email: data.customer_email,
    delivery_type: data.delivery_type,
    delivery_address: data.delivery_address,
    delivery_city: data.delivery_city,
    pickup_time: data.pickup_time,
    special_notes: data.special_notes,
    items: data.items,
    subtotal: data.subtotal,
    delivery_fee: data.delivery_fee,
    total: data.total,
    payment_method: data.payment_method,
    status: 'New',
    created_at: now
  };

  if (supabase) {
    const { data: inserted, error } = await supabase.from('orders').insert([newOrder]).select().single();
    if (error) throw new Error(error.message);
    return {
      ...inserted,
      subtotal: Number(inserted.subtotal),
      delivery_fee: Number(inserted.delivery_fee),
      total: Number(inserted.total),
    };
  }

  memoryOrders.unshift(newOrder);
  return newOrder;
}

export async function getAllOrders(): Promise<Order[]> {
  if (supabase) {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(o => ({
      ...o,
      subtotal: Number(o.subtotal),
      delivery_fee: Number(o.delivery_fee),
      total: Number(o.total),
      items: Array.isArray(o.items) ? o.items : []
    }));
  }
  return memoryOrders;
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .or(`order_number.eq.${orderNumber},id.eq.${orderNumber}`)
      .maybeSingle();

    if (error || !data) return null;
    return {
      ...data,
      subtotal: Number(data.subtotal),
      delivery_fee: Number(data.delivery_fee),
      total: Number(data.total),
      items: Array.isArray(data.items) ? data.items : []
    };
  }
  return memoryOrders.find(o => o.order_number === orderNumber || o.id === orderNumber) || null;
}

export async function updateOrderStatus(id: string, status: Order['status']): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .or(`id.eq.${id},order_number.eq.${id}`);

    if (error) throw new Error(error.message);
    return true;
  }

  const order = memoryOrders.find(o => o.id === id || o.order_number === id);
  if (order) {
    order.status = status;
    return true;
  }
  return false;
}

// ---------------- EVENT INQUIRIES ----------------

export async function createEventInquiry(data: {
  name: string;
  phone: string;
  email?: string;
  event_type: string;
  event_date: string;
  estimated_boxes: number;
  budget_range?: string;
  custom_requirements?: string;
}): Promise<EventInquiry> {
  const id = `inq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const inquiry: EventInquiry = {
    id,
    ...data,
    status: 'New',
    created_at: now
  };

  if (supabase) {
    const { data: inserted, error } = await supabase.from('event_inquiries').insert([inquiry]).select().single();
    if (error) throw new Error(error.message);
    return inserted;
  }

  memoryInquiries.unshift(inquiry);
  return inquiry;
}

export async function getAllEventInquiries(): Promise<EventInquiry[]> {
  if (supabase) {
    const { data, error } = await supabase.from('event_inquiries').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(i => ({
      ...i,
      estimated_boxes: Number(i.estimated_boxes)
    }));
  }
  return memoryInquiries;
}

export async function updateInquiryStatus(id: string, status: EventInquiry['status']): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase.from('event_inquiries').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  const inq = memoryInquiries.find(i => i.id === id);
  if (inq) {
    inq.status = status;
    return true;
  }
  return false;
}

// ---------------- CONTACT MESSAGES ----------------

export async function createContactMessage(data: {
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
}): Promise<ContactMessage> {
  const id = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const msg: ContactMessage = {
    id,
    ...data,
    status: 'Unread',
    created_at: now
  };

  if (supabase) {
    const { data: inserted, error } = await supabase.from('contact_messages').insert([msg]).select().single();
    if (error) throw new Error(error.message);
    return inserted;
  }

  memoryMessages.unshift(msg);
  return msg;
}

export async function getAllContactMessages(): Promise<ContactMessage[]> {
  if (supabase) {
    const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }
  return memoryMessages;
}

export async function updateMessageStatus(id: string, status: ContactMessage['status']): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase.from('contact_messages').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  const m = memoryMessages.find(msg => msg.id === id);
  if (m) {
    m.status = status;
    return true;
  }
  return false;
}

// ---------------- REAL REVIEWS (SUBMITTED & APPROVED) ----------------

export async function getApprovedReviews(): Promise<Review[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data.map(r => ({
        ...r,
        rating: Number(r.rating),
        is_approved: Boolean(r.is_approved)
      }));
    }
  }
  return memoryReviews.filter(r => r.is_approved);
}

export async function getAllReviews(): Promise<Review[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data.map(r => ({
        ...r,
        rating: Number(r.rating),
        is_approved: Boolean(r.is_approved)
      }));
    }
  }
  return memoryReviews;
}

export async function createReview(data: {
  customer_name: string;
  city?: string;
  rating: number;
  comment: string;
}): Promise<Review> {
  const id = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const review: Review = {
    id,
    customer_name: data.customer_name,
    city: data.city,
    rating: data.rating,
    comment: data.comment,
    is_approved: false, // requires admin approval before displaying on storefront
    created_at: now
  };

  if (supabase) {
    const { data: inserted, error } = await supabase.from('reviews').insert([review]).select().single();
    if (error) throw new Error(error.message);
    return {
      ...inserted,
      rating: Number(inserted.rating),
      is_approved: Boolean(inserted.is_approved)
    };
  }

  memoryReviews.unshift(review);
  return review;
}

export async function updateReviewApproval(id: string, is_approved: boolean): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase.from('reviews').update({ is_approved }).eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  const rev = memoryReviews.find(r => r.id === id);
  if (rev) {
    rev.is_approved = is_approved;
    return true;
  }
  return false;
}

export async function deleteReview(id: string): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  memoryReviews = memoryReviews.filter(r => r.id !== id);
  return true;
}

// ---------------- SETTINGS ----------------

export async function getShopSettings(): Promise<ShopSettings> {
  if (supabase) {
    const { data, error } = await supabase.from('settings').select('*');
    if (!error && data && data.length > 0) {
      const obj: Record<string, any> = { ...DEFAULT_SETTINGS };
      for (const row of data) {
        if (row.key === 'delivery_fee' || row.key === 'free_delivery_threshold') {
          obj[row.key] = Number(row.value);
        } else {
          obj[row.key] = row.value;
        }
      }
      return obj as ShopSettings;
    }
  }
  return memorySettings;
}

export async function updateShopSettings(data: Partial<ShopSettings>): Promise<ShopSettings> {
  if (supabase) {
    const current = await getShopSettings();
    const merged = { ...current, ...data };
    const rows = Object.entries(merged).map(([key, value]) => ({
      key,
      value: String(value)
    }));

    const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' });
    if (error) throw new Error(error.message);
    return merged;
  }

  memorySettings = { ...memorySettings, ...data };
  return memorySettings;
}

// ---------------- STORAGE ----------------

export async function uploadImageToSupabaseStorage(
  fileName: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `sweets/${Date.now()}_${cleanName}`;

  const { error: uploadError } = await supabase.storage
    .from('sweets-images')
    .upload(filePath, buffer, {
      contentType,
      upsert: true
    });

  if (uploadError) {
    throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
  }

  const { data: publicData } = supabase.storage
    .from('sweets-images')
    .getPublicUrl(filePath);

  return publicData.publicUrl;
}
