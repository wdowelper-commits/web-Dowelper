-- ====================================================================
-- MITHAS SWEETS - FULL PRODUCTION SUPABASE SCHEMA (V2)
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- Safe to run multiple times (idempotent with IF NOT EXISTS & OR REPLACE)
-- ====================================================================

-- 1. Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. User Roles Table (RBAC for Owner / Staff)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'staff')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Helper function: Check if current auth user is Owner Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'owner'
  );
END;
$$;

-- 3. Products Table (Mithai Catalog with Stock in Grams & Urdu details)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  name_ur TEXT,
  category TEXT NOT NULL,
  sell_mode TEXT DEFAULT 'kg' CHECK (sell_mode IN ('kg', 'piece', 'both')),
  price_per_kg NUMERIC,
  price_per_piece NUMERIC,
  price_per_unit NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  piece_weight_g INTEGER DEFAULT 50,
  stock_grams INTEGER DEFAULT 5000,
  low_stock_threshold_grams INTEGER DEFAULT 500,
  description TEXT,
  description_ur TEXT,
  image TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  in_stock BOOLEAN DEFAULT TRUE,
  is_available BOOLEAN DEFAULT TRUE,
  ingredients TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Alter table to ensure any missing columns exist if upgrading existing table
DO $$
BEGIN
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_grams INTEGER DEFAULT 5000;
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS low_stock_threshold_grams INTEGER DEFAULT 500;
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sell_mode TEXT DEFAULT 'kg' CHECK (sell_mode IN ('kg', 'piece', 'both'));
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_per_kg NUMERIC;
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_per_piece NUMERIC;
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS piece_weight_g INTEGER DEFAULT 50;
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name_ur TEXT;
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description_ur TEXT;
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW());
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- 4. Gift Boxes Table
CREATE TABLE IF NOT EXISTS public.gift_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ur TEXT,
  size_grams INTEGER NOT NULL,
  box_price NUMERIC NOT NULL,
  image_path TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  delivery_type TEXT NOT NULL,
  delivery_address TEXT,
  delivery_city TEXT,
  pickup_time TEXT,
  delivery_slot TEXT,
  special_notes TEXT,
  items JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  loyalty_discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'verified', 'rejected')),
  payment_proof_path TEXT,
  payment_note TEXT,
  cancel_reason TEXT,
  status TEXT DEFAULT 'New' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure newly added columns exist in orders if upgrading
DO $$
BEGIN
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'verified', 'rejected'));
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_proof_path TEXT;
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_note TEXT;
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_slot TEXT;
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS loyalty_discount NUMERIC DEFAULT 0;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- 6. Order Status History Table
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_by TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  min_order_amount NUMERIC DEFAULT 0,
  max_discount NUMERIC,
  expiry_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Customers Table (Supabase Auth linked)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  full_name TEXT,
  loyalty_points INTEGER DEFAULT 0,
  saved_addresses JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. Event Inquiries Table
CREATE TABLE IF NOT EXISTS public.event_inquiries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  event_type TEXT NOT NULL,
  event_date TEXT NOT NULL,
  estimated_boxes INTEGER NOT NULL,
  budget_range TEXT,
  custom_requirements TEXT,
  status TEXT DEFAULT 'New' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. Contact Messages Table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'Unread' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 11. Customer Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  customer_name TEXT NOT NULL,
  city TEXT,
  rating INTEGER DEFAULT 5 NOT NULL,
  comment TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE NOT NULL,
  order_number TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 12. Settings Table (Key/Value store for shop configuration)
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Insert default settings if not exists
INSERT INTO public.settings (key, value) VALUES
  ('shop_name', 'Mithas Sweets'),
  ('tagline', 'Fresh Traditional Sweets & Confections'),
  ('phone', '03027628552'),
  ('whatsapp', '923027628552'),
  ('address', ''),
  ('city', ''),
  ('timings', 'Monday – Sunday: 9:00 AM – 11:00 PM'),
  ('delivery_areas', 'Delivery available in covered areas'),
  ('delivery_fee', '250'),
  ('free_delivery_threshold', '4000'),
  ('minimum_order', '500'),
  ('bank_name', 'Meezan Bank Limited'),
  ('bank_title', 'Mithas Sweets & Bakers'),
  ('bank_iban', 'PK00MEZN0000001234567890'),
  ('bank_account_no', '02010103456789'),
  ('jazzcash_title', 'Mithas Sweets'),
  ('jazzcash_number', '03027628552'),
  ('easypaisa_title', 'Mithas Sweets'),
  ('easypaisa_number', '03027628552'),
  ('social_instagram', 'https://instagram.com/mithassweets'),
  ('social_facebook', 'https://facebook.com/mithassweets'),
  ('about_text', 'Welcome to our shop! We offer freshly prepared traditional sweets, barfi, laddus, and customized gift boxes prepared daily with the finest pure ingredients.'),
  ('currency', 'PKR')
ON CONFLICT (key) DO NOTHING;

-- Seed default coupons if not exists
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_amount, is_active) VALUES
  ('MITHAS10', 'percentage', 10, 1500, true),
  ('SWEET200', 'fixed', 200, 2000, true),
  ('WELCOME', 'percentage', 5, 1000, true)
ON CONFLICT (code) DO NOTHING;

-- Seed default gift boxes if not exists
INSERT INTO public.gift_boxes (name_en, name_ur, size_grams, box_price, image_path, is_active) VALUES
  ('Classic Royal Gold Box (500g)', 'شاہی گولڈ ڈبہ (500 گرام)', 500, 150, 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=600&q=80', true),
  ('Festive Celebration Velvet Box (1kg)', 'جشن مبارک مخمل ڈبہ (1 کلو)', 1000, 250, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', true),
  ('Grand Luxury Heritage Hamper (2kg)', 'شاہانہ لگژری ڈبہ (2 کلو)', 2000, 450, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80', true)
ON CONFLICT DO NOTHING;

-- ====================================================================
-- TRIGGERS & FUNCTIONS
-- ====================================================================

-- Trigger: When stock_grams <= 0 set is_available = false and in_stock = false
CREATE OR REPLACE FUNCTION public.check_product_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.stock_grams <= 0 THEN
    NEW.is_available := FALSE;
    NEW.in_stock := FALSE;
  ELSE
    NEW.is_available := TRUE;
    NEW.in_stock := TRUE;
  END IF;
  NEW.updated_at := TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_product_stock ON public.products;
CREATE TRIGGER trigger_check_product_stock
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.check_product_stock();

-- ====================================================================
-- RPC 1: place_order
-- Reads product prices & stock from database (never trusts payload prices)
-- Checks stock_grams, deducts stock
-- Reads delivery_fee & minimum_order from settings
-- Validates Pakistani phone format
-- Generates order_number (MS-YYYY-XXXX)
-- Inserts order + order_status_history
-- Returns order_number
-- Rolls back atomically on error
-- ====================================================================
CREATE OR REPLACE FUNCTION public.place_order(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_customer_name TEXT;
  v_customer_phone TEXT;
  v_customer_email TEXT;
  v_delivery_type TEXT;
  v_delivery_address TEXT;
  v_delivery_city TEXT;
  v_pickup_time TEXT;
  v_delivery_slot TEXT;
  v_special_notes TEXT;
  v_payment_method TEXT;
  v_coupon_code TEXT;
  v_loyalty_points_redeemed INTEGER;
  
  v_clean_phone TEXT;
  v_min_order NUMERIC := 0;
  v_delivery_fee_setting NUMERIC := 250;
  v_free_threshold NUMERIC := 4000;
  v_computed_subtotal NUMERIC := 0;
  v_computed_delivery_fee NUMERIC := 0;
  v_computed_discount NUMERIC := 0;
  v_computed_loyalty_discount NUMERIC := 0;
  v_computed_total NUMERIC := 0;
  
  v_item JSONB;
  v_product RECORD;
  v_req_qty NUMERIC;
  v_req_unit TEXT;
  v_grams_to_deduct INTEGER;
  v_item_unit_price NUMERIC;
  v_item_line_total NUMERIC;
  v_processed_items JSONB := '[]'::jsonb;
  
  v_order_id TEXT;
  v_order_number TEXT;
  v_year TEXT;
  v_seq_num TEXT;
  v_points_earned INTEGER;
BEGIN
  -- 1. Extract and validate customer contact
  v_customer_name := TRIM(COALESCE(payload->>'customer_name', ''));
  v_customer_phone := TRIM(COALESCE(payload->>'customer_phone', ''));
  v_customer_email := TRIM(COALESCE(payload->>'customer_email', ''));
  v_delivery_type := LOWER(TRIM(COALESCE(payload->>'delivery_type', 'delivery')));
  v_delivery_address := TRIM(COALESCE(payload->>'delivery_address', ''));
  v_delivery_city := TRIM(COALESCE(payload->>'delivery_city', ''));
  v_pickup_time := TRIM(COALESCE(payload->>'pickup_time', ''));
  v_delivery_slot := TRIM(COALESCE(payload->>'delivery_slot', 'Morning'));
  v_special_notes := TRIM(COALESCE(payload->>'special_notes', ''));
  v_payment_method := LOWER(TRIM(COALESCE(payload->>'payment_method', 'cod')));
  v_coupon_code := UPPER(TRIM(COALESCE(payload->>'coupon_code', '')));
  v_loyalty_points_redeemed := COALESCE((payload->>'loyalty_points_redeemed')::INTEGER, 0);

  IF v_customer_name = '' THEN
    RAISE EXCEPTION 'Customer name is required';
  END IF;

  -- Validate Pakistani phone format (03XXXXXXXXX or +923XXXXXXXXX or 923XXXXXXXXX)
  v_clean_phone := REGEXP_REPLACE(v_customer_phone, '[^0-9]', '', 'g');
  IF v_clean_phone LIKE '92%' AND LENGTH(v_clean_phone) = 12 THEN
    v_clean_phone := '0' || SUBSTRING(v_clean_phone FROM 3);
  END IF;

  IF NOT (v_clean_phone ~ '^03[0-9]{9}$') THEN
    RAISE EXCEPTION 'Invalid Pakistani phone number. Please enter a valid number (e.g. 03001234567)';
  END IF;

  IF v_delivery_type = 'delivery' AND v_delivery_address = '' THEN
    RAISE EXCEPTION 'Delivery address is required for home delivery';
  END IF;

  -- 2. Read shop settings from settings table
  SELECT COALESCE(NULLIF(value, '')::NUMERIC, 250) INTO v_delivery_fee_setting
  FROM public.settings WHERE key = 'delivery_fee';
  IF NOT FOUND THEN v_delivery_fee_setting := 250; END IF;

  SELECT COALESCE(NULLIF(value, '')::NUMERIC, 4000) INTO v_free_threshold
  FROM public.settings WHERE key = 'free_delivery_threshold';
  IF NOT FOUND THEN v_free_threshold := 4000; END IF;

  SELECT COALESCE(NULLIF(value, '')::NUMERIC, 0) INTO v_min_order
  FROM public.settings WHERE key = 'minimum_order';
  IF NOT FOUND THEN v_min_order := 0; END IF;

  -- 3. Loop over items and recompute price + verify/deduct stock server-side
  IF payload->'items' IS NULL OR jsonb_array_length(payload->'items') = 0 THEN
    RAISE EXCEPTION 'Cart is empty. Please add items before placing order.';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
  LOOP
    -- If it is a custom gift box line item
    IF (v_item->>'is_gift_box')::BOOLEAN IS TRUE THEN
      v_req_qty := COALESCE((v_item->>'quantity')::NUMERIC, 1);
      v_item_unit_price := COALESCE((v_item->>'price_per_unit')::NUMERIC, 150);
      v_item_line_total := ROUND(v_req_qty * v_item_unit_price);
      v_computed_subtotal := v_computed_subtotal + v_item_line_total;

      v_processed_items := v_processed_items || jsonb_build_object(
        'product_id', v_item->>'product_id',
        'name', v_item->>'name',
        'name_ur', v_item->>'name_ur',
        'category', 'Gift Box',
        'unit', 'box',
        'quantity', v_req_qty,
        'price_per_unit', v_item_unit_price,
        'total', v_item_line_total,
        'image', v_item->>'image'
      );
    ELSE
      -- Standard Mithai product from database
      SELECT * INTO v_product
      FROM public.products
      WHERE id = (v_item->>'product_id')
      FOR UPDATE; -- lock row to prevent race conditions on stock

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with ID % not found', (v_item->>'product_id');
      END IF;

      IF v_product.is_available IS FALSE OR v_product.in_stock IS FALSE THEN
        RAISE EXCEPTION 'Product "%" is currently out of stock', v_product.name;
      END IF;

      v_req_qty := COALESCE((v_item->>'quantity')::NUMERIC, 1);
      v_req_unit := COALESCE(v_item->>'unit', v_product.unit);

      -- Calculate grams to deduct based on unit
      IF v_req_unit = 'kg' THEN
        v_grams_to_deduct := ROUND(v_req_qty * 1000);
        v_item_unit_price := COALESCE(v_product.price_per_kg, v_product.price_per_unit);
      ELSE
        -- piece mode
        v_grams_to_deduct := ROUND(v_req_qty * COALESCE(v_product.piece_weight_g, 50));
        v_item_unit_price := COALESCE(v_product.price_per_piece, ROUND(v_product.price_per_unit / 20));
      END IF;

      -- Check stock
      IF v_product.stock_grams < v_grams_to_deduct THEN
        RAISE EXCEPTION 'Insufficient stock for "%". Available: % grams, Requested: % grams',
          v_product.name, v_product.stock_grams, v_grams_to_deduct;
      END IF;

      -- Deduct stock
      UPDATE public.products
      SET stock_grams = stock_grams - v_grams_to_deduct
      WHERE id = v_product.id;

      v_item_line_total := ROUND(v_req_qty * v_item_unit_price);
      v_computed_subtotal := v_computed_subtotal + v_item_line_total;

      v_processed_items := v_processed_items || jsonb_build_object(
        'product_id', v_product.id,
        'name', v_product.name,
        'name_ur', v_product.name_ur,
        'category', v_product.category,
        'unit', v_req_unit,
        'quantity', v_req_qty,
        'price_per_unit', v_item_unit_price,
        'total', v_item_line_total,
        'image', v_product.image
      );
    END IF;
  END LOOP;

  -- Verify minimum order
  IF v_min_order > 0 AND v_computed_subtotal < v_min_order THEN
    RAISE EXCEPTION 'Minimum order amount is Rs. %', v_min_order;
  END IF;

  -- 4. Calculate delivery fee
  IF v_delivery_type = 'delivery' THEN
    IF v_computed_subtotal >= v_free_threshold THEN
      v_computed_delivery_fee := 0;
    ELSE
      v_computed_delivery_fee := v_delivery_fee_setting;
    END IF;
  ELSE
    v_computed_delivery_fee := 0;
  END IF;

  -- 5. Validate and apply coupon if provided
  IF v_coupon_code <> '' THEN
    DECLARE
      v_coupon RECORD;
    BEGIN
      SELECT * INTO v_coupon FROM public.coupons
      WHERE code = v_coupon_code AND is_active = TRUE
        AND (expiry_date IS NULL OR expiry_date > NOW());

      IF FOUND THEN
        IF v_computed_subtotal >= COALESCE(v_coupon.min_order_amount, 0) THEN
          IF v_coupon.discount_type = 'percentage' THEN
            v_computed_discount := ROUND((v_computed_subtotal * v_coupon.discount_value) / 100);
            IF v_coupon.max_discount IS NOT NULL AND v_computed_discount > v_coupon.max_discount THEN
              v_computed_discount := v_coupon.max_discount;
            END IF;
          ELSE
            v_computed_discount := LEAST(v_coupon.discount_value, v_computed_subtotal);
          END IF;

          UPDATE public.coupons SET usage_count = usage_count + 1 WHERE code = v_coupon.code;
        END IF;
      END IF;
    END;
  END IF;

  -- 6. Apply loyalty points (1 point = Rs. 1 discount)
  IF v_loyalty_points_redeemed > 0 THEN
    v_computed_loyalty_discount := LEAST(v_loyalty_points_redeemed, GREATEST(v_computed_subtotal - v_computed_discount, 0));
  END IF;

  v_computed_total := GREATEST(v_computed_subtotal - v_computed_discount - v_computed_loyalty_discount + v_computed_delivery_fee, 0);

  -- 7. Generate order reference MS-YYYY-XXXX
  v_year := TO_CHAR(NOW(), 'YYYY');
  v_seq_num := LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');
  v_order_number := 'MS-' || v_year || '-' || v_seq_num;
  v_order_id := gen_random_uuid()::text;

  -- 8. Insert into orders table
  INSERT INTO public.orders (
    id,
    order_number,
    customer_name,
    customer_phone,
    customer_email,
    delivery_type,
    delivery_address,
    delivery_city,
    pickup_time,
    delivery_slot,
    special_notes,
    items,
    subtotal,
    delivery_fee,
    discount_amount,
    loyalty_discount,
    total,
    payment_method,
    payment_status,
    status
  ) VALUES (
    v_order_id,
    v_order_number,
    v_customer_name,
    v_clean_phone,
    v_customer_email,
    v_delivery_type,
    v_delivery_address,
    v_delivery_city,
    v_pickup_time,
    v_delivery_slot,
    v_special_notes,
    v_processed_items,
    v_computed_subtotal,
    v_computed_delivery_fee,
    v_computed_discount,
    v_computed_loyalty_discount,
    v_computed_total,
    v_payment_method,
    'pending',
    'New'
  );

  -- 9. Insert initial status history
  INSERT INTO public.order_status_history (
    order_id,
    status,
    changed_by,
    note
  ) VALUES (
    v_order_id,
    'New',
    'System',
    'Order received through online storefront'
  );

  -- 10. Award loyalty points to authenticated user if applicable (1 point per Rs. 100)
  IF auth.uid() IS NOT NULL THEN
    v_points_earned := FLOOR(v_computed_total / 100);
    UPDATE public.customers
    SET loyalty_points = GREATEST(loyalty_points - v_loyalty_points_redeemed, 0) + v_points_earned
    WHERE id = auth.uid();
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total', v_computed_total,
    'subtotal', v_computed_subtotal,
    'delivery_fee', v_computed_delivery_fee,
    'discount', v_computed_discount + v_computed_loyalty_discount
  );
END;
$$;

-- ====================================================================
-- RPC 2: track_order
-- Returns limited order info only when BOTH order_number AND phone match
-- No direct table access for guests
-- ====================================================================
CREATE OR REPLACE FUNCTION public.track_order(p_order_number TEXT, p_phone TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_clean_phone TEXT;
  v_order RECORD;
  v_history JSONB;
BEGIN
  v_clean_phone := REGEXP_REPLACE(p_phone, '[^0-9]', '', 'g');
  IF v_clean_phone LIKE '92%' AND LENGTH(v_clean_phone) = 12 THEN
    v_clean_phone := '0' || SUBSTRING(v_clean_phone FROM 3);
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE UPPER(order_number) = UPPER(TRIM(p_order_number))
    AND customer_phone = v_clean_phone;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'status', status,
      'note', note,
      'created_at', created_at
    ) ORDER BY created_at ASC
  ), '[]'::jsonb) INTO v_history
  FROM public.order_status_history
  WHERE order_id = v_order.id;

  RETURN jsonb_build_object(
    'order_number', v_order.order_number,
    'customer_name', v_order.customer_name,
    'status', v_order.status,
    'delivery_type', v_order.delivery_type,
    'delivery_slot', v_order.delivery_slot,
    'pickup_time', v_order.pickup_time,
    'payment_method', v_order.payment_method,
    'payment_status', v_order.payment_status,
    'payment_proof_path', v_order.payment_proof_path,
    'items', v_order.items,
    'subtotal', v_order.subtotal,
    'delivery_fee', v_order.delivery_fee,
    'total', v_order.total,
    'created_at', v_order.created_at,
    'status_history', v_history
  );
END;
$$;

-- ====================================================================
-- RPC 3: attach_payment_proof
-- Updates payment_proof_path only when order_number + phone match
-- ====================================================================
CREATE OR REPLACE FUNCTION public.attach_payment_proof(p_order_number TEXT, p_phone TEXT, p_file_path TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_clean_phone TEXT;
BEGIN
  v_clean_phone := REGEXP_REPLACE(p_phone, '[^0-9]', '', 'g');
  IF v_clean_phone LIKE '92%' AND LENGTH(v_clean_phone) = 12 THEN
    v_clean_phone := '0' || SUBSTRING(v_clean_phone FROM 3);
  END IF;

  UPDATE public.orders
  SET 
    payment_proof_path = p_file_path,
    payment_status = 'pending'
  WHERE UPPER(order_number) = UPPER(TRIM(p_order_number))
    AND customer_phone = v_clean_phone;

  IF FOUND THEN
    INSERT INTO public.order_status_history (
      order_id,
      status,
      changed_by,
      note
    ) SELECT id, status, 'Customer', 'Payment proof screenshot uploaded'
    FROM public.orders
    WHERE UPPER(order_number) = UPPER(TRIM(p_order_number));

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- ====================================================================
-- RPC 4: validate_coupon
-- ====================================================================
CREATE OR REPLACE FUNCTION public.validate_coupon(p_code TEXT, p_subtotal NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_coupon RECORD;
  v_discount NUMERIC := 0;
BEGIN
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE UPPER(code) = UPPER(TRIM(p_code))
    AND is_active = TRUE
    AND (expiry_date IS NULL OR expiry_date > NOW());

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Coupon code is invalid or expired');
  END IF;

  IF p_subtotal < COALESCE(v_coupon.min_order_amount, 0) THEN
    RETURN jsonb_build_object(
      'valid', false, 
      'message', FORMAT('Minimum order amount for this coupon is Rs. %s', v_coupon.min_order_amount)
    );
  END IF;

  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := ROUND((p_subtotal * v_coupon.discount_value) / 100);
    IF v_coupon.max_discount IS NOT NULL AND v_discount > v_coupon.max_discount THEN
      v_discount := v_coupon.max_discount;
    END IF;
  ELSE
    v_discount := LEAST(v_coupon.discount_value, p_subtotal);
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'code', v_coupon.code,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'discount_amount', v_discount
  );
END;
$$;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Products: Public can read available products; Admin has full access
DROP POLICY IF EXISTS "Public read available products" ON public.products;
CREATE POLICY "Public read available products" ON public.products
  FOR SELECT USING (is_available = TRUE OR in_stock = TRUE);

DROP POLICY IF EXISTS "Admin full access products" ON public.products;
CREATE POLICY "Admin full access products" ON public.products
  FOR ALL USING (public.is_admin());

-- Gift Boxes: Public can read active boxes; Admin has full access
DROP POLICY IF EXISTS "Public read active gift boxes" ON public.gift_boxes;
CREATE POLICY "Public read active gift boxes" ON public.gift_boxes
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admin full access gift boxes" ON public.gift_boxes;
CREATE POLICY "Admin full access gift boxes" ON public.gift_boxes
  FOR ALL USING (public.is_admin());

-- Orders: NO public direct SELECT or INSERT; Guests use place_order / track_order RPCs; Admin has full access
DROP POLICY IF EXISTS "Admin full access orders" ON public.orders;
CREATE POLICY "Admin full access orders" ON public.orders
  FOR ALL USING (public.is_admin());

-- Order Status History: Admin only direct access
DROP POLICY IF EXISTS "Admin full access order status history" ON public.order_status_history;
CREATE POLICY "Admin full access order status history" ON public.order_status_history
  FOR ALL USING (public.is_admin());

-- User Roles: Admin only
DROP POLICY IF EXISTS "Admin full access user roles" ON public.user_roles;
CREATE POLICY "Admin full access user roles" ON public.user_roles
  FOR ALL USING (public.is_admin());

-- Event Inquiries: Public can INSERT; Admin has full access
DROP POLICY IF EXISTS "Public can submit event inquiries" ON public.event_inquiries;
CREATE POLICY "Public can submit event inquiries" ON public.event_inquiries
  FOR INSERT WITH CHECK (name <> '' AND phone <> '');

DROP POLICY IF EXISTS "Admin full access event inquiries" ON public.event_inquiries;
CREATE POLICY "Admin full access event inquiries" ON public.event_inquiries
  FOR ALL USING (public.is_admin());

-- Contact Messages: Public can INSERT; Admin has full access
DROP POLICY IF EXISTS "Public can submit contact messages" ON public.contact_messages;
CREATE POLICY "Public can submit contact messages" ON public.contact_messages
  FOR INSERT WITH CHECK (name <> '' AND phone <> '' AND message <> '');

DROP POLICY IF EXISTS "Admin full access contact messages" ON public.contact_messages;
CREATE POLICY "Admin full access contact messages" ON public.contact_messages
  FOR ALL USING (public.is_admin());

-- Reviews: Public can SELECT approved reviews; Public can INSERT; Admin has full access
DROP POLICY IF EXISTS "Public read approved reviews" ON public.reviews;
CREATE POLICY "Public read approved reviews" ON public.reviews
  FOR SELECT USING (is_approved = TRUE);

DROP POLICY IF EXISTS "Public can submit reviews" ON public.reviews;
CREATE POLICY "Public can submit reviews" ON public.reviews
  FOR INSERT WITH CHECK (customer_name <> '' AND comment <> '');

DROP POLICY IF EXISTS "Admin full access reviews" ON public.reviews;
CREATE POLICY "Admin full access reviews" ON public.reviews
  FOR ALL USING (public.is_admin());

-- Settings: Public can read; Admin has full access
DROP POLICY IF EXISTS "Public read settings" ON public.settings;
CREATE POLICY "Public read settings" ON public.settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access settings" ON public.settings;
CREATE POLICY "Admin full access settings" ON public.settings
  FOR ALL USING (public.is_admin());

-- Coupons: Public read active coupons (for promo displays); Admin full access
DROP POLICY IF EXISTS "Public read active coupons" ON public.coupons;
CREATE POLICY "Public read active coupons" ON public.coupons
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admin full access coupons" ON public.coupons;
CREATE POLICY "Admin full access coupons" ON public.coupons
  FOR ALL USING (public.is_admin());

-- Customers: Auth user can read/update own record; Admin full access
DROP POLICY IF EXISTS "Customers can access own profile" ON public.customers;
CREATE POLICY "Customers can access own profile" ON public.customers
  FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin full access customers" ON public.customers;
CREATE POLICY "Admin full access customers" ON public.customers
  FOR ALL USING (public.is_admin());

-- ====================================================================
-- STORAGE BUCKETS
-- ====================================================================
-- 1. sweets-images (Public bucket for mithai photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('sweets-images', 'sweets-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read sweets-images" ON storage.objects;
CREATE POLICY "Public read sweets-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'sweets-images');

DROP POLICY IF EXISTS "Admin manage sweets-images" ON storage.objects;
CREATE POLICY "Admin manage sweets-images"
  ON storage.objects FOR ALL
  USING (bucket_id = 'sweets-images' AND public.is_admin());

-- 2. payment-proofs (Private bucket for transaction receipts)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Public upload payment-proofs" ON storage.objects;
CREATE POLICY "Public upload payment-proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-proofs');

DROP POLICY IF EXISTS "Admin read payment-proofs" ON storage.objects;
CREATE POLICY "Admin read payment-proofs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-proofs' AND public.is_admin());

-- ====================================================================
-- INITIAL SEED PRODUCTS (Authentic Traditional Sweets)
-- ====================================================================
INSERT INTO public.products (
  id, name, name_ur, category, sell_mode, price_per_kg, price_per_piece, price_per_unit, unit, 
  piece_weight_g, stock_grams, low_stock_threshold_grams, description, description_ur, image, is_featured, in_stock, is_available, ingredients
) VALUES
  (
    'prod-gulab-jamun', 
    'Desi Ghee Gulab Jamun', 
    'دیسی گھی گلاب جامن', 
    'Mithai', 
    'both', 
    1600, 
    90, 
    1600, 
    'kg', 
    55, 
    12000, 
    1500, 
    'Soft, warm, golden dumplings soaked in aromatic cardamom and saffron syrup made with 100% pure desi ghee.',
    'خالص دیسی گھی، الائچی اور زعفرانی شیرے میں ڈوبے ہوئے تازہ اور نرم گلاب جامن۔', 
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', 
    true, true, true, 
    'Khoya, Desi Ghee, Cardamom, Saffron Syrup, Pistachio'
  ),
  (
    'prod-pistachio-barfi', 
    'Pistachio Khoya Barfi', 
    'پستہ کھویا برفی', 
    'Barfi', 
    'kg', 
    1800, 
    100, 
    1800, 
    'kg', 
    45, 
    8000, 
    1000, 
    'Rich slow-simmered milk fudge garnished with roasted Persian pistachios and silver leaf (waraq).', 
    'گاڑھے دودھ کے کھوئے اور بھنے ہوئے پستے سے تیار کردہ روایتی برفی۔',
    'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80', 
    true, true, true, 
    'Full Cream Buffalo Milk, Pistachios, Chandi Waraq, Cardamom'
  ),
  (
    'prod-motichoor-laddu', 
    'Shahi Motichoor Laddu', 
    'شاہی موتی چور لڈو', 
    'Laddu', 
    'both', 
    1400, 
    75, 
    1400, 
    'kg', 
    50, 
    15000, 
    2000, 
    'Tender tiny besan pearls fried in pure desi ghee, infused with saffron water and crushed melon seeds.', 
    'باریک موتی دانوں سے تیار کردہ خوشبودار دیسی گھی کے شاہی موتی چور لڈو۔',
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80', 
    true, true, true, 
    'Gram Flour (Besan), Pure Desi Ghee, Maghaz (Melon Seeds), Saffron'
  ),
  (
    'prod-sohan-halwa', 
    'Multani Sohan Halwa', 
    'ملتانی سوہن حلوہ', 
    'Halwa', 
    'kg', 
    2200, 
    null, 
    2200, 
    'kg', 
    null, 
    6000, 
    1000, 
    'Crisp, caramelized traditional sprouted wheat halwa packed with almonds, walnuts, and cashews.', 
    'انگوری آٹے اور خالص گھی میں پکا ہوا گری دار میوہ جات سے بھرپور سوہن حلوہ۔',
    'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80', 
    false, true, true, 
    'Sprouted Wheat (Samnak), Desi Ghee, Almonds, Walnuts, Pistachios'
  ),
  (
    'prod-kaju-katli', 
    'Royal Kaju Katli', 
    'شاہی کاجو قتلی', 
    'Dry Fruit Sweets', 
    'kg', 
    2600, 
    140, 
    2600, 
    'kg', 
    30, 
    4500, 
    800, 
    'Delicate diamond-cut sweets crafted from premium ground cashews and delicate edible silver foil.', 
    'بہترین کاجو اور چاندی کے ورق سے بنی ہوئی شاہی کاجو قتلی۔',
    'https://images.unsplash.com/photo-1605197148560-f47285514f77?auto=format&fit=crop&w=800&q=80', 
    true, true, true, 
    'Grade-A Cashews, Cane Sugar, Silver Foil'
  ),
  (
    'prod-rasgulla', 
    'Saffron Spongy Rasgulla', 
    'زعفرانی رس گلہ', 
    'Mithai', 
    'both', 
    1500, 
    80, 
    1500, 
    'kg', 
    60, 
    9000, 
    1200, 
    'Light, airy fresh chhena balls simmered in light rosewater and Kashmiri saffron syrup.', 
    'تازہ چھینا اور عرقِ گلاب کے شیرے میں بنے ہوئے نرم اور رس دار رس گلے۔',
    'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80', 
    false, true, true, 
    'Fresh Cow Milk Chhena, Saffron, Rose Syrup'
  ),
  (
    'prod-besan-laddu', 
    'Desi Ghee Besan Laddu', 
    'دیسی گھی بیسن لڈو', 
    'Laddu', 
    'both', 
    1450, 
    80, 
    1450, 
    'kg', 
    50, 
    10000, 
    1500, 
    'Coarse gram flour roasted slowly to golden perfection in desi ghee with crunchy almonds.', 
    'خالص دیسی گھی میں بھنے ہوئے بیسن اور بادام سے تیار کردہ لڈو۔',
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80', 
    false, true, true, 
    'Roasted Besan, Desi Ghee, Almonds, Elaichi'
  ),
  (
    'prod-habshi-halwa', 
    'Shahi Habshi Halwa', 
    'شاہی حبشی حلوہ', 
    'Halwa', 
    'kg', 
    2000, 
    null, 
    2000, 
    'kg', 
    null, 
    5000, 
    1000, 
    'Traditional dark caramelized milk fudge infused with mace, nutmeg, and crunchy pistachio slivers.', 
    'شاہی انداز میں تیار کردہ حبشی حلوہ جس میں مغزیات اور خوشبو شامل ہے۔',
    'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80', 
    false, true, true, 
    'Milk Solids, Desi Ghee, Nutmeg, Mace, Mixed Nuts'
  )
ON CONFLICT (id) DO UPDATE SET
  name_ur = EXCLUDED.name_ur,
  sell_mode = EXCLUDED.sell_mode,
  price_per_kg = EXCLUDED.price_per_kg,
  price_per_piece = EXCLUDED.price_per_piece,
  stock_grams = EXCLUDED.stock_grams,
  description_ur = EXCLUDED.description_ur;
