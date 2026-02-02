-- Fix 1: Ensure profiles table blocks unauthenticated access
-- Add a baseline restrictive policy that denies all access by default
-- The existing policies for users and admins will still work as they check auth.uid()

-- Drop existing policies and recreate them as PERMISSIVE (they work together with OR logic)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate as permissive policies (default) - user must match one of these
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Fix 2: Ensure login_history blocks unauthenticated access
DROP POLICY IF EXISTS "Admins can view all login history" ON public.login_history;
DROP POLICY IF EXISTS "Only admins can view login history directly" ON public.login_history;

-- Consolidated admin view policy
CREATE POLICY "Admins can view all login history"
ON public.login_history
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Fix 3: login_history_safe is a VIEW - recreate with security_invoker
-- First drop the existing view
DROP VIEW IF EXISTS public.login_history_safe;

-- Recreate with security_invoker=on so it inherits base table RLS
CREATE VIEW public.login_history_safe
WITH (security_invoker = on)
AS SELECT
  id,
  user_id,
  login_at,
  logout_at,
  simplify_user_agent(user_agent) as user_agent,
  anonymize_ip(ip_address) as ip_address
FROM public.login_history;

-- Also fix profiles_masked view to use security_invoker
DROP VIEW IF EXISTS public.profiles_masked;

CREATE VIEW public.profiles_masked
WITH (security_invoker = on)
AS SELECT
  id,
  user_id,
  name,
  regexp_replace(email, '(.{2}).*(@.*)', '\1***\2') as email,
  CASE 
    WHEN phone IS NOT NULL THEN regexp_replace(phone, '(.{4}).*(.{2})', '\1****\2')
    ELSE NULL
  END as phone,
  created_at,
  updated_at
FROM public.profiles;