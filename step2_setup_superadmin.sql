-- ==============================================================================
-- STEP 2: Run this query AFTER running step1_add_enum_value.sql
-- Sets up has_role, is_superadmin, policies, and SuperAdmin helper functions.
-- ==============================================================================

-- 1. Update has_role function so 'superadmin' inherits all 'admin' permissions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
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
        OR (role::text = 'superadmin' AND _role::text = 'admin')
      )
  )
$$;

-- 2. Function to check if a user is specifically a superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = 'superadmin'
  )
$$;

-- 3. Update user_roles policies: SuperAdmins & Admins can view and manage roles
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

-- 4. Secure function for SuperAdmin to assign admin or superadmin role
CREATE OR REPLACE FUNCTION public.assign_user_role(_target_user_id UUID, _role app_role)
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

-- 5. Helper function to revoke an admin role
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
  WHERE user_id = _target_user_id AND role::text = 'admin';
END;
$$;

-- 6. Secure function for SuperAdmins/Admins to view the team of admins with emails
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT,
  role app_role,
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
    AND ur.role::text IN ('admin', 'superadmin')
  ORDER BY ur.created_at DESC;
$$;
