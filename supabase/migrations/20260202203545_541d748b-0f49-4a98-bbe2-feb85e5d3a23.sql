-- Drop the restrictive INSERT policy and create a permissive one
DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.calendar_events;

CREATE POLICY "Authenticated users can insert events"
ON public.calendar_events
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also ensure UPDATE policy is permissive for drag-and-drop to work
DROP POLICY IF EXISTS "Authenticated users can update events" ON public.calendar_events;

CREATE POLICY "Authenticated users can update events"
ON public.calendar_events
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);