
ALTER TABLE public.calendar_events DROP CONSTRAINT IF EXISTS calendar_events_day_event_index_key;
ALTER TABLE public.calendar_events ADD CONSTRAINT calendar_events_day_month_event_index_key UNIQUE (day, month, event_index);
