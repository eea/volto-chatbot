import type { Packet } from '../types/streamingModels';
import { useMemo, useState, useCallback, useEffect, useRef } from 'react';

const MINIMUM_DISPLAY_TIME_MS = 1500;

interface ToolState {
  isVisible: boolean;
  isCompleted: boolean;
  startTime?: number;
}

export function useToolDisplayTiming(
  toolGroups: { ind: number; packets: Packet[] }[],
  isFinalMessageComing: boolean,
  isComplete: boolean,
) {
  const [toolStates, setToolStates] = useState<Map<number, ToolState>>(() => {
    const initialStates = new Map<number, ToolState>();
    if (isComplete) {
      toolGroups.forEach((group) => {
        initialStates.set(group.ind, {
          isVisible: true,
          isCompleted: true,
        });
      });
    }
    return initialStates;
  });

  const timeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  // Initialize first tool visibility
  useEffect(() => {
    if (toolGroups.length === 0) return;

    setToolStates((prev) => {
      const newStates = new Map(prev);
      const firstTool = toolGroups[0];

      if (firstTool && !newStates.has(firstTool.ind)) {
        newStates.set(firstTool.ind, {
          isVisible: true,
          isCompleted: false,
          startTime: Date.now(),
        });
      }
      return newStates;
    });
  }, [toolGroups]);

  // Show next tool when previous one completes
  useEffect(() => {
    const visibleTools = Array.from(toolStates.entries())
      .filter(([, state]) => state.isVisible)
      .map(([ind]) => ind);

    if (visibleTools.length === 0) return;

    const lastVisibleInd = visibleTools[visibleTools.length - 1];
    const lastVisibleIndex = toolGroups.findIndex(
      (group) => group.ind === lastVisibleInd,
    );

    if (
      lastVisibleIndex >= 0 &&
      lastVisibleIndex < toolGroups.length - 1 &&
      toolStates.get(lastVisibleInd)?.isCompleted
    ) {
      const nextTool = toolGroups[lastVisibleIndex + 1];
      if (nextTool && !toolStates.has(nextTool.ind)) {
        setToolStates((prev) => {
          const newStates = new Map(prev);
          newStates.set(nextTool.ind, {
            isVisible: true,
            isCompleted: false,
            startTime: Date.now(),
          });
          return newStates;
        });
      }
    }
  }, [toolStates, toolGroups]);

  const handleToolComplete = useCallback(
    (toolInd: number) => {
      const currentState = toolStates.get(toolInd);
      if (!currentState || currentState.isCompleted) return;

      const now = Date.now();
      const startTime = currentState.startTime || now;
      const elapsedTime = now - startTime;

      // Clear existing timeout for this tool
      const existingTimeout = timeoutsRef.current.get(toolInd);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        timeoutsRef.current.delete(toolInd);
      }

      if (elapsedTime >= MINIMUM_DISPLAY_TIME_MS) {
        setToolStates((prev) => {
          const newStates = new Map(prev);
          const state = newStates.get(toolInd);
          if (state) {
            newStates.set(toolInd, { ...state, isCompleted: true });
          }
          return newStates;
        });
      } else {
        const timeoutId = setTimeout(() => {
          setToolStates((prev) => {
            const newStates = new Map(prev);
            const state = newStates.get(toolInd);
            if (state) {
              newStates.set(toolInd, { ...state, isCompleted: true });
            }
            return newStates;
          });
          timeoutsRef.current.delete(toolInd);
        }, MINIMUM_DISPLAY_TIME_MS - elapsedTime);

        timeoutsRef.current.set(toolInd, timeoutId);
      }
    },
    [toolStates],
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  const visibleTools = useMemo(
    () =>
      new Set(
        Array.from(toolStates.entries())
          .filter(([, state]) => state.isVisible)
          .map(([ind]) => ind),
      ),
    [toolStates],
  );

  const allToolsDisplayed = useMemo(() => {
    if (toolGroups.length === 0) return true;

    return (
      toolGroups.every((group) => {
        const state = toolStates.get(group.ind);
        return state?.isVisible && state?.isCompleted;
      }) && isFinalMessageComing
    );
  }, [toolGroups, toolStates, isFinalMessageComing]);

  return {
    visibleTools,
    handleToolComplete,
    allToolsDisplayed,
  };
}
