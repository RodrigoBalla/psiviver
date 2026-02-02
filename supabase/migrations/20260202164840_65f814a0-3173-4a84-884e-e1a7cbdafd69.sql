-- Step 1: Drop the dependent view first
DROP VIEW IF EXISTS public.profiles_masked;

-- Step 2: Remove the is_admin column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin;

-- Step 3: Recreate the profiles_masked view without is_admin (uses security_invoker)
CREATE VIEW public.profiles_masked
WITH (security_invoker = on) AS
SELECT
    id,
    user_id,
    name,
    CASE 
        WHEN auth.uid() = user_id THEN email
        ELSE LEFT(email, 2) || '***@***' || RIGHT(email, POSITION('.' IN REVERSE(email)) + 1)
    END AS email,
    CASE 
        WHEN auth.uid() = user_id THEN phone
        ELSE '(**) *****-' || RIGHT(COALESCE(phone, ''), 4)
    END AS phone,
    created_at,
    updated_at
FROM public.profiles;