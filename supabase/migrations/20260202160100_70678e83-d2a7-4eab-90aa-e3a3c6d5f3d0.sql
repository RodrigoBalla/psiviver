-- Update calendar_events RLS policies to restrict delete to admins only
DROP POLICY IF EXISTS "Authenticated users can delete events" ON public.calendar_events;
DROP POLICY IF EXISTS "Authenticated users can update events" ON public.calendar_events;

-- Only admins can delete events
CREATE POLICY "Only admins can delete events" 
ON public.calendar_events 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Authenticated users can update events (status changes, etc)
CREATE POLICY "Authenticated users can update events" 
ON public.calendar_events 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Update calendar_gravadores RLS policies
DROP POLICY IF EXISTS "Authenticated users can delete gravadores" ON public.calendar_gravadores;

-- Only admins can delete gravadores  
CREATE POLICY "Only admins can delete gravadores" 
ON public.calendar_gravadores 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Update stories RLS policies
DROP POLICY IF EXISTS "Authenticated users can delete stories" ON public.stories;

-- Only admins can delete stories
CREATE POLICY "Only admins can delete stories" 
ON public.stories 
FOR DELETE 
USING (is_admin(auth.uid()));