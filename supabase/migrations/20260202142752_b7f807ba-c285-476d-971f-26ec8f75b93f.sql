-- Enable REPLICA IDENTITY FULL for realtime DELETE events to work properly
ALTER TABLE public.calendar_events REPLICA IDENTITY FULL;
ALTER TABLE public.calendar_gravadores REPLICA IDENTITY FULL;
ALTER TABLE public.stories REPLICA IDENTITY FULL;