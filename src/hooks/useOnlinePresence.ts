import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Map for initial tab detection from hash
const HASH_TO_PATH: Record<string, string> = {
  '#calendario': '/calendário',
  '#rotina': '/rotina',
  '#stories': '/pautasstories',
  '#orientacoes': '/Orientações',
};

/**
 * Hook that tracks the current user's online presence.
 * Uses Supabase Realtime Presence to broadcast user status.
 * Listens for tab-change events to update current page.
 */
export const useOnlinePresence = () => {
  const { user, profile } = useAuth();
  const location = useLocation();
  
  // Track current page path for presence
  const [currentPage, setCurrentPage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (window.location.pathname === '/dashboard' && hash) {
        return HASH_TO_PATH[hash] || '/calendário';
      }
      if (window.location.pathname === '/dashboard') {
        return '/calendário';
      }
      return window.location.pathname;
    }
    return '/';
  });
  
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isSubscribed = useRef(false);
  const onlineSinceRef = useRef<string>(new Date().toISOString());

  // Listen for tab-change events from Dashboard
  useEffect(() => {
    const handleTabChange = (event: CustomEvent<{ tabPath: string }>) => {
      setCurrentPage(event.detail.tabPath);
    };

    window.addEventListener('tab-change', handleTabChange as EventListener);
    return () => window.removeEventListener('tab-change', handleTabChange as EventListener);
  }, []);

  // Update current page when route changes (for non-dashboard pages)
  useEffect(() => {
    if (location.pathname !== '/dashboard') {
      setCurrentPage(location.pathname);
    } else {
      // On dashboard, check hash for initial load
      const hash = window.location.hash;
      if (hash) {
        setCurrentPage(HASH_TO_PATH[hash] || '/calendário');
      } else {
        setCurrentPage('/calendário');
      }
    }
  }, [location.pathname]);

  // Effect for channel creation (only on mount/user change)
  useEffect(() => {
    if (!user) {
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribed.current = false;
      }
      return;
    }

    // Only create channel if not exists
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
        } else if (status === 'CLOSED' || status === 'TIMED_OUT') {
          isSubscribed.current = false;
        }
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
  }, [user]);

  // Separate effect to update presence when currentPage changes
  useEffect(() => {
    if (!user || !channelRef.current || !isSubscribed.current) return;

    console.log('[useOnlinePresence] Updating presence to:', currentPage);
    
    channelRef.current.track({
      user_id: user.id,
      name: profile?.name || user.email?.split('@')[0] || 'Usuário',
      email: profile?.email || user.email,
      currentPage: currentPage,
      onlineSince: onlineSinceRef.current,
    });
  }, [user, profile?.name, profile?.email, currentPage]);
};