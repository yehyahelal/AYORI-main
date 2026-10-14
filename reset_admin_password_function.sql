-- ==============================================================================
-- SuperAdmin Password Reset Function (Reset Admin Password to Yadawi@123)
-- ==============================================================================
-- Run this in your Supabase SQL Editor:
-- Allows SuperAdmins to click "Reset to Default" on any admin account
-- and immediately reset their password to "Yadawi@123" with zero email/SMTP required.
-- ==============================================================================

-- Enable pgcrypto if not already enabled (for crypt and gen_salt)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Create the secure RPC function
CREATE OR REPLACE FUNCTION public.reset_admin_password_default(_target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
  -- 1. Verify that the caller is an authenticated superadmin
  IF NOT public.is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Only SuperAdmins are authorized to reset admin passwords.';
  END IF;

  -- 2. Verify target user exists in user_roles
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _target_user_id) THEN
    RAISE EXCEPTION 'Target user not found in the admin system.';
  END IF;

  -- 3. Reset the password in auth.users to default 'Yadawi@123'
  UPDATE auth.users
  SET encrypted_password = extensions.crypt('Yadawi@123', extensions.gen_salt('bf')),
      updated_at = NOW()
  WHERE id = _target_user_id;
END;
$$;

-- Grant execution to authenticated users (the function itself verifies superadmin role)
GRANT EXECUTE ON FUNCTION public.reset_admin_password_default(UUID) TO authenticated;
