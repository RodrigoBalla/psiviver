import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useOnlinePresence = () => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channelRef.current = channel;

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: user.id,
          name: profile?.name || user.email?.split('@')[0] || 'Usuário',
          email: profile?.email || user.email,
          currentPage: location.pathname,
          onlineSince: new Date().toISOString(),
        });
      }
    });

    return () => {
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, profile]);

  // Update current page when location changes
  useEffect(() => {
    if (!channelRef.current || !user) return;

    channelRef.current.track({
      user_id: user.id,
      name: profile?.name || user.email?.split('@')[0] || 'Usuário',
      email: profile?.email || user.email,
      currentPage: location.pathname,
      onlineSince: new Date().toISOString(),
    });
  }, [location.pathname, user, profile]);
};
