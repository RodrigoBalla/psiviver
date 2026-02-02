-- Enable realtime for calendar_events table
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;

-- Enable realtime for calendar_gravadores table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_gravadores;