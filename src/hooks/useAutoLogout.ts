import { useEffect, useRef } from 'react';
import { redirectToLogout } from '@wristband/react-client-auth';

interface UseAutoLogoutOptions {
  inactivityTimeout?: number; // in milliseconds
  enabled?: boolean;
}

/**
 * Hook to automatically log out users after a period of inactivity
 * Default: 30 minutes of inactivity
 */
export const useAutoLogout = (options: UseAutoLogoutOptions = {}) => {
  const {
    inactivityTimeout = 30 * 60 * 1000, // 30 minutes default
    enabled = true
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const logout = () => {
    console.log('Auto-logout triggered due to inactivity');
    redirectToLogout('/.netlify/functions/auth-logout');
  };

  const resetTimer = () => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      logout();
    }, inactivityTimeout);
  };

  useEffect(() => {
    if (!enabled) return;

    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Reset timer on any user activity
    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [enabled, inactivityTimeout]);
};
