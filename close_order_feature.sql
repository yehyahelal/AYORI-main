-- 1. Add is_closed and closed_at columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT FALSE;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE;

-- 2. Prevent reopening or status modification from regular web requests once closed
CREATE OR REPLACE FUNCTION public.check_order_not_closed()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If order was already closed and someone attempts to change status or reopen it:
  IF OLD.is_closed = TRUE AND (NEW.is_closed = FALSE OR NEW.status IS DISTINCT FROM OLD.status) THEN
    -- Allow direct superuser/postgres admin in SQL editor, block standard web users
    IF current_user NOT IN ('postgres', 'supabase_admin') THEN
      RAISE EXCEPTION 'Order is closed and permanently locked. It cannot be reopened or modified from the website.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_closed_order_update ON public.orders;
CREATE TRIGGER trg_prevent_closed_order_update
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.check_order_not_closed();
