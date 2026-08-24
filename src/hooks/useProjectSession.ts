import { useState, useCallback, useEffect, useRef } from 'react';
import { ProjectData } from '../types';
import { StorageService } from '../lib/storage';
import { sanitizeAndMigrateProject } from '../lib/projectMigration';
import { ProjectMutations } from '../lib/projectMutations';

interface UseProjectSessionOptions {
  autoSaveIntervalMs?: number;
  onAutoSave?: (project: ProjectData) => void;
  onSaveError?: (err: Error) => void;
}

export function useProjectSession(options: UseProjectSessionOptions = {}) {
  const { autoSaveIntervalMs = 2500, onAutoSave, onSaveError } = options;

  const [currentProject, setCurrentProject] = useState<ProjectData>(() => {
    const loaded = StorageService.loadCurrentProject();
    return sanitizeAndMigrateProject(loaded);
  });

  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(new Date());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('saved');
  const projectRef = useRef<ProjectData>(currentProject);
  projectRef.current = currentProject;

  // Persist project immediately or mark dirty
  const mutateProject = useCallback((updater: (prev: ProjectData) => Partial<ProjectData>) => {
    setCurrentProject((prev) => {
      const next = ProjectMutations.apply(prev, updater);
      setIsDirty(true);
      return next;
    });
  }, []);

  const setProjectDirect = useCallback((newProject: ProjectData, markSaved = false) => {
    const sanitized = sanitizeAndMigrateProject(newProject);
    setCurrentProject(sanitized);
    if (markSaved) {
      StorageService.saveProject(sanitized);
      setIsDirty(false);
      setLastSavedTime(new Date());
      setSaveStatus('saved');
    } else {
      setIsDirty(true);
    }
  }, []);

  // Manual save trigger
  const saveNow = useCallback(async () => {
    try {
      setSaveStatus('saving');
      const sanitized = sanitizeAndMigrateProject(projectRef.current);
      StorageService.saveProject(sanitized);
      setIsDirty(false);
      setLastSavedTime(new Date());
      setSaveStatus('saved');
      onAutoSave?.(sanitized);
    } catch (err) {
      setSaveStatus('error');
      onSaveError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }, [onAutoSave, onSaveError]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!isDirty) return;

    const timer = setTimeout(() => {
      saveNow();
    }, autoSaveIntervalMs);

    return () => clearTimeout(timer);
  }, [isDirty, autoSaveIntervalMs, saveNow]);

  return {
    currentProject,
    setCurrentProject,
    setProjectDirect,
    mutateProject,
    isDirty,
    saveStatus,
    lastSavedTime,
    saveNow,
  };
}
