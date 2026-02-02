import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/calendar';

interface ProfileWithAdmin extends Profile {
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: ProfileWithAdmin | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string, phone: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileWithAdmin | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      // Check if user has admin role using the secure is_admin RPC function
      const { data: isAdminResult } = await supabase
        .rpc('is_admin', { _user_id: userId });

      const isAdmin = isAdminResult === true;

      // If profile doesn't exist yet, create a minimal profile row
      if (!profileData) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const email = userData.user?.email ?? '';
        const userMeta = (userData.user?.user_metadata ?? {}) as Record<string, unknown>;
        const nameFromMeta = typeof userMeta.name === 'string' ? userMeta.name : undefined;
        const phoneFromMeta = typeof userMeta.phone === 'string' ? userMeta.phone : null;

        const safeName = (nameFromMeta || email.split('@')[0] || 'Usuário').trim();

        const { data: created, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            email,
            name: safeName,
            phone: phoneFromMeta,
          })
          .select('*')
          .single();

        if (createError) throw createError;
        setProfile({ ...(created as Profile), is_admin: isAdmin });
        return;
      }

      setProfile({ ...(profileData as Profile), is_admin: isAdmin });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const recordLogin = async (userId: string) => {
    try {
      await supabase.from('login_history').insert({
        user_id: userId,
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Error recording login:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout
          setTimeout(() => {
            fetchProfile(session.user.id);
            if (event === 'SIGNED_IN') {
              recordLogin(session.user.id);
            }
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, name: string, phone: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
            phone,
          }
        }
      });

      if (error) throw error;

      // Create profile
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          user_id: data.user.id,
          name,
          email,
          phone,
        });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    // Update logout time in login_history
    if (user) {
      const { data: lastLogin } = await supabase
        .from('login_history')
        .select('id')
        .eq('user_id', user.id)
        .order('login_at', { ascending: false })
        .limit(1)
        .single();

      if (lastLogin) {
        await supabase
          .from('login_history')
          .update({ logout_at: new Date().toISOString() })
          .eq('id', lastLogin.id);
      }
    }
    
    await supabase.auth.signOut();
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
