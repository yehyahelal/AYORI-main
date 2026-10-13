-- ==============================================================================
-- Yadawi - Admin Order Email Notifications Setup
-- ==============================================================================
-- This script ensures store_settings table supports email notification configurations.
-- The store admin can also configure all keys directly from the Admin Dashboard UI!

-- 1. Ensure store_settings table exists
CREATE TABLE IF NOT EXISTS public.store_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Insert default email configuration placeholders (if not already present)
INSERT INTO public.store_settings (key, value)
VALUES 
  ('admin_notification_email', ''),
  ('emailjs_service_id', ''),
  ('emailjs_template_id', ''),
  ('emailjs_public_key', ''),
  ('email_notifications_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- 3. Row Level Security policies
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Allow public / customer reading of settings (needed during checkout to trigger email)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'store_settings' AND policyname = 'Anyone can read settings'
  ) THEN
    CREATE POLICY "Anyone can read settings" ON public.store_settings
      FOR SELECT USING (true);
  END IF;
END $$;

-- Allow admins to update and insert settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'store_settings' AND policyname = 'Admins can update settings'
  ) THEN
    CREATE POLICY "Admins can update settings" ON public.store_settings
      FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'store_settings' AND policyname = 'Admins can insert settings'
  ) THEN
    CREATE POLICY "Admins can insert settings" ON public.store_settings
      FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

COMMENT ON TABLE public.store_settings IS 'Stores Yadawi configuration parameters, including delivery fees and EmailJS notification credentials.';
