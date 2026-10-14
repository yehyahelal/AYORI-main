-- ==============================================================================
-- SuperAdmin & Admin Roles Migration for Yadawi (All-in-One Safe Migration)
-- ==============================================================================
-- This script safely converts user_roles.role to TEXT so you never get
-- PostgreSQL enum transaction errors (like 55P04 or 22P02).
-- It runs smoothly in ONE single execution in the Supabase SQL Editor.
-- ==============================================================================

-- 1. Safely convert user_roles.role column to TEXT
ALTER TABLE public.user_roles ALTER COLUMN role TYPE text;
ALTER TABLE public.user_roles ALTER COLUMN role SET DEFAULT 'user';

-- 2. Add check constraint to ensure only valid roles are stored
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check 
  CHECK (role IN ('superadmin', 'admin', 'user'));

-- 3. Function: has_role (text version - fast & flexible)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role text)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
      AND (
        role = _role 
        OR (role = 'superadmin' AND _role = 'admin')
      )
  )
$$;

-- 4. Function: has_role (app_role enum overload for existing table policies)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
      RETURNS BOOLEAN
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      SET search_path = public
      AS $func$
        SELECT public.has_role(_user_id, _role::text);
      $func$;
    ';
  END IF;
END $$;

-- 5. Function: is_superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'superadmin'
  )
$$;

-- 6. Update user_roles RLS policies
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins and SuperAdmins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "SuperAdmins and Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins and SuperAdmins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "SuperAdmins and Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Secure helper to assign roles
DROP FUNCTION IF EXISTS public.assign_user_role(_target_user_id UUID, _role text);
DROP FUNCTION IF EXISTS public.assign_user_role(_target_user_id UUID, _role app_role);

CREATE OR REPLACE FUNCTION public.assign_user_role(_target_user_id UUID, _role text)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can assign roles';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, _role)
  ON CONFLICT (user_id, role) DO UPDATE SET role = EXCLUDED.role;
END;
$$;

-- 8. Secure helper to revoke admin role
DROP FUNCTION IF EXISTS public.revoke_admin_role(_target_user_id UUID);

CREATE OR REPLACE FUNCTION public.revoke_admin_role(_target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can revoke roles';
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = _target_user_id AND role = 'admin';
END;
$$;

-- 9. Secure function to get admin team list with emails and names
-- DROP first to allow changing return column type from enum to text
DROP FUNCTION IF EXISTS public.get_admin_users();

CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT 
    ur.user_id,
    u.email::TEXT,
    COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email::TEXT, '@', 1)) AS display_name,
    ur.role,
    ur.created_at
  FROM public.user_roles ur
  JOIN auth.users u ON u.id = ur.user_id
  WHERE public.has_role(auth.uid(), 'admin')
    AND ur.role IN ('admin', 'superadmin')
  ORDER BY ur.created_at DESC;
$$;
