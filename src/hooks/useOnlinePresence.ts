import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook that tracks the current user's online presence.
 * Uses Supabase Realtime Presence to broadcast user status.
 */
export const useOnlinePresence = () => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isSubscribed = useRef(false);
  const onlineSinceRef = useRef<string>(new Date().toISOString());

  // Single effect for channel management
  useEffect(() => {
    // If no user, cleanup and exit
    if (!user) {
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribed.current = false;
      }
      return;
    }

    // Create channel if not exists
    if (!channelRef.current) {
      onlineSinceRef.current = new Date().toISOString();
      
      const channel = supabase.channel('presence-room', {
        config: {
          broadcast: { self: true },
          presence: { key: 'presence-key' },
        },
      });
      channelRef.current = channel;

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          isSubscribed.current = true;
          await channel.track({
            user_id: user.id,
            name: profile?.name || user.email?.split('@')[0] || 'Usuário',
            email: profile?.email || user.email,
            currentPage: location.pathname,
            onlineSince: onlineSinceRef.current,
          });
        } else if (status === 'CLOSED' || status === 'TIMED_OUT') {
          isSubscribed.current = false;
        }
      });
    } else if (isSubscribed.current) {
      // Update presence when location or profile changes
      channelRef.current.track({
        user_id: user.id,
        name: profile?.name || user.email?.split('@')[0] || 'Usuário',
        email: profile?.email || user.email,
        currentPage: location.pathname,
        onlineSince: onlineSinceRef.current,
      });
    }

    // Cleanup on unmount only
    return () => {
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribed.current = false;
      }
    };
  }, [user, profile?.name, profile?.email, location.pathname]);
};
