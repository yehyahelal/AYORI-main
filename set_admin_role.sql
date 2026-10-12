-- ==============================================================================
-- AYORI - Assign Admin Role to an Account
-- ==============================================================================
-- Run this in your Supabase SQL Editor if an account lost its admin privileges.
-- Replace 'your_admin_email@example.com' with your actual admin account email.

-- 1. Ensure the user has the 'admin' role in public.user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = 'your_admin_email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. (Optional) Remove the default 'user' role if you only want 'admin'
-- DELETE FROM public.user_roles 
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your_admin_email@example.com')
--   AND role = 'user';

-- 3. Verify the role
SELECT u.email, ur.role, ur.created_at
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'your_admin_email@example.com';
