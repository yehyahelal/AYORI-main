-- ==============================================================================
-- Add display_name and email to public.user_roles Table
-- ==============================================================================
-- This makes it crystal clear who is who when viewing the user_roles table
-- in the Supabase Table Editor!
-- ==============================================================================

-- 1. Add display_name and email columns if they don't exist yet
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Backfill existing records with their real email and display_name
UPDATE public.user_roles ur
SET 
  email = u.email,
  display_name = COALESCE(p.display_name, u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE ur.user_id = u.id;

-- 3. Automatic trigger to auto-populate email and display_name on any future inserts/updates
CREATE OR REPLACE FUNCTION public.sync_user_roles_info()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- If email or display_name is not provided, automatically fetch from auth.users & profiles
  IF NEW.email IS NULL OR NEW.display_name IS NULL THEN
    SELECT 
      u.email,
      COALESCE(p.display_name, u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
    INTO NEW.email, NEW.display_name
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.user_id = u.id
    WHERE u.id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_user_roles_info ON public.user_roles;
CREATE TRIGGER trg_sync_user_roles_info
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_roles_info();

-- 4. Verify user_roles table
SELECT id, user_id, email, display_name, role, created_at
FROM public.user_roles
ORDER BY created_at DESC;
