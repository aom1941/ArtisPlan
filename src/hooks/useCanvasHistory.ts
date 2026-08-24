import { useState, useCallback, useRef } from 'react';
import { ProjectData } from '../types';

interface UseCanvasHistoryOptions {
  maxHistory?: number;
}

export function useCanvasHistory(initialProject: ProjectData, options: UseCanvasHistoryOptions = {}) {
  const { maxHistory = 40 } = options;

  const [history, setHistory] = useState<ProjectData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isHistoryActionRef = useRef<boolean>(false);

  /**
   * Push a previous snapshot to the history stack before an edit occurs.
   */
  const recordHistory = useCallback((currentSnapshot: ProjectData) => {
    if (isHistoryActionRef.current) return;

    setHistory((prev) => {
      // Trim forward history if we mutated while in the middle of the stack
      const updated = prev.slice(0, historyIndex + 1);
      
      // Avoid duplicate consecutive identical state revisions
      const last = updated[updated.length - 1];
      if (last && last.revision === currentSnapshot.revision) {
        return updated;
      }

      const nextStack = [...updated, currentSnapshot];
      if (nextStack.length > maxHistory) {
        return nextStack.slice(nextStack.length - maxHistory);
      }
      return nextStack;
    });

    setHistoryIndex((prev) => {
      const target = Math.min(prev + 1, maxHistory - 1);
      return target;
    });
  }, [historyIndex, maxHistory]);

  const canUndo = historyIndex >= 0 && history.length > 0;
  const canRedo = historyIndex < history.length - 1;

  const undo = useCallback((currentProject: ProjectData): ProjectData | null => {
    if (!canUndo) return null;
    isHistoryActionRef.current = true;

    try {
      const targetState = history[historyIndex];
      setHistoryIndex((prev) => prev - 1);
      return targetState;
    } finally {
      setTimeout(() => {
        isHistoryActionRef.current = false;
      }, 50);
    }
  }, [canUndo, history, historyIndex]);

  const redo = useCallback((currentProject: ProjectData): ProjectData | null => {
    if (!canRedo) return null;
    isHistoryActionRef.current = true;

    try {
      const nextIndex = historyIndex + 1;
      const targetState = history[nextIndex];
      setHistoryIndex(nextIndex);
      return targetState;
    } finally {
      setTimeout(() => {
        isHistoryActionRef.current = false;
      }, 50);
    }
  }, [canRedo, history, historyIndex]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  return {
    recordHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    historyLength: history.length,
    historyIndex,
  };
}
