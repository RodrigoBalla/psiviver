import { useEffect, useRef, useCallback } from 'react';
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

  // Memoized track function
  const trackPresence = useCallback(async () => {
    if (!channelRef.current || !isSubscribed.current || !user) return;
    
    const trackData = {
      user_id: user.id,
      name: profile?.name || user.email?.split('@')[0] || 'Usuário',
      email: profile?.email || user.email,
      currentPage: location.pathname,
      onlineSince: onlineSinceRef.current,
    };
    console.log('[Presence Hook] Tracking:', trackData);
    await channelRef.current.track(trackData);
  }, [user?.id, profile?.name, profile?.email, user?.email, location.pathname]);

  // Setup channel once when user logs in
  useEffect(() => {
    if (!user) {
      // Cleanup if user logs out
      if (channelRef.current) {
        console.log('[Presence Hook] User logged out, cleanup');
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribed.current = false;
      }
      return;
    }

    // Only create channel once
    if (channelRef.current) return;

    console.log('[Presence Hook] Creating channel');
    onlineSinceRef.current = new Date().toISOString();
    
    const channel = supabase.channel('presence-room', {
      config: {
        broadcast: { self: true },
        presence: { key: 'presence-key' },
      },
    });
    channelRef.current = channel;

    channel.subscribe(async (status) => {
      console.log('[Presence Hook] Channel status:', status);
      if (status === 'SUBSCRIBED') {
        isSubscribed.current = true;
        // Initial track
        const trackData = {
          user_id: user.id,
          name: profile?.name || user.email?.split('@')[0] || 'Usuário',
          email: profile?.email || user.email,
          currentPage: location.pathname,
          onlineSince: onlineSinceRef.current,
        };
        console.log('[Presence Hook] Initial tracking:', trackData);
        await channel.track(trackData);
      } else if (status === 'CLOSED' || status === 'TIMED_OUT') {
        isSubscribed.current = false;
      }
    });

    // Cleanup only on unmount
    return () => {
      console.log('[Presence Hook] Component unmounting, cleanup');
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribed.current = false;
      }
    };
  }, [user?.id]); // Only depend on user.id

  // Update presence when location or profile changes
  useEffect(() => {
    if (!isSubscribed.current) return;
    trackPresence();
  }, [trackPresence]);
};
