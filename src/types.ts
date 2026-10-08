export type Language = 'en' | 'ur';

export interface Product {
  id: string;
  name: string;
  name_ur?: string;
  category: 'Barfi' | 'Laddu' | 'Halwa' | 'Mithai' | 'Dry Fruit Sweets' | 'Cakes' | string;
  sell_mode: 'kg' | 'piece' | 'both';
  price_per_kg?: number;
  price_per_piece?: number;
  price_per_unit: number; // backward compatibility
  unit: string; // 'kg' | 'piece' | 'box'
  piece_weight_g?: number;
  stock_grams: number;
  low_stock_threshold_grams: number;
  description: string;
  description_ur?: string;
  image: string;
  is_featured: boolean;
  in_stock: boolean;
  is_available: boolean;
  ingredients: string;
  created_at: string;
  updated_at?: string;
}

export interface GiftBox {
  id: string;
  name_en: string;
  name_ur?: string;
  size_grams: number;
  box_price: number;
  image_path?: string;
  is_active: boolean;
  created_at?: string;
}

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  name_ur?: string;
  category: string;
  price_per_unit: number;
  unit: string; // 'kg' | 'piece' | 'box'
  quantity: number;
  total: number;
  image?: string;
  is_gift_box?: boolean;
  box_description?: string;
}

export interface OrderStatusHistoryItem {
  id?: string;
  order_id?: string;
  status: string;
  changed_by?: string;
  note?: string;
  created_at: string;
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
  delivery_slot?: string;
  special_notes?: string;
  items: CartItem[];
  subtotal: number;
  delivery_fee: number;
  discount_amount?: number;
  loyalty_discount?: number;
  total: number;
  payment_method: 'cod' | 'bank' | 'jazzcash' | 'easypaisa';
  payment_status: 'pending' | 'verified' | 'rejected';
  payment_proof_path?: string;
  payment_note?: string;
  cancel_reason?: string;
  status: 'New' | 'Confirmed' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  created_at: string;
  status_history?: OrderStatusHistoryItem[];
}

export interface Coupon {
  id?: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount?: number;
  expiry_date?: string;
  is_active: boolean;
  usage_count?: number;
  created_at?: string;
}

export interface CustomerProfile {
  id: string;
  email?: string;
  phone?: string;
  full_name?: string;
  loyalty_points: number;
  saved_addresses: string[];
}

export interface EventInquiry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  event_type: string;
  event_date: string;
  estimated_boxes: number;
  guest_count?: number;
  budget_range?: string;
  custom_requirements?: string;
  status: 'New' | 'Contacted' | 'Quoted' | 'Confirmed' | 'Cancelled' | 'Archived';
  quote_amount?: number;
  quote_note?: string;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  is_read?: boolean;
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
  order_number?: string;
  created_at: string;
}

export interface ShopSettings {
  shop_name: string;
  tagline: string;
  shop_tagline?: string;
  phone: string;
  shop_phone?: string;
  whatsapp: string;
  shop_whatsapp?: string;
  shop_email?: string;
  address: string;
  city: string;
  timings: string;
  shop_timings?: string;
  delivery_areas: string;
  delivery_fee: number;
  free_delivery_threshold: number;
  minimum_order: number;
  payment_cod_enabled?: boolean;
  bank_name: string;
  bank_title: string;
  bank_account_name?: string;
  bank_iban: string;
  bank_account_no: string;
  bank_account_number?: string;
  jazzcash_title: string;
  jazzcash_account_name?: string;
  jazzcash_number: string;
  easypaisa_title: string;
  easypaisa_account_name?: string;
  easypaisa_number: string;
  social_instagram: string;
  social_facebook: string;
  social_tiktok?: string;
  about_text: string;
  pickup_enabled?: boolean;
  currency: string;
}
