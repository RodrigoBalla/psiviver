-- Fix DELETE policy for calendar_events to allow authenticated users
DROP POLICY IF EXISTS "Admins can delete events" ON public.calendar_events;
CREATE POLICY "Authenticated users can delete events" 
ON public.calendar_events 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Fix DELETE policy for calendar_gravadores
DROP POLICY IF EXISTS "Admins can delete gravadores" ON public.calendar_gravadores;
CREATE POLICY "Authenticated users can delete gravadores" 
ON public.calendar_gravadores 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Fix DELETE policy for stories
DROP POLICY IF EXISTS "Admins can delete stories" ON public.stories;
CREATE POLICY "Authenticated users can delete stories" 
ON public.stories 
FOR DELETE 
USING (auth.uid() IS NOT NULL);