import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const useTracking = (userId: string | undefined) => {
  const location = useLocation();
  const currentVisitId = useRef<string | null>(null);
  const enterTime = useRef<Date | null>(null);

  // Track page visit
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

  // Track button click
  const trackButtonClick = useCallback(async (buttonId: string, buttonLabel?: string) => {
    if (!userId) return;

    try {
      await supabase.from('button_clicks').insert({
        user_id: userId,
        button_id: buttonId,
        button_label: buttonLabel,
        page_path: location.pathname,
      });
    } catch (error) {
      console.error('Error tracking button click:', error);
    }
  }, [userId, location.pathname]);

  // Handle page changes
  useEffect(() => {
    if (!userId) return;

    // Leave previous page
    trackPageLeave();
    
    // Enter new page
    trackPageEnter(location.pathname);

    // Cleanup on unmount
    return () => {
      trackPageLeave();
    };
  }, [location.pathname, userId, trackPageEnter, trackPageLeave]);

  return { trackButtonClick };
};
