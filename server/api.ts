import { Router, Request, Response, NextFunction } from 'express';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  clearAllProducts,
  bulkCreateProducts,
  createOrder,
  getAllOrders,
  getOrderByNumber,
  updateOrderStatus,
  createEventInquiry,
  getAllEventInquiries,
  updateInquiryStatus,
  createContactMessage,
  getAllContactMessages,
  updateMessageStatus,
  getShopSettings,
  updateShopSettings,
  uploadImageToSupabaseStorage,
  getApprovedReviews,
  getAllReviews,
  createReview,
  updateReviewApproval,
  deleteReview,
  supabase,
  isSupabaseConfigured
} from './db.ts';

const router = Router();

// Fallback admin credentials if Supabase Auth is not yet configured
const FALLBACK_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@mithassweets.com').trim().toLowerCase();
const FALLBACK_ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || 'mithas2026').trim();
const FALLBACK_STATIC_TOKEN = 'demo-admin-session-token-mithas';

// ---------------- RATE LIMITING MIDDLEWARE ----------------
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

function createRateLimiter(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const rawIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-client';
    const ip = rawIp.split(',')[0].trim();
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(429).json({
        error: 'Too many submissions. Please wait a moment and try again.',
        retryAfterSeconds
      });
      return;
    }

    record.count++;
    next();
  };
}

// 10 submissions per minute rate limit
const publicSubmissionLimiter = createRateLimiter(10, 60 * 1000);

// ---------------- ADMIN AUTHENTICATION MIDDLEWARE ----------------
async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Authorization header required' });
    return;
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    res.status(401).json({ error: 'Token missing in authorization header' });
    return;
  }

  // If Supabase is connected, verify session token via Supabase Auth
  if (supabase) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        res.status(401).json({ error: 'Invalid or expired Supabase admin session' });
        return;
      }
      (req as any).adminUser = user;
      next();
      return;
    } catch (err: any) {
      res.status(401).json({ error: 'Failed to verify admin credentials with Supabase' });
      return;
    }
  }

  // Fallback check when Supabase is in local demo/fallback mode
  if (token === FALLBACK_STATIC_TOKEN) {
    (req as any).adminUser = { email: FALLBACK_ADMIN_EMAIL };
    next();
    return;
  }

  res.status(403).json({ error: 'Invalid admin credentials' });
}

// ---------------- ADMIN LOGIN (SUPABASE AUTH) ----------------
router.post('/admin/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanPassword = String(password).trim();

  // If Supabase is configured, use real Supabase Auth
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword
      });

      if (error || !data.session) {
        res.status(401).json({
          error: error?.message || 'Invalid email or password in Supabase Auth'
        });
        return;
      }

      res.json({
        success: true,
        token: data.session.access_token,
        user: {
          id: data.user.id,
          email: data.user.email
        },
        mode: 'supabase',
        message: 'Authenticated successfully via Supabase Auth'
      });
      return;
    } catch (err: any) {
      console.error('Supabase Auth error:', err);
      res.status(500).json({ error: 'Authentication service error' });
      return;
    }
  }

  // Local fallback mode when SUPABASE_URL / SERVICE_ROLE_KEY are not yet configured
  if (cleanEmail === FALLBACK_ADMIN_EMAIL && cleanPassword === FALLBACK_ADMIN_PASSWORD) {
    res.json({
      success: true,
      token: FALLBACK_STATIC_TOKEN,
      user: { email: FALLBACK_ADMIN_EMAIL },
      mode: 'fallback',
      message: 'Logged in using development admin credentials. Set SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY in .env for live Supabase Auth.'
    });
    return;
  }

  res.status(401).json({
    error: `Invalid credentials. For local preview use: ${FALLBACK_ADMIN_EMAIL} / ${FALLBACK_ADMIN_PASSWORD}`
  });
});

// GET /api/admin/status (Checks whether Supabase is configured)
router.get('/admin/status', (_req: Request, res: Response) => {
  res.json({
    supabaseConfigured: isSupabaseConfigured,
    defaultEmail: FALLBACK_ADMIN_EMAIL
  });
});

// GET /api/test-supabase (Direct test endpoint to verify Supabase connection)
router.get('/test-supabase', async (_req: Request, res: Response) => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!isSupabaseConfigured || !supabase) {
    res.json({
      connected: false,
      message: 'Supabase URL ya SERVICE_ROLE_KEY set nahi hai ya placeholder hai.',
      help: 'Apni .env file me SUPABASE_URL aur SUPABASE_SERVICE_ROLE_KEY enter karein.',
      currentUrl: url ? (url.slice(0, 15) + '...') : 'not set',
      hasKey: Boolean(key)
    });
    return;
  }

  try {
    const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true });
    if (error) {
      res.json({
        connected: false,
        error: error.message,
        hint: 'Agar "relation public.products does not exist" error aye to supabase_schema.sql ko Supabase SQL Editor me run karein.'
      });
      return;
    }

    res.json({
      connected: true,
      message: 'Mubarak! Supabase Database kamyabi se connect ho chuki hai.',
      productsTableFound: true,
      totalProductsInDB: count ?? 0
    });
  } catch (err: any) {
    res.json({
      connected: false,
      error: err.message
    });
  }
});

// ---------------- STORAGE: IMAGE UPLOAD (SUPABASE STORAGE) ----------------
router.post('/admin/upload-image', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { fileName, base64Data, contentType } = req.body;

    if (!fileName || !base64Data) {
      res.status(400).json({ error: 'fileName and base64Data are required' });
      return;
    }

    // Strip data prefix if present (e.g. data:image/png;base64,...)
    const cleanBase64 = base64Data.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    if (buffer.length > 10 * 1024 * 1024) {
      res.status(400).json({ error: 'Image exceeds 10MB maximum limit' });
      return;
    }

    const mime = contentType || 'image/jpeg';
    const publicUrl = await uploadImageToSupabaseStorage(fileName, buffer, mime);

    res.json({
      success: true,
      url: publicUrl,
      message: 'Image uploaded successfully to Supabase sweets-images bucket'
    });
  } catch (err: any) {
    console.error('Image upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload image to Supabase Storage' });
  }
});

// ---------------- PRODUCTS ----------------

// GET /api/products
router.get('/products', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const products = await getAllProducts({ category, search });
    res.json({ products });
  } catch (err: any) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id
router.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ product });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products (Admin)
router.post('/products', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, category, price_per_unit, unit, description, image, is_featured, in_stock, ingredients } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Valid sweet name is required.' });
      return;
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
      res.status(400).json({ error: 'Category is required.' });
      return;
    }
    const numPrice = Number(price_per_unit);
    if (isNaN(numPrice) || numPrice <= 0) {
      res.status(400).json({ error: 'Price must be a positive number.' });
      return;
    }
    if (!unit || typeof unit !== 'string' || !unit.trim()) {
      res.status(400).json({ error: 'Unit (e.g. kg, piece) is required.' });
      return;
    }

    const created = await createProduct({
      name: String(name).trim(),
      category: String(category).trim(),
      price_per_unit: numPrice,
      unit: String(unit).trim(),
      description: String(description || '').trim(),
      image: String(image || '/src/assets/images/mithas_barfi_assortment_1791385657557.jpg'),
      is_featured: Boolean(is_featured),
      in_stock: in_stock !== undefined ? Boolean(in_stock) : true,
      ingredients: String(ingredients || '').trim()
    });

    res.status(201).json({ product: created });
  } catch (err: any) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: err.message || 'Failed to create product' });
  }
});

// PUT /api/products/:id (Admin)
router.put('/products/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const updated = await updateProduct(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ product: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update product' });
  }
});

// DELETE /api/products/:id (Admin)
router.delete('/products/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const success = await deleteProduct(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ success: true, message: 'Product deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete product' });
  }
});

// DELETE /api/products/all (Admin - Clear catalog)
router.delete('/products/all', requireAdmin, async (_req: Request, res: Response) => {
  try {
    await clearAllProducts();
    res.json({ success: true, message: 'All products removed from catalog' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to clear products' });
  }
});

// POST /api/products/bulk (Admin - Bulk import products)
router.post('/products/bulk', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      res.status(400).json({ error: 'Valid array of products is required' });
      return;
    }

    const cleaned = products.map((p: any) => ({
      name: String(p.name || '').trim(),
      category: String(p.category || 'Mithai').trim(),
      price_per_unit: Number(p.price_per_unit) || 1000,
      unit: String(p.unit || 'kg').trim(),
      description: String(p.description || '').trim(),
      image: String(p.image || '/src/assets/images/mithas_barfi_assortment_1791385657557.jpg').trim(),
      is_featured: Boolean(p.is_featured),
      in_stock: p.in_stock !== undefined ? Boolean(p.in_stock) : true,
      ingredients: String(p.ingredients || '').trim()
    })).filter((p: any) => p.name.length > 0);

    const created = await bulkCreateProducts(cleaned);
    res.status(201).json({ success: true, count: created.length, products: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to bulk import products' });
  }
});

// ---------------- ORDERS ----------------

// Helper for phone validation (at least 7 digits)
function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

// Helper for email validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/orders (Public, Rate Limited & Validated)
router.post('/orders', publicSubmissionLimiter, async (req: Request, res: Response) => {
  try {
    const {
      customer_name,
      customer_phone,
      customer_email,
      delivery_type,
      delivery_address,
      delivery_city,
      pickup_time,
      special_notes,
      items,
      payment_method
    } = req.body;

    // 1. Validate customer name
    if (!customer_name || typeof customer_name !== 'string' || customer_name.trim().length < 2) {
      res.status(400).json({ error: 'Please enter a valid customer name (at least 2 characters).' });
      return;
    }
    if (customer_name.trim().length > 100) {
      res.status(400).json({ error: 'Customer name is too long.' });
      return;
    }

    // 2. Validate phone number
    if (!customer_phone || typeof customer_phone !== 'string' || !isValidPhone(customer_phone)) {
      res.status(400).json({ error: 'Please enter a valid mobile/WhatsApp number (e.g. 0300 1234567).' });
      return;
    }

    // 3. Validate email if provided
    if (customer_email && (typeof customer_email !== 'string' || !isValidEmail(customer_email.trim()))) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    // 4. Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Your cart is empty. Add sweets to proceed.' });
      return;
    }

    // 5. Validate delivery type and address
    if (delivery_type !== 'pickup' && delivery_type !== 'delivery') {
      res.status(400).json({ error: 'Invalid delivery type. Must be delivery or pickup.' });
      return;
    }

    if (delivery_type === 'delivery') {
      if (!delivery_address || typeof delivery_address !== 'string' || delivery_address.trim().length < 5) {
        res.status(400).json({ error: 'Please provide a detailed delivery address (at least 5 characters).' });
        return;
      }
    }

    // 6. Validate payment method
    const validPaymentMethods = ['cod', 'bank', 'jazzcash', 'easypaisa'];
    const chosenPayment = validPaymentMethods.includes(payment_method) ? payment_method : 'cod';

    // 7. Calculate subtotal & construct validated items
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item.product_id) continue;
      const product = await getProductById(item.product_id);
      const price = product ? product.price_per_unit : Number(item.price_per_unit || 0);
      const qty = Math.max(0.25, Number(item.quantity) || 1);
      const itemTotal = Math.round(price * qty);
      subtotal += itemTotal;

      validatedItems.push({
        id: item.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        product_id: item.product_id,
        name: product ? product.name : String(item.name || 'Mithai'),
        category: product ? product.category : String(item.category || 'Mithai'),
        price_per_unit: price,
        unit: product ? product.unit : String(item.unit || 'kg'),
        quantity: qty,
        total: itemTotal,
        image: product?.image || item.image
      });
    }

    if (validatedItems.length === 0) {
      res.status(400).json({ error: 'No valid items found in the order.' });
      return;
    }

    const settings = await getShopSettings();
    let delivery_fee = 0;
    if (delivery_type === 'delivery') {
      delivery_fee = subtotal >= settings.free_delivery_threshold ? 0 : settings.delivery_fee;
    }

    const grandTotal = subtotal + delivery_fee;

    const order = await createOrder({
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      customer_email: customer_email ? customer_email.trim() : undefined,
      delivery_type: delivery_type,
      delivery_address: delivery_address ? delivery_address.trim() : undefined,
      delivery_city: delivery_city ? String(delivery_city).trim() : 'Lahore',
      pickup_time: pickup_time ? String(pickup_time).trim() : undefined,
      special_notes: special_notes ? String(special_notes).trim() : undefined,
      items: validatedItems,
      subtotal,
      delivery_fee,
      total: grandTotal,
      payment_method: chosenPayment as any
    });

    // Build WhatsApp dispatch link
    const itemsSummary = order.items
      .map(i => `• ${i.name} (${i.quantity} ${i.unit}): Rs. ${i.total.toLocaleString()}`)
      .join('\n');

    const shopDisplayName = settings.shop_name || 'Mithas Sweets';
    const cleanShopWhatsapp = (settings.whatsapp || '923027628552').replace(/[^0-9]/g, '') || '923027628552';

    const whatsappMessage = 
      `*${shopDisplayName} - New Order #${order.order_number}*\n\n` +
      `*Customer:* ${order.customer_name}\n` +
      `*Phone:* ${order.customer_phone}\n` +
      `*Fulfillment:* ${order.delivery_type === 'delivery' ? 'HOME DELIVERY' : 'STORE PICKUP'}\n` +
      (order.delivery_type === 'delivery' && order.delivery_address ? `*Delivery Address:* ${order.delivery_address}${order.delivery_city ? `, ${order.delivery_city}` : ''}\n` : '') +
      (order.delivery_type === 'pickup' ? `*Store Pickup:* Pickup details will be shared on WhatsApp after you place the order.\n` : '') +
      (order.pickup_time ? `*Pickup Timing:* ${order.pickup_time}\n` : '') +
      `*Payment:* ${order.payment_method.toUpperCase()}\n\n` +
      `*Items:*\n${itemsSummary}\n\n` +
      `*Subtotal:* Rs. ${order.subtotal.toLocaleString()}\n` +
      `*Delivery Fee:* Rs. ${order.delivery_fee.toLocaleString()}\n` +
      `*Total Amount:* Rs. ${order.total.toLocaleString()}\n` +
      (order.special_notes ? `*Notes:* ${order.special_notes}\n\n` : '\n') +
      `Thank you for choosing ${shopDisplayName}!`;

    const whatsappUrl = `https://wa.me/${cleanShopWhatsapp}?text=${encodeURIComponent(whatsappMessage)}`;

    res.status(201).json({
      order,
      whatsappUrl,
      whatsappMessage
    });
  } catch (err: any) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: err.message || 'Failed to place order. Please try again.' });
  }
});

// GET /api/orders/:number
router.get('/orders/:number', async (req: Request, res: Response) => {
  try {
    const order = await getOrderByNumber(req.params.number);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json({ order });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve order' });
  }
});

// GET /api/admin/orders
router.get('/admin/orders', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const orders = await getAllOrders();
    res.json({ orders });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PATCH /api/admin/orders/:id/status
router.patch('/admin/orders/:id/status', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['New', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid order status' });
      return;
    }
    const success = await updateOrderStatus(req.params.id, status);
    if (!success) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json({ success: true, status });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// ---------------- EVENT INQUIRIES ----------------

// POST /api/inquiries (Public, Rate Limited & Validated)
router.post('/inquiries', publicSubmissionLimiter, async (req: Request, res: Response) => {
  try {
    const { name, phone, email, event_type, event_date, estimated_boxes, budget_range, custom_requirements } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'Please enter your name (at least 2 characters).' });
      return;
    }
    if (!phone || typeof phone !== 'string' || !isValidPhone(phone)) {
      res.status(400).json({ error: 'Please enter a valid phone or WhatsApp number.' });
      return;
    }
    if (email && (typeof email !== 'string' || !isValidEmail(email.trim()))) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (!event_type || typeof event_type !== 'string' || !event_type.trim()) {
      res.status(400).json({ error: 'Event type is required.' });
      return;
    }
    if (!event_date || typeof event_date !== 'string' || !event_date.trim()) {
      res.status(400).json({ error: 'Event date is required.' });
      return;
    }
    const numBoxes = Number(estimated_boxes);
    if (isNaN(numBoxes) || numBoxes < 1 || numBoxes > 50000) {
      res.status(400).json({ error: 'Estimated boxes must be a valid number between 1 and 50,000.' });
      return;
    }

    const inquiry = await createEventInquiry({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : undefined,
      event_type: event_type.trim(),
      event_date: event_date.trim(),
      estimated_boxes: Math.floor(numBoxes),
      budget_range: budget_range ? String(budget_range).trim() : undefined,
      custom_requirements: custom_requirements ? String(custom_requirements).trim() : undefined,
    });

    res.status(201).json({ inquiry, message: 'Inquiry submitted successfully. Our team will contact you shortly!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit event inquiry' });
  }
});

// GET /api/admin/inquiries
router.get('/admin/inquiries', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const inquiries = await getAllEventInquiries();
    res.json({ inquiries });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

// PATCH /api/admin/inquiries/:id/status
router.patch('/admin/inquiries/:id/status', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const success = await updateInquiryStatus(req.params.id, status);
    if (!success) {
      res.status(404).json({ error: 'Inquiry not found' });
      return;
    }
    res.json({ success: true, status });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update inquiry status' });
  }
});

// ---------------- CONTACT MESSAGES ----------------

// POST /api/contact (Public, Rate Limited & Validated)
router.post('/contact', publicSubmissionLimiter, async (req: Request, res: Response) => {
  try {
    const { name, phone, email, subject, message } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'Please enter your name.' });
      return;
    }
    if (!phone || typeof phone !== 'string' || !isValidPhone(phone)) {
      res.status(400).json({ error: 'Please enter a valid phone number.' });
      return;
    }
    if (email && (typeof email !== 'string' || !isValidEmail(email.trim()))) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      res.status(400).json({ error: 'Subject is required.' });
      return;
    }
    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      res.status(400).json({ error: 'Message must be at least 5 characters.' });
      return;
    }

    const msg = await createContactMessage({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : undefined,
      subject: subject.trim(),
      message: message.trim()
    });

    res.status(201).json({ message: 'Thank you! Your message has been sent to our shop manager.', data: msg });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit contact message' });
  }
});

// GET /api/admin/messages
router.get('/admin/messages', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const messages = await getAllContactMessages();
    res.json({ messages });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch contact messages' });
  }
});

// PATCH /api/admin/messages/:id/status
router.patch('/admin/messages/:id/status', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const success = await updateMessageStatus(req.params.id, status);
    if (!success) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    res.json({ success: true, status });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update message status' });
  }
});

// ---------------- CUSTOMER REVIEWS (SUBMITTED & APPROVED) ----------------

// GET /api/reviews (Public: only returns approved reviews)
router.get('/reviews', async (_req: Request, res: Response) => {
  try {
    const reviews = await getApprovedReviews();
    res.json({ reviews });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// POST /api/reviews (Public: customers submit review, rate limited)
router.post('/reviews', publicSubmissionLimiter, async (req: Request, res: Response) => {
  try {
    const { customer_name, city, rating, comment } = req.body;
    if (!customer_name || typeof customer_name !== 'string' || customer_name.trim().length < 2) {
      res.status(400).json({ error: 'Please enter your name.' });
      return;
    }
    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
      return;
    }
    if (!comment || typeof comment !== 'string' || comment.trim().length < 5) {
      res.status(400).json({ error: 'Please write a review comment (at least 5 characters).' });
      return;
    }

    const review = await createReview({
      customer_name: customer_name.trim(),
      city: city ? String(city).trim() : undefined,
      rating: Math.round(numRating),
      comment: comment.trim()
    });

    res.status(201).json({
      review,
      message: 'Thank you! Your review has been submitted and will appear on the site once verified by the store owner.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit review' });
  }
});

// GET /api/admin/reviews (Admin: view all reviews with approval status)
router.get('/admin/reviews', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const reviews = await getAllReviews();
    res.json({ reviews });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// PATCH /api/admin/reviews/:id/approve (Admin: toggle approval)
router.patch('/admin/reviews/:id/approve', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { is_approved } = req.body;
    const success = await updateReviewApproval(req.params.id, Boolean(is_approved));
    if (!success) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }
    res.json({ success: true, is_approved: Boolean(is_approved) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update review approval' });
  }
});

// DELETE /api/admin/reviews/:id (Admin: delete review)
router.delete('/admin/reviews/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const success = await deleteReview(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }
    res.json({ success: true, message: 'Review deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// ---------------- SHOP SETTINGS & ADMIN AUTH ----------------

// GET /api/settings
router.get('/settings', async (_req: Request, res: Response) => {
  try {
    const settings = await getShopSettings();
    res.json({ settings });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// POST /api/admin/settings
router.post('/admin/settings', requireAdmin, async (req: Request, res: Response) => {
  try {
    const updated = await updateShopSettings(req.body);
    res.json({ settings: updated, message: 'Settings saved successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ---------------- AI MITHAS CONCIERGE (HIGH THINKING) ----------------
router.post('/ai/concierge', async (req: Request, res: Response) => {
  const { query, occasion, guestCount, dietaryPreferences, budget } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;

  const systemInstruction = `You are the Master Sweet Sommelier and Royal Confectionery Architect at Mithas Sweets (est. 1978).
Your specialty is designing perfect mithai assortments, calculating exact sweet portion requirements per guest for weddings, Eid celebrations, and corporate gifting, balancing flavor textures (creamy khoya, crispy pastry, nutty crunch, delicate syrups), and considering dietary needs (such as zero-sugar dry fruit sweets for elders).

Mithas Sweets menu categories:
- Barfi: Royal Pistachio Saffron Barfi (Rs. 1,950/kg), Kaju Katli Special (Rs. 2,400/kg), Desi Ghee Besan Barfi (Rs. 1,450/kg)
- Laddu: Royal Motichoor Laddu in Desi Ghee (Rs. 1,550/kg), Shahi Gond & Dry Fruit Laddu (Rs. 1,850/kg)
- Halwa: Multani Shahi Sohan Halwa (Rs. 2,200/kg), Habshi Halwa Delicacy (Rs. 2,050/kg)
- Mithai: Desi Ghee Gulab Jamun (Rs. 1,400/kg), Kolkata Spongy Rasgulla (Rs. 1,350/kg), Malai Cham Cham (Rs. 1,650/kg)
- Dry Fruit Sweets: Anjeer & Nut Roll Zero-Sugar (Rs. 2,550/kg), Medjool Date & Nut Bites (Rs. 2,250/kg)
- Cakes: Rasmalai Tres Leches Fusion Cake (Rs. 2,900/piece), Gulab Jamun Cheesecake (Rs. 3,100/piece)

Rules:
- Standard calculation rule: 2 to 3 pieces per guest (approx. 70g to 100g per person) for formal dinners, or 0.5 kg to 1 kg sweet box per family.
- Provide a structured, warm, and highly courteous recommendation:
  1. Box Concept & Flavour Harmony
  2. Recommended Mithas Sweets Breakdown (exact items and portion in kg)
  3. Total Quantity & Estimated Cost Estimate (in PKR Rs.)
  4. Packaging & Shelf-life Advice (e.g. syrups vs dry fruits)
- Keep formatting clean with bullet points and bold highlights.`;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    const guests = Number(guestCount) || 50;
    const estKg = Math.ceil(guests * 0.08);
    const boxes = Math.ceil(guests / 4);
    const estCost = estKg * 1850;

    const fallbackResponse = `### Royal Mithai Recommendation for ${occasion || 'Your Celebration'}

**1. Curated Box Concept: Shahi Dawat Harmony**
For ${guests} esteemed guests, we recommend a balanced four-corner assortment that pairs velvety richness with delicate crunch:
- **Kaju Katli Special**: Elegant diamond cuts providing an authentic royal welcome.
- **Royal Motichoor Laddu**: Micro-pearls fried in 100% pure desi ghee for auspicious festivities.
- **Royal Pistachio Saffron Barfi**: A visual centerpiece layered with crushed Iranian pistachios.
- **Anjeer & Nut Roll (Sugar-Free)**: Thoughtfully catered for elder guests who prefer wholesome dry-fruit natural sweetness.

**2. Exact Portion Calculations**
- Estimated total requirement: **${estKg} kg** (~${guests * 2} to ${guests * 3} individual pieces).
- Recommended packaging: **${boxes} custom luxury boxes** (approx. ${Math.round(estKg / boxes * 10) / 10} kg per gift box).

**3. Estimated Investment**
- Estimated Mithai Cost: **Rs. ${estCost.toLocaleString()}** (avg Rs. 1,850/kg).
- Custom gold-embossed celebratory ribbons and gift tags are included on orders over 25 boxes.

*Our master halwai can freshly prepare this batch within 24 hours of confirmation.*`;

    res.json({
      recommendation: fallbackResponse,
      modelUsed: 'rule-based-sommelier'
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const userPrompt = `Customer Request:
Occasion: ${occasion || 'Festive gathering'}
Number of Guests / Boxes: ${guestCount || 'Not specified'}
Dietary Preferences: ${dietaryPreferences || 'Standard traditional'}
Budget / Price target: ${budget || 'Flexible premium'}
Specific Customer Inquiry: ${query || 'Please suggest the best sweet combination and exact portion breakdown.'}`;

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: userPrompt,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH
        }
      }
    });

    res.json({
      recommendation: aiResponse.text,
      modelUsed: 'gemini-3.1-pro-preview'
    });
  } catch (err: any) {
    console.error('Error invoking Gemini 3.1 Pro Thinking Concierge:', err);
    const guests = Number(guestCount) || 50;
    const estKg = Math.ceil(guests * 0.08);
    res.json({
      recommendation: `### Mithas Royal Selection Plan\n\nFor ${guests} guests, our traditional master halwai recommends **${estKg} kg** distributed across:\n- **Royal Motichoor Laddu (Desi Ghee)**: 30%\n- **Kaju Katli Special**: 30%\n- **Royal Pistachio Saffron Barfi**: 25%\n- **Anjeer & Nut Roll**: 15%\n\nEstimated Cost: Rs. ${(estKg * 1850).toLocaleString()}.\nPlease submit an inquiry form or message us directly on WhatsApp for custom box branding!`,
      modelUsed: 'fallback'
    });
  }
});

export default router;
