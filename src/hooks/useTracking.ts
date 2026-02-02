import { useEffect, useRef, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * Returns the full path including hash (e.g., "/dashboard#calendario")
 */
const getFullPath = (pathname: string, hash: string) => {
  return hash ? `${pathname}${hash}` : pathname;
};

export const useTracking = (userId: string | undefined) => {
  const location = useLocation();
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const currentVisitId = useRef<string | null>(null);
  const enterTime = useRef<Date | null>(null);

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Track page visit with hash
  const trackPageEnter = useCallback(async (pagePath: string) => {
    if (!userId) return;

    try {
      enterTime.current = new Date();
      const { data, error } = await supabase
        .from('page_visits')
        .insert({
          user_id: userId,
          page_path: pagePath,
        })
        .select('id')
        .single();

      if (!error && data) {
        currentVisitId.current = data.id;
      }
    } catch (error) {
      console.error('Error tracking page enter:', error);
    }
  }, [userId]);

  const trackPageLeave = useCallback(async () => {
    if (!userId || !currentVisitId.current || !enterTime.current) return;

    try {
      const now = new Date();
      const durationSeconds = Math.floor((now.getTime() - enterTime.current.getTime()) / 1000);

      await supabase
        .from('page_visits')
        .update({
          left_at: now.toISOString(),
          duration_seconds: durationSeconds,
        })
        .eq('id', currentVisitId.current);

      currentVisitId.current = null;
      enterTime.current = null;
    } catch (error) {
      console.error('Error tracking page leave:', error);
    }
  }, [userId]);

  // Track button click with full path (including hash)
  const trackButtonClick = useCallback(async (buttonId: string, buttonLabel?: string) => {
    if (!userId) return;

    try {
      const fullPath = getFullPath(location.pathname, currentHash);
      await supabase.from('button_clicks').insert({
        user_id: userId,
        button_id: buttonId,
        button_label: buttonLabel,
        page_path: fullPath,
      });
    } catch (error) {
      console.error('Error tracking button click:', error);
    }
  }, [userId, location.pathname, currentHash]);

  // Handle page/hash changes
  useEffect(() => {
    if (!userId) return;

    const fullPath = getFullPath(location.pathname, currentHash);

    // Leave previous page
    trackPageLeave();
    
    // Enter new page/hash
    trackPageEnter(fullPath);

    // Cleanup on unmount
    return () => {
      trackPageLeave();
    };
  }, [location.pathname, currentHash, userId, trackPageEnter, trackPageLeave]);

  return { trackButtonClick };
};