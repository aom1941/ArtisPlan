import { useState, useCallback } from 'react';

export function useModalState() {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBrushSettingsOpen, setIsBrushSettingsOpen] = useState(false);
  const [isSmartGuidesPanelOpen, setIsSmartGuidesPanelOpen] = useState(false);
  const [isHeatmapOpen, setIsHeatmapOpen] = useState(false);
  const [isVersionControlOpen, setIsVersionControlOpen] = useState(false);
  const [isFloatingRefOpen, setIsFloatingRefOpen] = useState(false);

  const closeAll = useCallback(() => {
    setIsExportOpen(false);
    setIsNewProjectOpen(false);
    setIsWorkspaceOpen(false);
    setIsSettingsOpen(false);
    setIsBrushSettingsOpen(false);
    setIsSmartGuidesPanelOpen(false);
    setIsHeatmapOpen(false);
    setIsVersionControlOpen(false);
  }, []);

  return {
    isExportOpen,
    setIsExportOpen,
    isNewProjectOpen,
    setIsNewProjectOpen,
    isWorkspaceOpen,
    setIsWorkspaceOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isBrushSettingsOpen,
    setIsBrushSettingsOpen,
    isSmartGuidesPanelOpen,
    setIsSmartGuidesPanelOpen,
    isHeatmapOpen,
    setIsHeatmapOpen,
    isVersionControlOpen,
    setIsVersionControlOpen,
    isFloatingRefOpen,
    setIsFloatingRefOpen,
    closeAll,
  };
}
