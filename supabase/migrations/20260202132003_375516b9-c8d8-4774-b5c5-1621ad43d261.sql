-- Criar tabela de perfis
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Criar tabela de histórico de login
CREATE TABLE public.login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  login_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  logout_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  user_agent TEXT
);

-- Criar tabela de tempo de permanência por página
CREATE TABLE public.page_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  page_path TEXT NOT NULL,
  entered_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  left_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0
);

-- Criar tabela de cliques em botões
CREATE TABLE public.button_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  button_id TEXT NOT NULL,
  button_label TEXT,
  page_path TEXT NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Criar tabela de eventos do calendário
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day INTEGER NOT NULL,
  event_index INTEGER NOT NULL,
  platform TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT,
  roteiro TEXT,
  publicacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(day, event_index)
);

-- Criar tabela de gravadores do calendário
CREATE TABLE public.calendar_gravadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day INTEGER NOT NULL UNIQUE,
  gravador TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Criar tabela de stories
CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  done BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.button_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_gravadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Criar função para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE user_id = _user_id),
    false
  )
$$;

-- RLS Policies para profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

-- RLS Policies para login_history
CREATE POLICY "Users can view their own login history"
  ON public.login_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own login history"
  ON public.login_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own login history"
  ON public.login_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all login history"
  ON public.login_history FOR SELECT
  USING (public.is_admin(auth.uid()));

-- RLS Policies para page_visits
CREATE POLICY "Users can view their own page visits"
  ON public.page_visits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own page visits"
  ON public.page_visits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own page visits"
  ON public.page_visits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all page visits"
  ON public.page_visits FOR SELECT
  USING (public.is_admin(auth.uid()));

-- RLS Policies para button_clicks
CREATE POLICY "Users can view their own button clicks"
  ON public.button_clicks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own button clicks"
  ON public.button_clicks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all button clicks"
  ON public.button_clicks FOR SELECT
  USING (public.is_admin(auth.uid()));

-- RLS Policies para calendar_events (todos podem ver e editar)
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
  USING (true);

-- RLS Policies para calendar_gravadores
CREATE POLICY "Authenticated users can view gravadores"
  ON public.calendar_gravadores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage gravadores"
  ON public.calendar_gravadores FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies para stories
CREATE POLICY "Authenticated users can view stories"
  ON public.stories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage stories"
  ON public.stories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_gravadores_updated_at
  BEFORE UPDATE ON public.calendar_gravadores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();