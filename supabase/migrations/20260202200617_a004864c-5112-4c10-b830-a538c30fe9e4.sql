-- Create a function to anonymize IP addresses (mask last octet for IPv4, last segments for IPv6)
CREATE OR REPLACE FUNCTION public.anonymize_ip(ip_address text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF ip_address IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Check if it's an IPv4 address
  IF ip_address ~ '^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$' THEN
    -- Mask the last octet: 192.168.1.100 -> 192.168.1.xxx
    RETURN regexp_replace(ip_address, '\.\d{1,3}$', '.xxx');
  -- Check if it's an IPv6 address
  ELSIF ip_address ~ ':' THEN
    -- Mask last 4 segments: 2001:0db8:85a3:0000:0000:8a2e:0370:7334 -> 2001:0db8:85a3:0000:xxxx:xxxx:xxxx:xxxx
    RETURN regexp_replace(ip_address, '(:[0-9a-fA-F]*){4}$', ':xxxx:xxxx:xxxx:xxxx');
  ELSE
    RETURN 'xxx.xxx.xxx.xxx';
  END IF;
END;
$$;

-- Create a function to simplify user agent (show only browser/OS, not full details)
CREATE OR REPLACE FUNCTION public.simplify_user_agent(user_agent text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF user_agent IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Extract browser name only (simplified)
  IF user_agent ILIKE '%Chrome%' THEN
    RETURN 'Chrome';
  ELSIF user_agent ILIKE '%Firefox%' THEN
    RETURN 'Firefox';
  ELSIF user_agent ILIKE '%Safari%' AND user_agent NOT ILIKE '%Chrome%' THEN
    RETURN 'Safari';
  ELSIF user_agent ILIKE '%Edge%' THEN
    RETURN 'Edge';
  ELSIF user_agent ILIKE '%Opera%' OR user_agent ILIKE '%OPR%' THEN
    RETURN 'Opera';
  ELSE
    RETURN 'Navegador';
  END IF;
END;
$$;

-- Create a secure view with anonymized data for regular users
CREATE OR REPLACE VIEW public.login_history_safe
WITH (security_invoker = on)
AS
SELECT 
  id,
  user_id,
  login_at,
  logout_at,
  public.anonymize_ip(ip_address) as ip_address,
  public.simplify_user_agent(user_agent) as user_agent
FROM public.login_history;

-- Update RLS policies: deny direct SELECT for regular users, force them to use the view
DROP POLICY IF EXISTS "Users can view their own login history" ON public.login_history;

-- Create a more restrictive policy: only admins can directly select from the base table
CREATE POLICY "Only admins can view login history directly"
ON public.login_history
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Users can still insert and update their own records
-- (these policies already exist, but let's ensure they're correct)

-- Add a policy to allow users to DELETE their own old login history for privacy
CREATE POLICY "Users can delete their own login history"
ON public.login_history
FOR DELETE
USING (auth.uid() = user_id);

-- Create automatic cleanup: delete login history older than 90 days
CREATE OR REPLACE FUNCTION public.cleanup_old_login_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.login_history
  WHERE login_at < NOW() - INTERVAL '90 days';
END;
$$;