-- Drop and recreate the view with security_invoker=on
-- This ensures RLS policies from the profiles table are enforced
DROP VIEW IF EXISTS public.profiles_masked;

CREATE VIEW public.profiles_masked
WITH (security_invoker = on) AS
SELECT 
    id,
    user_id,
    name,
    CASE
        WHEN length(email) > 0 AND position('@' in email) > 2 
        THEN substring(email from 1 for 2) || '***' || substring(email from position('@' in email))
        WHEN length(email) > 0 
        THEN '***' || substring(email from position('@' in email))
        ELSE '***@***'
    END AS email,
    CASE
        WHEN phone IS NOT NULL AND length(phone) > 4 
        THEN '******' || right(phone, 4)
        WHEN phone IS NOT NULL 
        THEN '****'
        ELSE NULL
    END AS phone,
    is_admin,
    created_at,
    updated_at
FROM public.profiles;