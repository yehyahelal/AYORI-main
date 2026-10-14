-- ==============================================================================
-- Assign 'superadmin' Role to Your Account
-- ==============================================================================
-- 1. Replace 'your_email@example.com' below with your actual account email
-- 2. Run this in your Supabase SQL Editor:

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'
FROM auth.users 
WHERE email = 'your_email@example.com'
ON CONFLICT (user_id, role) DO UPDATE SET role = 'superadmin';

-- Verify your role
SELECT u.email, ur.role, ur.created_at
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'your_email@example.com';
