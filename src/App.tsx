import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { 
  ProjectData, 
  CanvasTool, 
  ShapeType, 
  CanvasAnnotation, 
  StylusSettings, 
  MoodboardData, 
  ReferenceImageItem,
  CanvasLayer,
  BrushPreset,
  ProjectVersion,
  EraserMode
} from './types';
import { Navbar } from './components/Navbar';
import { InfiniteCanvas } from './components/Canvas/InfiniteCanvas';
import { CanvasToolbar } from './components/Canvas/CanvasToolbar';
import { LayersPanel } from './components/Canvas/LayersPanel';
import { AnnotationModal } from './components/Canvas/AnnotationModal';
import { MoodboardGenerator } from './components/Moodboard/MoodboardGenerator';
import { TimelineTracker } from './components/Timeline/TimelineTracker';
import { ReferenceGallery } from './components/Gallery/ReferenceGallery';
import { NextcloudWorkspaceModal } from './components/Workspace/NextcloudWorkspaceModal';
import { ShortcutsModal } from './components/Settings/ShortcutsModal';
import { NewProjectModal } from './components/NewProjectModal';
import { FloatingReferenceWindow } from './components/FloatingReferenceWindow';
import { TabletControls } from './components/TabletControls';
import { TimeMachineModal } from './components/VersionControl/TimeMachineModal';
import { VersionCompareView } from './components/VersionControl/VersionCompareView';
import { BrushStudioModal } from './components/Brushes/BrushStudioModal';
import { CanvasSearchSidebar } from './components/Canvas/CanvasSearchSidebar';
import { HeatmapInspectorPanel } from './components/Canvas/HeatmapInspectorPanel';
import { TouchGestureModal } from './components/Canvas/TouchGestureModal';
import { ExportCanvasModal } from './components/Canvas/ExportCanvasModal';
import { GuideManagerPanel } from './components/Canvas/GuideManagerPanel';
import type { HeatmapSettings, HotspotCluster } from './types/heatmap';
import type { TouchGestureSettings, CanvasActionId } from './types/gestures';
import { loadTouchSettings, saveTouchSettings } from './lib/gestureEngine';
import { 
  loadLocalProject, 
  saveLocalProject, 
  listAllLocalProjects, 
  createDefaultProject,
  sanitizeProject
} from './lib/storage';
import {
  isNextcloudConfigured,
  saveProjectToNextcloud,
  fetchProjectFromNextcloud
} from './lib/nextcloudSync';
import {
  backupProjectToNextcloud,
  exportTimelineToNextcloud
} from './lib/workspace';
import { getActiveBrushPreset, saveCustomBrush } from './lib/brushEngine';
import { isWerkstattSyncConfigured, syncTimelineToWerkstatt } from './lib/werkstattSync';
import { createVersionSnapshot, loadProjectVersions } from './lib/versionControl';
import { alignCanvasObjects, type CanvasAlignmentAction } from './lib/alignmentEngine';
import { useCanvasHistory } from './hooks/useCanvasHistory';
import { sanitizeAndMigrateProject } from './lib/projectMigration';
import { ProjectMutations } from './lib/projectMutations';

export default function App() {
  // Theme state: dark | light | oled | sepia
  const [theme, setTheme] = useState<'dark' | 'light' | 'oled' | 'sepia'>('dark');

  // Active View: canvas | moodboard | timeline | gallery | workspace
  const [activeView, setActiveView] = useState<'canvas' | 'moodboard' | 'timeline' | 'gallery' | 'workspace'>('canvas');

  // Project state
  const [project, setProject] = useState<ProjectData>(() => {
    const raw = loadLocalProject();
    return sanitizeProject(raw);
  });
  const [projectList, setProjectList] = useState(() => listAllLocalProjects());

  // History Stack for Undo/Redo via custom hook
  const {
    recordHistory: pushHistorySnapshot,
    undo: popUndo,
    redo: popRedo,
    canUndo,
    canRedo,
    clearHistory,
  } = useCanvasHistory(project, { maxHistory: 35 });

  // Active Drawing & Canvas State
  const [activeTool, setActiveTool] = useState<CanvasTool>('pen');
  const [eraserMode, setEraserMode] = useState<EraserMode>('stroke');
  const [activeColor, setActiveColor] = useState('#06B6D4');
  const [strokeSize, setStrokeSize] = useState(4);
  const [activeOpacity, setActiveOpacity] = useState(1.0);
  const [selectedShapeType, setSelectedShapeType] = useState<ShapeType>('rectangle');
  const [activeLayerId, setActiveLayerId] = useState('layer-sketch');
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 100, y: 80 });

  // Brush System State
  const [activeBrushPreset, setActiveBrushPreset] = useState<BrushPreset>(() => getActiveBrushPreset());
  const [showBrushStudio, setShowBrushStudio] = useState(false);

  // Version Control & Time Machine State
  const [showTimeMachine, setShowTimeMachine] = useState(false);
  const [comparingVersions, setComparingVersions] = useState<{ versionA: ProjectVersion; versionB: ProjectVersion } | null>(null);

  // Panels & Modals State
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [showSearchSidebar, setShowSearchSidebar] = useState(false);
  const [showHeatmapInspector, setShowHeatmapInspector] = useState(false);
  const [highlightedElementId, setHighlightedElementId] = useState<string | null>(null);
  const [highlightedHotspotId, setHighlightedHotspotId] = useState<string | null>(null);
  const [heatmapSettings, setHeatmapSettings] = useState<HeatmapSettings>({
    enabled: false,
    opacity: 0.65,
    radius: 75,
    intensity: 1.2,
    metric: 'strokes',
    colorScale: 'thermal',
    showHotspotBadges: true,
    onlyActiveLayer: false
  });
  const [activeAnnotation, setActiveAnnotation] = useState<CanvasAnnotation | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTouchGestureModal, setShowTouchGestureModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showGuideManager, setShowGuideManager] = useState(false);
  const [touchSettings, setTouchSettings] = useState<TouchGestureSettings>(() => loadTouchSettings());
  const [pipReference, setPipReference] = useState<ReferenceImageItem | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedCanvasElements, setSelectedCanvasElements] = useState<Array<{ type: 'image' | 'sticky' | 'text' | 'shape' | 'annotation'; id: string }>>([]);

  // Tablet & Stylus Settings
  const [stylusSettings, setStylusSettings] = useState<StylusSettings>({
    palmRejection: true,
    pressureSensitivity: 1.0,
    smoothing: 4,
    stabilization: 40,
    lowLatency: true,
    vibrationFeedback: true,
    touchPanZoom: true
  });

  // Nextcloud Sync State (no login/auth state needed — config is env-based, see lib/nextcloudSync.ts)
  const [isCloudSynced, setIsCloudSynced] = useState(true);
  const [isBackingUpNextcloud, setIsBackingUpNextcloud] = useState(false);
  const [isExportingSheet, setIsExportingSheet] = useState(false);

  // One-shot pull from Nextcloud on project load/switch. Unlike the old
  // Firestore subscription, WebDAV has no push mechanism — this is a single
  // fetch-and-adopt-if-newer check, not a live subscription.
  useEffect(() => {
    if (!isNextcloudConfigured()) return;
    let cancelled = false;
    fetchProjectFromNextcloud(project.id).then((remoteProject) => {
      if (!cancelled && remoteProject && remoteProject.updatedAt > project.updatedAt) {
        setProject(sanitizeProject(remoteProject));
      }
    });
    return () => { cancelled = true; };
  }, [project.id]);

  // Auto-Save locally & to Nextcloud (debounced)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    saveLocalProject(project);
    setIsCloudSynced(false);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const success = await saveProjectToNextcloud(project);
      if (success) setIsCloudSynced(true);

      // Best-effort bridge into Project Companion OS's werkstatt_sdk roadmap
      // store. No-ops when VITE_WERKSTATT_API_URL isn't set; a failure here
      // must never affect Nextcloud sync state or canvas usage.
      if (isWerkstattSyncConfigured()) {
        syncTimelineToWerkstatt(project).catch((err) => {
          console.warn('Werkstatt-Sync fehlgeschlagen (nicht kritisch):', err);
        });
      }
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [project]);

  // Record History Snapshot for Undo
  const recordHistory = useCallback(() => {
    pushHistorySnapshot(project);
  }, [project, pushHistorySnapshot]);

  const handleUndo = useCallback(() => {
    const prev = popUndo(project);
    if (prev) {
      setProject(sanitizeProject(prev));
    }
  }, [popUndo, project]);

  const handleRedo = useCallback(() => {
    const next = popRedo(project);
    if (next) {
      setProject(sanitizeProject(next));
    }
  }, [popRedo, project]);

  // Keyboard Shortcuts Global Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setShowExportModal(true);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'f' || e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setShowSearchSidebar(prev => !prev);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setShowHeatmapInspector(prev => !prev);
        setHeatmapSettings(prev => ({ ...prev, enabled: true }));
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        setShowTimeMachine(true);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setShowBrushStudio(true);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          setActiveTool('select');
          break;
        case 'b':
          setActiveTool('pen');
          break;
        case 'n':
          setActiveTool('brush');
          break;
        case 'p':
          setActiveTool('pencil');
          break;
        case 'e':
          setActiveTool('eraser');
          break;
        case 's':
          if (!e.ctrlKey && !e.metaKey) setActiveTool('sticky');
          break;
        case 't':
          setActiveTool('text');
          break;
        case 'u':
          setActiveTool('shape');
          break;
        case 'c':
          setActiveTool('annotation');
          break;
        case 'i':
          setActiveTool('eyedropper');
          break;
        case 'h':
          setActiveTool('hand');
          break;
        case 'm':
          setActiveView('moodboard');
          break;
        case 'l':
          setActiveView('timeline');
          break;
        case 'g':
          setActiveView('gallery');
          break;
        case '?':
          setShowShortcutsModal(true);
          break;
        case '+':
        case '=':
          setZoom(prev => Math.min(prev * 1.15, 5.0));
          break;
        case '-':
          setZoom(prev => Math.max(prev * 0.85, 0.15));
          break;
        case '0':
          setZoom(1.0);
          setPan({ x: 100, y: 80 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Project Switching & Creation
  const handleSelectProject = (id: string) => {
    const loaded = loadLocalProject(id);
    setProject(loaded);
    setShowProjectModal(false);
  };

  const handleCreateNewProject = (title: string, description: string) => {
    const newProj = createDefaultProject(`proj-${Date.now()}`, title);
    newProj.description = description;
    setProject(newProj);
    saveLocalProject(newProj);
    setProjectList(listAllLocalProjects());
    setShowProjectModal(false);
    setActiveView('canvas');
  };

  // Smooth pan & zoom navigation to selected canvas object
  const handleNavigateToObject = useCallback((item: {
    id: string;
    type: 'sticky' | 'text' | 'shape' | 'image' | 'annotation';
    x: number;
    y: number;
    width?: number;
    height?: number;
  }) => {
    if (activeView !== 'canvas') {
      setActiveView('canvas');
    }

    const objWidth = item.width || (item.type === 'text' ? 140 : item.type === 'annotation' ? 32 : 180);
    const objHeight = item.height || (item.type === 'text' ? 40 : item.type === 'annotation' ? 32 : 180);
    const centerX = item.x + objWidth / 2;
    const centerY = item.y + objHeight / 2;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight - 56;

    // Appropriate target zoom based on item dimensions
    let targetZoom = 1.25;
    if (objWidth > 400 || objHeight > 400) {
      targetZoom = Math.min(1.4, Math.max(0.4, Math.min((viewportWidth * 0.65) / objWidth, (viewportHeight * 0.65) / objHeight)));
    }

    const targetPanX = (viewportWidth / 2) - centerX * targetZoom;
    const targetPanY = (viewportHeight / 2) - centerY * targetZoom;

    // Smooth cubic animation
    const startPanX = pan.x;
    const startPanY = pan.y;
    const startZoom = zoom;
    const duration = 300;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);

      setPan({
        x: startPanX + (targetPanX - startPanX) * ease,
        y: startPanY + (targetPanY - startPanY) * ease
      });
      setZoom(startZoom + (targetZoom - startZoom) * ease);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);

    // Set highlight & auto-clear after 3.8s
    setHighlightedElementId(item.id);
    setTimeout(() => {
      setHighlightedElementId(prev => (prev === item.id ? null : prev));
    }, 3800);
  }, [activeView, pan, zoom]);

  // Zoom & Pan to fit all canvas elements
  const handleFitAllContent = useCallback(() => {
    if (activeView !== 'canvas') {
      setActiveView('canvas');
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    project.stickies.forEach(s => {
      minX = Math.min(minX, s.x);
      minY = Math.min(minY, s.y);
      maxX = Math.max(maxX, s.x + (s.width || 180));
      maxY = Math.max(maxY, s.y + (s.height || 180));
    });

    project.texts.forEach(t => {
      minX = Math.min(minX, t.x);
      minY = Math.min(minY, t.y);
      maxX = Math.max(maxX, t.x + 180);
      maxY = Math.max(maxY, t.y + 50);
    });

    project.shapes.forEach(s => {
      minX = Math.min(minX, s.x);
      minY = Math.min(minY, s.y);
      maxX = Math.max(maxX, s.x + s.width);
      maxY = Math.max(maxY, s.y + s.height);
    });

    project.images.forEach(img => {
      minX = Math.min(minX, img.x);
      minY = Math.min(minY, img.y);
      maxX = Math.max(maxX, img.x + img.width);
      maxY = Math.max(maxY, img.y + img.height);
    });

    project.annotations.forEach(a => {
      minX = Math.min(minX, a.x - 24);
      minY = Math.min(minY, a.y - 24);
      maxX = Math.max(maxX, a.x + 24);
      maxY = Math.max(maxY, a.y + 24);
    });

    project.strokes.forEach(str => {
      str.points.forEach(pt => {
        minX = Math.min(minX, pt.x);
        minY = Math.min(minY, pt.y);
        maxX = Math.max(maxX, pt.x);
        maxY = Math.max(maxY, pt.y);
      });
    });

    if (!isFinite(minX) || !isFinite(maxX)) {
      setZoom(1.0);
      setPan({ x: window.innerWidth / 2, y: (window.innerHeight - 56) / 2 });
      return;
    }

    const padding = 120;
    const contentWidth = (maxX - minX) + padding * 2;
    const contentHeight = (maxY - minY) + padding * 2;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight - 56;

    const scaleX = viewportWidth / contentWidth;
    const scaleY = viewportHeight / contentHeight;
    const targetZoom = Math.min(2.0, Math.max(0.15, Math.min(scaleX, scaleY) * 0.9));

    const targetPanX = (viewportWidth / 2) - centerX * targetZoom;
    const targetPanY = (viewportHeight / 2) - centerY * targetZoom;

    const startPanX = pan.x;
    const startPanY = pan.y;
    const startZoom = zoom;
    const duration = 320;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);

      setPan({
        x: startPanX + (targetPanX - startPanX) * ease,
        y: startPanY + (targetPanY - startPanY) * ease
      });
      setZoom(startZoom + (targetZoom - startZoom) * ease);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [activeView, pan, zoom, project]);

  // Navigate & zoom to a detected Heatmap Hotspot
  const handleNavigateToHotspot = useCallback((hotspot: HotspotCluster) => {
    if (activeView !== 'canvas') {
      setActiveView('canvas');
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight - 56;
    const targetZoom = 1.35;

    const targetPanX = (viewportWidth / 2) - hotspot.x * targetZoom;
    const targetPanY = (viewportHeight / 2) - hotspot.y * targetZoom;

    const startPanX = pan.x;
    const startPanY = pan.y;
    const startZoom = zoom;
    const duration = 300;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);

      setPan({
        x: startPanX + (targetPanX - startPanX) * ease,
        y: startPanY + (targetPanY - startPanY) * ease
      });
      setZoom(startZoom + (targetZoom - startZoom) * ease);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);

    setHighlightedHotspotId(hotspot.id);
    setTimeout(() => {
      setHighlightedHotspotId(prev => (prev === hotspot.id ? null : prev));
    }, 4000);
  }, [activeView, pan, zoom]);

  const handleClearActiveLayer = useCallback(() => {
    recordHistory();
    setProject(prev => ({
      ...prev,
      strokes: prev.strokes.filter(s => s.layerId !== activeLayerId),
      texts: prev.texts.filter(t => t.layerId !== activeLayerId),
      stickies: prev.stickies.filter(st => st.layerId !== activeLayerId),
      shapes: prev.shapes.filter(sh => sh.layerId !== activeLayerId)
    }));
  }, [activeLayerId, recordHistory]);

  // Touch Gesture Action Dispatcher
  const handleExecuteGestureAction = useCallback((actionId: CanvasActionId) => {
    switch (actionId) {
      case 'undo':
        handleUndo();
        break;
      case 'redo':
        handleRedo();
        break;
      case 'clear_layer': {
        handleClearActiveLayer();
        break;
      }
      case 'toggle_heatmap':
        setHeatmapSettings(prev => ({ ...prev, enabled: !prev.enabled }));
        break;
      case 'save_version': {
        createVersionSnapshot(
          project, 
          `Quick Snapshot (Gesture)`, 
          'Manual touch gesture snapshot'
        );
        break;
      }
      case 'fit_screen':
        handleFitAllContent();
        break;
      case 'toggle_time_machine':
        setShowTimeMachine(prev => !prev);
        break;
      case 'toggle_brush_studio':
        setShowBrushStudio(prev => !prev);
        break;
      case 'toggle_search':
        setShowSearchSidebar(prev => !prev);
        break;
      case 'toggle_shortcuts':
        setShowShortcutsModal(prev => !prev);
        break;
      case 'toggle_layers':
        setShowLayersPanel(prev => !prev);
        break;
      case 'toggle_fullscreen':
        setIsFullscreen(prev => !prev);
        break;
      case 'eyedropper':
        setActiveTool('eyedropper');
        break;
      case 'open_command_palette':
        // Handled directly inside InfiniteCanvas
        break;
      default:
        break;
    }
  }, [activeLayerId, handleFitAllContent, handleUndo, handleRedo, project, recordHistory]);

  // Canvas Image Dropper
  const handleUploadImageToCanvas = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        recordHistory();
        const newImg = {
          id: `img-${Date.now()}`,
          src: e.target.result as string,
          title: file.name.replace(/\.[^/.]+$/, ""),
          x: (-pan.x + 300) / zoom,
          y: (-pan.y + 200) / zoom,
          width: 320,
          height: 240,
          rotation: 0,
          opacity: 1,
          locked: false,
          layerId: activeLayerId
        };
        setProject(prev => ({
          ...prev,
          images: [...prev.images, newImg]
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDropRefToCanvas = (refItem: ReferenceImageItem) => {
    recordHistory();
    const newImg = {
      id: `img-${Date.now()}`,
      src: refItem.url,
      title: refItem.title,
      x: (-pan.x + 250) / zoom,
      y: (-pan.y + 150) / zoom,
      width: 300,
      height: 220,
      rotation: 0,
      opacity: 1,
      locked: false,
      layerId: activeLayerId,
      tags: refItem.tags
    };
    setProject(prev => ({
      ...prev,
      images: [...prev.images, newImg]
    }));
    setActiveView('canvas');
  };

  // Pin Moodboard to Canvas as interactive cards & palette sticky
  const handlePinMoodboardToCanvas = (mb: MoodboardData) => {
    recordHistory();
    const stickyText = `🎨 MOOD BOARD: ${mb.title}\n\nKey: ${mb.lightingStyle}\nTextures: ${mb.textureFocus}\n\nKeywords: ${mb.keywords.join(', ')}`;
    const newSticky = {
      id: `sticky-mb-${Date.now()}`,
      text: stickyText,
      x: (-pan.x + 200) / zoom,
      y: (-pan.y + 100) / zoom,
      width: 260,
      height: 180,
      color: '#FBCFE8',
      rotation: -1,
      author: 'AI Art Director',
      layerId: activeLayerId,
      createdAt: Date.now()
    };

    setProject(prev => ({
      ...prev,
      stickies: [...prev.stickies, newSticky],
      colorSwatches: Array.from(new Set([...mb.palette.map(p => p.hex), ...prev.colorSwatches]))
    }));
    setActiveView('canvas');
  };

  // Canvas Alignment Handlers
  const handleAlignCanvasObjects = useCallback((action: CanvasAlignmentAction, target: 'selection' | 'canvas') => {
    let targets = selectedCanvasElements;
    if (targets.length === 0) {
      const visibleLayerIds = new Set((project.layers || []).filter(l => l.visible).map(l => l.id));
      targets = [
        ...(project.shapes || []).filter(s => visibleLayerIds.has(s.layerId)).map(s => ({ type: 'shape' as const, id: s.id })),
        ...(project.images || []).filter(i => visibleLayerIds.has(i.layerId) && !i.locked).map(i => ({ type: 'image' as const, id: i.id })),
        ...(project.stickies || []).filter(st => visibleLayerIds.has(st.layerId)).map(st => ({ type: 'sticky' as const, id: st.id })),
        ...(project.texts || []).filter(t => visibleLayerIds.has(t.layerId)).map(t => ({ type: 'text' as const, id: t.id }))
      ];
    }

    if (targets.length === 0) return;

    recordHistory();
    const result = alignCanvasObjects(project, targets, action, {
      canvasCenter: { x: 0, y: 0 },
      gridSize: project.canvasSettings?.gridSize || 20,
      alignTo: target
    });

    setProject(result.updatedProject);
  }, [selectedCanvasElements, project, recordHistory]);

  const handleSelectAllCanvasObjects = useCallback(() => {
    const visibleLayerIds = new Set((project.layers || []).filter(l => l.visible).map(l => l.id));
    const items: Array<{ type: 'image' | 'sticky' | 'text' | 'shape' | 'annotation'; id: string }> = [
      ...(project.shapes || []).filter(s => visibleLayerIds.has(s.layerId)).map(s => ({ type: 'shape' as const, id: s.id })),
      ...(project.images || []).filter(i => visibleLayerIds.has(i.layerId) && !i.locked).map(i => ({ type: 'image' as const, id: i.id })),
      ...(project.stickies || []).filter(st => visibleLayerIds.has(st.layerId)).map(st => ({ type: 'sticky' as const, id: st.id })),
      ...(project.texts || []).filter(t => visibleLayerIds.has(t.layerId)).map(t => ({ type: 'text' as const, id: t.id }))
    ];
    setSelectedCanvasElements(items);
  }, [project]);

  // Nextcloud Backup & Timeline Export Quick Actions
  const handleTriggerNextcloudBackup = async () => {
    if (!isNextcloudConfigured()) {
      setShowWorkspaceModal(true);
      return;
    }
    setIsBackingUpNextcloud(true);
    try {
      await backupProjectToNextcloud(project);
      setProject(prev => ({ ...prev, lastCloudSync: new Date().toISOString() }));
      setIsCloudSynced(true);
    } catch (err) {
      console.error(err);
      setShowWorkspaceModal(true);
    } finally {
      setIsBackingUpNextcloud(false);
    }
  };

  const handleExportTimelineToNextcloud = async () => {
    if (!isNextcloudConfigured()) {
      setShowWorkspaceModal(true);
      return;
    }
    setIsExportingSheet(true);
    try {
      const res = await exportTimelineToNextcloud(project);
      if (res.url) {
        window.open(res.url, '_blank');
      }
    } catch (err) {
      console.error(err);
      setShowWorkspaceModal(true);
    } finally {
      setIsExportingSheet(false);
    }
  };

  return (
    <div className={`w-screen h-screen flex flex-col overflow-hidden ${
      theme === 'light' ? 'bg-zinc-100 text-zinc-900' :
      theme === 'oled' ? 'bg-black text-white' :
      theme === 'sepia' ? 'bg-[#F4ECE1] text-[#3D312A]' :
      'bg-[#0A0A0B] text-zinc-100'
    }`}>
      {/* Top Navigation Bar */}
      {!isFullscreen && (
        <Navbar
          activeView={activeView}
          setActiveView={setActiveView}
          project={project}
          onOpenProjectList={() => setShowProjectModal(true)}
          onNewProject={() => {
            setShowProjectModal(true);
          }}
          zoom={zoom}
          onZoomIn={() => setZoom(prev => Math.min(prev * 1.2, 5.0))}
          onZoomOut={() => setZoom(prev => Math.max(prev * 0.8, 0.15))}
          onResetZoom={() => { setZoom(1.0); setPan({ x: 100, y: 80 }); }}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          theme={theme}
          setTheme={setTheme}
          stylusSettings={stylusSettings}
          setStylusSettings={setStylusSettings}
          onOpenShortcuts={() => setShowShortcutsModal(true)}
          onOpenWorkspace={() => setShowWorkspaceModal(true)}
          isCloudSynced={isCloudSynced}
          nextcloudConfigured={isNextcloudConfigured()}
          onTriggerNextcloudBackup={handleTriggerNextcloudBackup}
          isBackingUp={isBackingUpNextcloud}
          onOpenTimeMachine={() => setShowTimeMachine(true)}
          onOpenBrushStudio={() => setShowBrushStudio(true)}
          onOpenCanvasSearch={() => setShowSearchSidebar(prev => !prev)}
          onOpenHeatmap={() => {
            setShowHeatmapInspector(prev => !prev);
            setHeatmapSettings(prev => ({ ...prev, enabled: true }));
          }}
          isHeatmapActive={heatmapSettings.enabled}
          onOpenExport={() => setShowExportModal(true)}
        />
      )}

      {/* Main View Area */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {activeView === 'canvas' && (
          <>
            <InfiniteCanvas
              project={project}
              setProject={setProject}
              activeTool={activeTool}
              activeColor={activeColor}
              strokeSize={strokeSize}
              activeOpacity={activeOpacity}
              selectedShapeType={selectedShapeType}
              activeLayerId={activeLayerId}
              stylusSettings={stylusSettings}
              zoom={zoom}
              setZoom={setZoom}
              pan={pan}
              setPan={setPan}
              onOpenAnnotation={(anno) => setActiveAnnotation(anno)}
              onColorPick={(hex) => setActiveColor(hex)}
              onRecordHistory={recordHistory}
              theme={theme}
              activeBrushPreset={activeBrushPreset}
              highlightedId={highlightedElementId}
              heatmapSettings={heatmapSettings}
              onSelectHotspot={handleNavigateToHotspot}
              stabilization={stylusSettings.stabilization ?? 40}
              touchSettings={touchSettings}
              onExecuteGestureAction={handleExecuteGestureAction}
              onOpenGestureSettings={() => setShowTouchGestureModal(true)}
              eraserMode={eraserMode}
              onSelectionChange={setSelectedCanvasElements}
              onAlign={handleAlignCanvasObjects}
              onOpenGuideManager={() => setShowGuideManager(true)}
            />

            {/* Artist Floating Dock */}
            <CanvasToolbar
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              activeColor={activeColor}
              setActiveColor={setActiveColor}
              strokeSize={strokeSize}
              setStrokeSize={setStrokeSize}
              activeOpacity={activeOpacity}
              setActiveOpacity={setActiveOpacity}
              selectedShapeType={selectedShapeType}
              setSelectedShapeType={setSelectedShapeType}
              colorSwatches={project.colorSwatches}
              onAddColorSwatch={(hex) => setProject(prev => ({
                ...prev,
                colorSwatches: Array.from(new Set([hex, ...prev.colorSwatches]))
              }))}
              onUploadImage={handleUploadImageToCanvas}
              onToggleLayers={() => setShowLayersPanel(!showLayersPanel)}
              layersCount={project.layers?.length || 0}
              onOpenMoodboardPalette={() => setActiveView('moodboard')}
              theme={theme}
              activeBrushPreset={activeBrushPreset}
              onOpenBrushStudio={() => setShowBrushStudio(true)}
              onOpenTimeMachine={() => setShowTimeMachine(true)}
              onOpenCanvasSearch={() => setShowSearchSidebar(prev => !prev)}
              onOpenHeatmap={() => {
                setShowHeatmapInspector(prev => !prev);
                setHeatmapSettings(prev => ({ ...prev, enabled: true }));
              }}
              isHeatmapActive={heatmapSettings.enabled}
              stabilization={stylusSettings.stabilization ?? 40}
              setStabilization={(val) => setStylusSettings(prev => ({
                ...prev,
                stabilization: val,
                smoothing: Math.max(1, Math.min(10, Math.round(val / 10)))
              }))}
              onOpenGestureSettings={() => setShowTouchGestureModal(true)}
              onOpenGesturePalette={() => handleExecuteGestureAction('open_command_palette')}
              gridSettings={project.canvasSettings}
              onUpdateGridSettings={(newSettings) => setProject(prev => ({
                ...prev,
                canvasSettings: newSettings
              }))}
              eraserMode={eraserMode}
              setEraserMode={setEraserMode}
              onClearActiveLayer={handleClearActiveLayer}
              selectedCount={selectedCanvasElements.length}
              onAlign={handleAlignCanvasObjects}
              onSelectAll={handleSelectAllCanvasObjects}
              onOpenGuideManager={() => setShowGuideManager(prev => !prev)}
              isGuideManagerActive={showGuideManager}
              guidesCount={project.guides?.length || 0}
            />

            {/* Quick Tablet Controls */}
            <TabletControls
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
              zoom={zoom}
              onZoomIn={() => setZoom(prev => Math.min(prev * 1.2, 5.0))}
              onZoomOut={() => setZoom(prev => Math.max(prev * 0.8, 0.15))}
              stylusSettings={stylusSettings}
              setStylusSettings={setStylusSettings}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              onOpenGesturePalette={() => handleExecuteGestureAction('open_command_palette')}
              onOpenGestureSettings={() => setShowTouchGestureModal(true)}
            />

            {/* Canvas Objects Search Sidebar */}
            {showSearchSidebar && (
              <CanvasSearchSidebar
                isOpen={showSearchSidebar}
                project={project}
                onClose={() => setShowSearchSidebar(false)}
                onNavigateToObject={handleNavigateToObject}
                onFitAllContent={handleFitAllContent}
              />
            )}

            {/* Activity Heatmap Inspector & Hotspots Navigator Panel */}
            {showHeatmapInspector && (
              <HeatmapInspectorPanel
                project={project}
                settings={heatmapSettings}
                onUpdateSettings={setHeatmapSettings}
                activeLayerId={activeLayerId}
                onNavigateToHotspot={handleNavigateToHotspot}
                onClose={() => setShowHeatmapInspector(false)}
                highlightedHotspotId={highlightedHotspotId}
              />
            )}

            {/* Magnetic Guide Manager Panel */}
            {showGuideManager && (
              <GuideManagerPanel
                guides={project.guides || []}
                onUpdateGuides={(newGuides) => {
                  recordHistory();
                  setProject(prev => ({
                    ...prev,
                    guides: newGuides
                  }));
                }}
                onFocusGuide={(guide) => {
                  if (guide.orientation === 'vertical') {
                    setPan(prev => ({
                      ...prev,
                      x: Math.round(window.innerWidth / 2 - guide.position * zoom)
                    }));
                  } else {
                    setPan(prev => ({
                      ...prev,
                      y: Math.round(window.innerHeight / 2 - guide.position * zoom)
                    }));
                  }
                }}
                onClose={() => setShowGuideManager(false)}
                theme={theme}
              />
            )}

            {/* Layers Management Drawer */}
            {showLayersPanel && (
              <LayersPanel
                layers={project.layers}
                activeLayerId={activeLayerId}
                setActiveLayerId={setActiveLayerId}
                onUpdateLayers={(newLayers) => setProject(prev => ({ ...prev, layers: newLayers }))}
                onClose={() => setShowLayersPanel(false)}
              />
            )}
          </>
        )}

        {activeView === 'moodboard' && (
          <MoodboardGenerator
            project={project}
            setProject={setProject}
            onApplyPaletteToCanvas={(hexes) => {
              setProject(prev => ({
                ...prev,
                colorSwatches: Array.from(new Set([...hexes, ...prev.colorSwatches]))
              }));
              if (hexes.length > 0) setActiveColor(hexes[0]);
            }}
            onPinMoodboardToCanvas={handlePinMoodboardToCanvas}
            onOpenWorkspace={() => setShowWorkspaceModal(true)}
          />
        )}

        {activeView === 'timeline' && (
          <TimelineTracker
            project={project}
            setProject={setProject}
            onExportToNextcloud={handleExportTimelineToNextcloud}
            isExportingSheet={isExportingSheet}
          />
        )}

        {activeView === 'gallery' && (
          <ReferenceGallery
            project={project}
            setProject={setProject}
            onDropToCanvas={handleDropRefToCanvas}
            onSetFloatingPipReference={(refItem) => setPipReference(refItem)}
            onOpenWorkspace={() => setShowWorkspaceModal(true)}
          />
        )}

        {activeView === 'workspace' && (
          <NextcloudWorkspaceModal
            project={project}
            setProject={setProject}
            onClose={() => setActiveView('canvas')}
          />
        )}

        {/* Floating Picture-in-Picture Reference Window over Canvas */}
        {pipReference && (
          <FloatingReferenceWindow
            reference={pipReference}
            onClose={() => setPipReference(null)}
          />
        )}

        {/* Annotation Thread Review Modal */}
        {activeAnnotation && (
          <AnnotationModal
            annotation={activeAnnotation}
            onUpdate={(updated) => {
              setProject(prev => ({
                ...prev,
                annotations: prev.annotations.map(a => a.id === updated.id ? updated : a)
              }));
              setActiveAnnotation(updated);
            }}
            onDelete={(id) => {
              setProject(prev => ({
                ...prev,
                annotations: prev.annotations.filter(a => a.id !== id)
              }));
              setActiveAnnotation(null);
            }}
            onClose={() => setActiveAnnotation(null)}
          />
        )}

        {/* Keyboard Shortcuts Modal */}
        {showShortcutsModal && (
          <ShortcutsModal 
            onClose={() => setShowShortcutsModal(false)} 
            onOpenGestureSettings={() => setShowTouchGestureModal(true)}
          />
        )}

        {/* Touch Gestures & Command HUD Configuration Modal */}
        {showTouchGestureModal && (
          <TouchGestureModal
            onSettingsChange={(newSettings) => {
              setTouchSettings(newSettings);
              saveTouchSettings(newSettings);
            }}
            onClose={() => setShowTouchGestureModal(false)}
          />
        )}

        {/* Nextcloud Workspace Modal */}
        {showWorkspaceModal && (
          <NextcloudWorkspaceModal
            project={project}
            setProject={setProject}
            onClose={() => setShowWorkspaceModal(false)}
          />
        )}

        {/* Project Switcher Modal */}
        {showProjectModal && (
          <NewProjectModal
            currentProject={project}
            projectList={projectList}
            onSelectProject={handleSelectProject}
            onCreateNewProject={handleCreateNewProject}
            onClose={() => setShowProjectModal(false)}
            onImportJson={(imported) => {
              setProject(imported);
              saveLocalProject(imported);
              setProjectList(listAllLocalProjects());
              setShowProjectModal(false);
            }}
          />
        )}

        {/* Time Machine 3D Version History Modal */}
        {showTimeMachine && (
          <TimeMachineModal
            currentProject={project}
            onClose={() => setShowTimeMachine(false)}
            onRestoreVersion={(restored) => {
              recordHistory();
              setProject(restored.snapshot);
              saveLocalProject(restored.snapshot);
              setShowTimeMachine(false);
            }}
            onForkVersion={(version) => {
              const forkedProject: ProjectData = {
                ...version.snapshot,
                id: `proj-${Date.now()}`,
                title: `${version.snapshot.title} (Fork from v${version.versionNumber})`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              setProject(forkedProject);
              saveLocalProject(forkedProject);
              setProjectList(listAllLocalProjects());
              setShowTimeMachine(false);
            }}
          />
        )}

        {/* Side-by-Side & Split Curtain Version Compare View */}
        {comparingVersions && (
          <VersionCompareView
            versionA={comparingVersions.versionA}
            versionB={comparingVersions.versionB}
            onClose={() => setComparingVersions(null)}
            onRestoreVersion={() => {
              recordHistory();
              setProject(comparingVersions.versionA.snapshot);
              saveLocalProject(comparingVersions.versionA.snapshot);
              setComparingVersions(null);
              setShowTimeMachine(false);
            }}
          />
        )}

        {/* High-Resolution Canvas Export Modal */}
        {showExportModal && (
          <ExportCanvasModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            project={project}
            viewportWidth={window.innerWidth}
            viewportHeight={window.innerHeight}
            pan={pan}
            zoom={zoom}
            theme={theme}
            heatmapSettings={heatmapSettings}
            nextcloudConfigured={isNextcloudConfigured()}
            onBackupToDrive={handleTriggerNextcloudBackup}
          />
        )}

        {/* Advanced Brush Studio Modal */}
        {showBrushStudio && (
          <BrushStudioModal
            activeBrush={activeBrushPreset}
            onSelectBrush={(brush) => {
              setActiveBrushPreset(brush);
              if (activeTool !== 'brush') {
                setActiveTool('brush');
              }
            }}
            onClose={() => setShowBrushStudio(false)}
          />
        )}
      </main>
    </div>
  );
}
