import { useRef, useState, useEffect, useCallback } from 'react';

type ScrollonStreamProps = {
  bottomRef?: React.RefObject<HTMLDivElement>;
  isStreaming: boolean;
};

export function useScrollonStream({
  bottomRef,
  isStreaming,
}: ScrollonStreamProps) {
  const [enabled, setEnabled] = useState(true);
  const scrollIntervalRef = useRef<number | null>(null);
  const stopStreamingTimeoutRef = useRef<number | null>(null);
  const [isActive, setIsActive] = useState(isStreaming);

  function clearScrollInterval() {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }

  const disableScroll = useCallback(() => {
    clearScrollInterval();
    setEnabled(false);
  }, []);

  // Track streaming state with grace period for brief interruptions
  useEffect(() => {
    if (stopStreamingTimeoutRef.current) {
      clearTimeout(stopStreamingTimeoutRef.current);
    }

    if (isStreaming) {
      setIsActive(true);
    } else {
      // Wait before considering streaming stopped
      stopStreamingTimeoutRef.current = window.setTimeout(() => {
        setIsActive(false);
      }, 500);
    }

    return () => {
      if (stopStreamingTimeoutRef.current) {
        clearTimeout(stopStreamingTimeoutRef.current);
      }
    };
  }, [isStreaming]);

  // Listen for user input events that indicate scrolling intent
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const userEvents = ['wheel', 'touchstart', 'keydown', 'mousedown'];

    userEvents.forEach((e) => {
      window.addEventListener(e, disableScroll, { passive: true });
    });

    return () => {
      userEvents.forEach((e) => {
        window.removeEventListener(e, disableScroll);
      });
    };
  }, [disableScroll, enabled]);

  // Scroll to bottom when new content streams in
  useEffect(() => {
    function scrollToBottom() {
      const bottomEl = bottomRef?.current;
      if (!bottomEl) return;

      const rect = bottomEl.getBoundingClientRect();
      const offset = 24;
      const targetScrollY =
        window.scrollY + rect.bottom - window.innerHeight + offset;

      // Already at target position
      if (Math.abs(targetScrollY - window.scrollY) < 1) {
        return;
      }

      window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth',
      });
    }

    if (!enabled) {
      return;
    }

    if (!isActive) {
      // One final scroll when streaming stops
      setTimeout(() => {
        disableScroll();
        scrollToBottom();
      }, 100);
      return;
    }

    scrollIntervalRef.current = window.setInterval(scrollToBottom, 100);

    return () => {
      clearScrollInterval();
    };
  }, [isActive, bottomRef, disableScroll, enabled]);
}
