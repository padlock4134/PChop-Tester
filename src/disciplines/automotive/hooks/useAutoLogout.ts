import { useEffect, useRef, useState } from 'react';
import { redirectToLogout } from '@wristband/react-client-auth';

interface UseAutoLogoutOptions {
  inactivityTimeout?: number; // in milliseconds
  warningTime?: number; // milliseconds before timeout to show warning
  enabled?: boolean;
}

interface UseAutoLogoutReturn {
  showWarning: boolean;
  countdown: number;
  stayLoggedIn: () => void;
  logoutNow: () => void;
}

/**
 * Hook to automatically log out users after a period of inactivity
 * Default: 30 minutes of inactivity, with 2-minute warning
 */
export const useAutoLogout = (options: UseAutoLogoutOptions = {}): UseAutoLogoutReturn => {
  const {
    inactivityTimeout = 30 * 60 * 1000, // 30 minutes default
    warningTime = 2 * 60 * 1000, // 2 minutes warning default
    enabled = true
  } = options;

  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const logout = () => {
    setShowWarning(false);
    redirectToLogout('/.netlify/functions/auth-logout');
  };

  const clearAllTimers = () => {
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const startCountdown = () => {
    const warningSeconds = Math.floor(warningTime / 1000);
    setCountdown(warningSeconds);
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetTimer = () => {
    clearAllTimers();
    setShowWarning(false);

    // Set warning timeout (show modal before logout)
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      startCountdown();
      
      // Set final logout timeout
      logoutTimeoutRef.current = setTimeout(() => {
        logout();
      }, warningTime);
    }, inactivityTimeout - warningTime);
  };

  const stayLoggedIn = () => {
    resetTimer();
  };

  const logoutNow = () => {
    clearAllTimers();
    logout();
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

    // Reset timer on any user activity (only if warning is not shown)
    const handleActivity = () => {
      if (!showWarning) {
        resetTimer();
      }
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      clearAllTimers();
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [enabled, inactivityTimeout, warningTime]);

  return {
    showWarning,
    countdown,
    stayLoggedIn,
    logoutNow
  };
};
