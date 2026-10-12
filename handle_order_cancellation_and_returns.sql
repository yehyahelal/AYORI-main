-- 1. Add return & restock tracking columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS restocked BOOLEAN DEFAULT FALSE;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS is_damaged BOOLEAN DEFAULT FALSE;

-- 2. Create a secure function to atomically restock products for an order
CREATE OR REPLACE FUNCTION public.restock_order_items(p_order_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item RECORD;
BEGIN
  FOR item IN 
    SELECT product_id, quantity 
    FROM public.order_items 
    WHERE order_id = p_order_id AND product_id IS NOT NULL
  LOOP
    UPDATE public.products
    SET inventory_count = COALESCE(inventory_count, 0) + item.quantity
    WHERE id = item.product_id;
  END LOOP;
END;
$$;

-- 3. Create a secure function to atomically re-deduct products if a cancelled/returned order is reactivated
CREATE OR REPLACE FUNCTION public.deduct_order_items(p_order_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item RECORD;
BEGIN
  FOR item IN 
    SELECT product_id, quantity 
    FROM public.order_items 
    WHERE order_id = p_order_id AND product_id IS NOT NULL
  LOOP
    UPDATE public.products
    SET inventory_count = GREATEST(0, COALESCE(inventory_count, 0) - item.quantity)
    WHERE id = item.product_id;
  END LOOP;
END;
$$;
