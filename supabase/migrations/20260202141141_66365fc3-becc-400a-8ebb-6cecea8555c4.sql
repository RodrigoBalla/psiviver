-- Create a masked view for profiles that hides sensitive data
-- This view will mask email and phone for admin viewing
CREATE OR REPLACE VIEW public.profiles_masked
WITH (security_invoker = on)
AS
SELECT 
  id,
  user_id,
  name,
  -- Mask email: show first 2 chars + *** + @domain
  CASE 
    WHEN length(email) > 0 AND position('@' in email) > 2 THEN
      substring(email from 1 for 2) || '***' || substring(email from position('@' in email))
    WHEN length(email) > 0 THEN
      '***' || substring(email from position('@' in email))
    ELSE '***@***'
  END as email,
  -- Mask phone: show only last 4 digits
  CASE 
    WHEN phone IS NOT NULL AND length(phone) > 4 THEN
      '******' || right(phone, 4)
    WHEN phone IS NOT NULL THEN
      '****'
    ELSE NULL
  END as phone,
  is_admin,
  created_at,
  updated_at
FROM public.profiles;

-- Create a function for users to get their OWN full profile (unmasked)
-- This ensures users can see their own data but not others'
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text,
  email text,
  phone text,
  is_admin boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.name,
    p.email,
    p.phone,
    p.is_admin,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.user_id = auth.uid();
END;
$$;