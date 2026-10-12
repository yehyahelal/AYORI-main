-- 1. Create a sequence for orders starting at 100001
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 100001;

-- 2. Add order_number column to public.orders if it doesn't already exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE DEFAULT ('#' || nextval('public.order_number_seq')::text);

-- 3. Backfill any existing orders that don't have an order_number
UPDATE public.orders 
SET order_number = ('#' || nextval('public.order_number_seq')::text) 
WHERE order_number IS NULL;

-- 4. Create an index on order_number for fast lookups and escalation searches
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
