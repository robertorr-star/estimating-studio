import { useEffect, useRef, useCallback } from 'react';
import {
  startSession,
  endSession,
  updateSessionActivity,
  markSessionIdle,
  updateCostSummary,
} from '@/services/timeTrackingService';

const IDLE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export const useTimeTracking = (estimateId: string | null, userName: string = 'Sigfried') => {
  const sessionIdRef = useRef<string | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isIdleRef = useRef(false);

  // Start session on mount
  useEffect(() => {
    if (!estimateId) return;
    let mounted = true;

    const init = async () => {
      const sid = await startSession(estimateId, userName);
      if (mounted && sid) sessionIdRef.current = sid;
    };
    init();

    return () => {
      mounted = false;
      // End session on unmount
      if (sessionIdRef.current) {
        endSession(sessionIdRef.current).then(() => {
          if (estimateId) updateCostSummary(estimateId);
        });
        sessionIdRef.current = null;
      }
    };
  }, [estimateId, userName]);

  // Idle detection
  useEffect(() => {
    if (!estimateId) return;

    const checkIdle = () => {
      if (!sessionIdRef.current) return;
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= IDLE_THRESHOLD_MS && !isIdleRef.current) {
        isIdleRef.current = true;
        markSessionIdle(sessionIdRef.current);
      }
    };

    idleTimerRef.current = setInterval(checkIdle, 30000); // check every 30s

    const onActivity = () => {
      lastActivityRef.current = Date.now();
      if (isIdleRef.current && estimateId) {
        isIdleRef.current = false;
        // Start new session after idle
        startSession(estimateId, userName).then(sid => {
          if (sid) sessionIdRef.current = sid;
        });
      }
    };

    window.addEventListener('mousemove', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity, { passive: true });
    window.addEventListener('click', onActivity, { passive: true });

    return () => {
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('click', onActivity);
    };
  }, [estimateId, userName]);

  const trackActivity = useCallback((activityType: string) => {
    lastActivityRef.current = Date.now();
    if (sessionIdRef.current) {
      updateSessionActivity(sessionIdRef.current, activityType);
    }
  }, []);

  return { trackActivity };
};
