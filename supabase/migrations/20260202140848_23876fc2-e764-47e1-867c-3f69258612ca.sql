-- Fix overly permissive RLS policies for calendar_events
DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.calendar_events;
DROP POLICY IF EXISTS "Authenticated users can update events" ON public.calendar_events;

CREATE POLICY "Authenticated users can insert events"
ON public.calendar_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update events"
ON public.calendar_events
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Add DELETE policy for calendar_events (only admins)
CREATE POLICY "Admins can delete events"
ON public.calendar_events
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Fix overly permissive RLS policies for calendar_gravadores
DROP POLICY IF EXISTS "Authenticated users can manage gravadores" ON public.calendar_gravadores;

CREATE POLICY "Authenticated users can insert gravadores"
ON public.calendar_gravadores
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update gravadores"
ON public.calendar_gravadores
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete gravadores"
ON public.calendar_gravadores
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Fix overly permissive RLS policies for stories
DROP POLICY IF EXISTS "Authenticated users can manage stories" ON public.stories;

CREATE POLICY "Authenticated users can insert stories"
ON public.stories
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update stories"
ON public.stories
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete stories"
ON public.stories
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Add DELETE policy for profiles (only owner or admin)
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));