import { Product, CartItem, Order, EventInquiry, ContactMessage, ShopSettings } from '../types';

export const api = {
  // Products
  async getProducts(params?: { category?: string; search?: string }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All') query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    
    const res = await fetch(`/api/products?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load products');
    const data = await res.json();
    return data.products;
  },

  async getProduct(id: string): Promise<Product> {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) throw new Error('Product not found');
    const data = await res.json();
    return data.product;
  },

  async createProduct(token: string, product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(product)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create product');
    }
    const data = await res.json();
    return data.product;
  },

  async updateProduct(token: string, id: string, product: Partial<Product>): Promise<Product> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(product)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update product');
    }
    const data = await res.json();
    return data.product;
  },

  async deleteProduct(token: string, id: string): Promise<void> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to delete product');
  },

  async clearAllProducts(token: string): Promise<void> {
    const res = await fetch('/api/products/all', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to clear catalog');
  },

  async bulkImportProducts(token: string, products: any[]): Promise<{ count: number; products: Product[] }> {
    const res = await fetch('/api/products/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ products })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to bulk import products');
    }
    return res.json();
  },

  // Storage: Upload Product Image to Supabase Storage
  async uploadImage(token: string, file: File): Promise<string> {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/admin/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        fileName: file.name,
        base64Data,
        contentType: file.type || 'image/jpeg'
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload image to Supabase Storage');
    }

    const data = await res.json();
    return data.url;
  },

  // Orders
  async createOrder(payload: {
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    delivery_type: 'delivery' | 'pickup';
    delivery_address?: string;
    delivery_city?: string;
    pickup_time?: string;
    special_notes?: string;
    items: CartItem[];
    payment_method: 'cod' | 'bank' | 'jazzcash' | 'easypaisa';
  }): Promise<{ order: Order; whatsappUrl: string; whatsappMessage: string }> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to place order');
    }
    return res.json();
  },

  async getOrderByNumber(orderNumber: string): Promise<Order> {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}`);
    if (!res.ok) throw new Error('Order not found');
    const data = await res.json();
    return data.order;
  },

  async getAdminOrders(token: string): Promise<Order[]> {
    const res = await fetch('/api/admin/orders', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load orders');
    const data = await res.json();
    return data.orders;
  },

  async updateOrderStatus(token: string, id: string, status: Order['status']): Promise<void> {
    const res = await fetch(`/api/admin/orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update status');
  },

  // Events & Bulk inquiries
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
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit inquiry');
    }
    return res.json();
  },

  async getAdminInquiries(token: string): Promise<EventInquiry[]> {
    const res = await fetch('/api/admin/inquiries', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load inquiries');
    const data = await res.json();
    return data.inquiries;
  },

  async updateInquiryStatus(token: string, id: string, status: EventInquiry['status']): Promise<void> {
    const res = await fetch(`/api/admin/inquiries/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update inquiry status');
  },

  // Contact messages
  async submitContact(payload: {
    name: string;
    phone: string;
    email?: string;
    subject: string;
    message: string;
  }): Promise<{ message: string }> {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to send message');
    }
    return res.json();
  },

  async getAdminMessages(token: string): Promise<ContactMessage[]> {
    const res = await fetch('/api/admin/messages', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load messages');
    const data = await res.json();
    return data.messages;
  },

  async updateMessageStatus(token: string, id: string, status: ContactMessage['status']): Promise<void> {
    const res = await fetch(`/api/admin/messages/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update message status');
  },

  // Shop settings
  async getSettings(): Promise<ShopSettings> {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to load settings');
    const data = await res.json();
    return data.settings;
  },

  async updateSettings(token: string, settings: Partial<ShopSettings>): Promise<ShopSettings> {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    const data = await res.json();
    return data.settings;
  },

  // Customer Reviews
  async getReviews(): Promise<import('../types').Review[]> {
    const res = await fetch('/api/reviews');
    if (!res.ok) throw new Error('Failed to load reviews');
    const data = await res.json();
    return data.reviews;
  },

  async submitReview(payload: {
    customer_name: string;
    city?: string;
    rating: number;
    comment: string;
  }): Promise<{ message: string }> {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit review');
    }
    return res.json();
  },

  async getAdminReviews(token: string): Promise<import('../types').Review[]> {
    const res = await fetch('/api/admin/reviews', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load reviews');
    const data = await res.json();
    return data.reviews;
  },

  async updateReviewApproval(token: string, id: string, is_approved: boolean): Promise<void> {
    const res = await fetch(`/api/admin/reviews/${id}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ is_approved })
    });
    if (!res.ok) throw new Error('Failed to update review status');
  },

  async deleteReview(token: string, id: string): Promise<void> {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to delete review');
  },

  // Admin login (Email + Password via Supabase Auth)
  async adminLogin(email: string, password: string): Promise<{ token: string; user?: any; mode?: string }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Invalid admin credentials');
    }
    return res.json();
  },

  // Admin backend status
  async getAdminStatus(): Promise<{ supabaseConfigured: boolean; defaultEmail: string }> {
    const res = await fetch('/api/admin/status');
    if (!res.ok) return { supabaseConfigured: false, defaultEmail: 'admin@mithassweets.com' };
    return res.json();
  },

  async testSupabase(): Promise<{ connected: boolean; message?: string; error?: string; help?: string; hint?: string; totalProductsInDB?: number }> {
    const res = await fetch('/api/test-supabase');
    if (!res.ok) return { connected: false, error: 'Server error testing Supabase' };
    return res.json();
  },

  // AI Concierge
  async getAiConciergeRecommendation(payload: {
    query?: string;
    occasion?: string;
    guestCount?: number | string;
    dietaryPreferences?: string;
    budget?: string;
  }): Promise<{ recommendation: string; modelUsed: string }> {
    const res = await fetch('/api/ai/concierge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new Error('Failed to generate recommendation');
    }
    return res.json();
  }
};
