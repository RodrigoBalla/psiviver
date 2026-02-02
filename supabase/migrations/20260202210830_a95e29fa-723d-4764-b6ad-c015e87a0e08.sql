-- Fix: Views in Postgres can't have RLS enabled directly
-- The security_invoker option should work, but let's ensure policies are properly configured on base tables
-- and add explicit role targeting

-- First, drop and recreate views ensuring they use security_invoker correctly
DROP VIEW IF EXISTS public.login_history_safe;
DROP VIEW IF EXISTS public.profiles_masked;

-- Recreate login_history_safe view with security_invoker
-- This ensures the view inherits RLS from the base login_history table
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

-- Recreate profiles_masked view with security_invoker
-- This ensures the view inherits RLS from the base profiles table
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

-- Ensure calendar_events INSERT and UPDATE policies require authentication
DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.calendar_events;
DROP POLICY IF EXISTS "Authenticated users can update events" ON public.calendar_events;

CREATE POLICY "Authenticated users can insert events"
ON public.calendar_events
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update events"
ON public.calendar_events
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Ensure calendar_gravadores UPDATE policy requires authentication
DROP POLICY IF EXISTS "Authenticated users can update gravadores" ON public.calendar_gravadores;

CREATE POLICY "Authenticated users can update gravadores"
ON public.calendar_gravadores
FOR UPDATE
TO authenticated
USING (true);