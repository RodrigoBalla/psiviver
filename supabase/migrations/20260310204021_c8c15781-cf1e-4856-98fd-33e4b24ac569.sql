
-- Drop all restrictive policies on calendar_events
DROP POLICY IF EXISTS "Authenticated users can view events" ON public.calendar_events;
DROP POLICY IF EXISTS "Only admins can delete events" ON public.calendar_events;
DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.calendar_events;
DROP POLICY IF EXISTS "Authenticated users can update events" ON public.calendar_events;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Authenticated users can view events"
  ON public.calendar_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert events"
  ON public.calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update events"
  ON public.calendar_events FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only admins can delete events"
  ON public.calendar_events FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Drop all restrictive policies on calendar_gravadores
DROP POLICY IF EXISTS "Authenticated users can view gravadores" ON public.calendar_gravadores;
DROP POLICY IF EXISTS "Authenticated users can insert gravadores" ON public.calendar_gravadores;
DROP POLICY IF EXISTS "Only admins can delete gravadores" ON public.calendar_gravadores;
DROP POLICY IF EXISTS "Authenticated users can update gravadores" ON public.calendar_gravadores;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Authenticated users can view gravadores"
  ON public.calendar_gravadores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert gravadores"
  ON public.calendar_gravadores FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update gravadores"
  ON public.calendar_gravadores FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can delete gravadores"
  ON public.calendar_gravadores FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));
