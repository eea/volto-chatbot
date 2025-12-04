import type { Packet } from '../types/streamingModels';
import { useMemo, useState, useCallback, useEffect } from 'react';

interface ToolState {
  isVisible: boolean;
  isCompleted: boolean;
}

/**
 * Simplified hook for tracking tool visibility and completion.
 * All tools are shown immediately as they arrive (collapsed).
 * No artificial delays - tools complete as soon as their rendering finishes.
 */
export function useToolDisplayTiming(
  toolGroups: { ind: number; packets: Packet[] }[],
  isFinalMessageComing: boolean,
  _isComplete: boolean,
) {
  const [toolStates, setToolStates] = useState<Map<number, ToolState>>(
    () => new Map(),
  );

  // Make all tools visible immediately as they arrive
  useEffect(() => {
    if (toolGroups.length === 0) return;

    setToolStates((prev) => {
      const newStates = new Map(prev);
      let hasChanges = false;

      toolGroups.forEach((group) => {
        if (!newStates.has(group.ind)) {
          newStates.set(group.ind, {
            isVisible: true,
            isCompleted: false,
          });
          hasChanges = true;
        }
      });

      return hasChanges ? newStates : prev;
    });
  }, [toolGroups]);

  // Mark tool as completed immediately when called
  const handleToolComplete = useCallback((toolInd: number) => {
    setToolStates((prev) => {
      const currentState = prev.get(toolInd);
      if (!currentState || currentState.isCompleted) return prev;

      const newStates = new Map(prev);
      newStates.set(toolInd, { ...currentState, isCompleted: true });
      return newStates;
    });
  }, []);

  // All tools are visible immediately
  const visibleTools = useMemo(
    () => new Set(toolGroups.map((group) => group.ind)),
    [toolGroups],
  );

  // All tools are displayed when all are completed and final message is coming
  const allToolsDisplayed = useMemo(() => {
    if (toolGroups.length === 0) return true;

    const allCompleted = toolGroups.every((group) => {
      const state = toolStates.get(group.ind);
      return state?.isCompleted;
    });

    return allCompleted && isFinalMessageComing;
  }, [toolGroups, toolStates, isFinalMessageComing]);

  return {
    visibleTools,
    handleToolComplete,
    allToolsDisplayed,
  };
}
