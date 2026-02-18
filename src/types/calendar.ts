export interface CalendarEvent {
  id?: string;
  day: number;
  month: number;
  event_index: number;
  platform: string;
  title: string;
  status: string | null;
  roteiro?: string;
  publicacao?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Story {
  id: number;
  title: string;
  desc: string;
  done: boolean;
}

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
}

export interface LoginHistory {
  id: string;
  user_id: string;
  login_at: string;
  logout_at?: string;
  ip_address?: string;
  user_agent?: string;
  profile?: Profile;
}

export interface PageVisit {
  id: string;
  user_id: string;
  page_path: string;
  entered_at: string;
  left_at?: string;
  duration_seconds: number;
  profile?: Profile;
}

export interface ButtonClick {
  id: string;
  user_id: string;
  button_id: string;
  button_label?: string;
  page_path: string;
  clicked_at: string;
  profile?: Profile;
}
