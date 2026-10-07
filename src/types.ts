export interface Product {
  id: string;
  name: string;
  category: 'Barfi' | 'Laddu' | 'Halwa' | 'Mithai' | 'Dry Fruit Sweets' | 'Cakes' | string;
  price_per_unit: number;
  unit: string; // 'kg' | 'piece' | 'box'
  description: string;
  image: string;
  is_featured: boolean;
  in_stock: boolean;
  ingredients: string;
  created_at: string;
}

export interface CartItem {
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
  items: CartItem[];
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
  bank_name: string;
  bank_title: string;
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
