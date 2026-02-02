import { useEffect, useRef, useState, useCallback } from 'react';
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

const getInitialPage = (): string => {
  if (typeof window === 'undefined') return '/';
  const hash = window.location.hash;
  const pathname = window.location.pathname;
  if (pathname === '/dashboard') {
    return hash ? (HASH_TO_PATH[hash] || '/calendário') : '/calendário';
  }
  return pathname;
};

/**
 * Hook that tracks the current user's online presence.
 * Uses Supabase Realtime Presence to broadcast user status.
 * Listens for tab-change events to update current page.
 */
export const useOnlinePresence = () => {
  // All hooks must be called unconditionally at the top
  const { user, profile } = useAuth();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState<string>(getInitialPage);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isSubscribedRef = useRef(false);
  const onlineSinceRef = useRef<string>(new Date().toISOString());
  const userIdRef = useRef<string | null>(null);

  // Memoized track function
  const trackPresence = useCallback((page: string) => {
    if (!user || !channelRef.current || !isSubscribedRef.current) return;
    
    console.log('[useOnlinePresence] Tracking presence:', page);
    channelRef.current.track({
      user_id: user.id,
      name: profile?.name || user.email?.split('@')[0] || 'Usuário',
      email: profile?.email || user.email,
      currentPage: page,
      onlineSince: onlineSinceRef.current,
    });
  }, [user, profile?.name, profile?.email]);

  // Effect 1: Listen for tab-change custom events
  useEffect(() => {
    const handleTabChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ tabPath: string }>;
      if (customEvent.detail?.tabPath) {
        setCurrentPage(customEvent.detail.tabPath);
      }
    };

    window.addEventListener('tab-change', handleTabChange);
    return () => window.removeEventListener('tab-change', handleTabChange);
  }, []);

  // Effect 2: Update current page when route changes
  useEffect(() => {
    if (location.pathname !== '/dashboard') {
      setCurrentPage(location.pathname);
    } else {
      const hash = window.location.hash;
      setCurrentPage(hash ? (HASH_TO_PATH[hash] || '/calendário') : '/calendário');
    }
  }, [location.pathname]);

  // Effect 3: Channel management - create/destroy based on user
  useEffect(() => {
    // User logged out - cleanup
    if (!user) {
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
      userIdRef.current = null;
      return;
    }

    // Same user, channel exists - do nothing
    if (userIdRef.current === user.id && channelRef.current) {
      return;
    }

    // New user or first time - create channel
    userIdRef.current = user.id;
    onlineSinceRef.current = new Date().toISOString();

    const channel = supabase.channel('presence-room', {
      config: {
        broadcast: { self: true },
        presence: { key: 'presence-key' },
      },
    });
    channelRef.current = channel;

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        isSubscribedRef.current = true;
        // Initial track
        trackPresence(currentPage);
      } else if (status === 'CLOSED' || status === 'TIMED_OUT') {
        isSubscribedRef.current = false;
      }
    });

    return () => {
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [user?.id]); // Only depend on user.id

  // Effect 4: Update presence when currentPage or profile changes
  useEffect(() => {
    trackPresence(currentPage);
  }, [currentPage, trackPresence]);
};
