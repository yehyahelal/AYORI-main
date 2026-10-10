-- 1. Create store settings table
CREATE TABLE IF NOT EXISTS public.store_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Insert default delivery fee
INSERT INTO public.store_settings (key, value) VALUES ('delivery_fee', '50') ON CONFLICT (key) DO NOTHING;

-- Enable RLS and create policy for settings
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON public.store_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update settings" ON public.store_settings
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert settings" ON public.store_settings
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Create trigger to safely update inventory
CREATE OR REPLACE FUNCTION public.deduct_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- This runs as postgres admin, bypassing RLS to update inventory safely
AS $$
BEGIN
  UPDATE public.products
  SET inventory_count = GREATEST(0, inventory_count - NEW.quantity)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_item_insert ON public.order_items;
CREATE TRIGGER on_order_item_insert
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_inventory();
