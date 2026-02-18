
ALTER TABLE public.calendar_events ADD COLUMN month integer NOT NULL DEFAULT 2;
ALTER TABLE public.calendar_gravadores ADD COLUMN month integer NOT NULL DEFAULT 2;

ALTER TABLE public.calendar_gravadores DROP CONSTRAINT IF EXISTS calendar_gravadores_day_key;
ALTER TABLE public.calendar_gravadores ADD CONSTRAINT calendar_gravadores_day_month_key UNIQUE (day, month);
