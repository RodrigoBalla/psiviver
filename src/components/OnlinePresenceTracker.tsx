import React from 'react';
import { useOnlinePresence } from '@/hooks/useOnlinePresence';

/**
 * Component to track user's online presence.
 * Must be rendered inside BrowserRouter and AuthProvider.
 */
export const OnlinePresenceTracker: React.FC = () => {
  useOnlinePresence();
  return null;
};
