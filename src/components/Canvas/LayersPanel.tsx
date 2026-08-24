import React, { useState } from 'react';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  X,
  Edit2,
  Check
} from 'lucide-react';
import type { CanvasLayer } from '../../types';

interface LayersPanelProps {
  layers: CanvasLayer[];
  activeLayerId: string;
  setActiveLayerId: (id: string) => void;
  onUpdateLayers: (layers: CanvasLayer[]) => void;
  onClose: () => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers = [],
  activeLayerId,
  setActiveLayerId,
  onUpdateLayers,
  onClose
}) => {
  const safeLayers = Array.isArray(layers) && layers.length > 0
    ? layers
    : [{ id: 'layer-sketch', name: 'Gesture & Lineart', visible: true, locked: false, opacity: 1 }];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const toggleVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateLayers(safeLayers.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const toggleLock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateLayers(safeLayers.map(l => l.id === id ? { ...l, locked: !l.locked } : l));
  };

  const handleAddLayer = () => {
    const newLayer: CanvasLayer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${safeLayers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 1
    };
    onUpdateLayers([newLayer, ...safeLayers]);
    setActiveLayerId(newLayer.id);
  };

  const handleDeleteLayer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (safeLayers.length <= 1) return;
    const filtered = safeLayers.filter(l => l.id !== id);
    onUpdateLayers(filtered);
    if (activeLayerId === id) {
      setActiveLayerId(filtered[0].id);
    }
  };

  const moveLayer = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const newLayers = [...safeLayers];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLayers.length) return;
    const temp = newLayers[index];
    newLayers[index] = newLayers[targetIndex];
    newLayers[targetIndex] = temp;
    onUpdateLayers(newLayers);
  };

  const startRename = (layer: CanvasLayer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(layer.id);
    setEditName(layer.name);
  };

  const saveRename = (id: string) => {
    if (editName.trim()) {
      onUpdateLayers(safeLayers.map(l => l.id === id ? { ...l, name: editName.trim() } : l));
    }
    setEditingId(null);
  };

  return (
    <div className="absolute top-16 right-4 w-72 bg-[#121216]/98 backdrop-blur-xl border border-zinc-800/90 rounded-2xl shadow-2xl shadow-black/70 p-3 z-40 animate-in fade-in slide-in-from-right-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-xs text-zinc-200">Art Layers</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#18181F] text-zinc-400 font-mono border border-zinc-800">
            {safeLayers.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleAddLayer}
            className="p-1 rounded-lg bg-[#18181F] border border-zinc-800 hover:bg-[#22222B] text-zinc-300 transition-colors"
            title="New Layer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-[#1C1C24] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Layer List */}
      <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
        {safeLayers.map((layer, index) => {
          const isActive = layer.id === activeLayerId;
          const isEditing = editingId === layer.id;

          return (
            <div
              key={layer.id}
              onClick={() => setActiveLayerId(layer.id)}
              className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all ${
                isActive 
                  ? 'bg-[#1C1C24] text-white border border-zinc-700 shadow-sm' 
                  : 'text-zinc-400 hover:bg-[#18181F]/70 hover:text-zinc-200 border border-transparent'
              }`}
            >
              {/* Left: Visibility & Name */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                  onClick={(e) => toggleVisibility(layer.id, e)}
                  className={`p-1 rounded transition-colors ${layer.visible ? 'text-zinc-300' : 'text-zinc-600'}`}
                  title={layer.visible ? "Hide Layer" : "Show Layer"}
                >
                  {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>

                {isEditing ? (
                  <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveRename(layer.id)}
                      autoFocus
                      className="w-full bg-[#0A0A0D] px-1.5 py-0.5 rounded border border-zinc-700 text-xs text-white outline-none"
                    />
                    <button onClick={() => saveRename(layer.id)} className="text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span 
                    onDoubleClick={(e) => startRename(layer, e)}
                    className={`truncate font-medium ${layer.visible ? '' : 'line-through opacity-50'}`}
                  >
                    {layer.name}
                  </span>
                )}
              </div>

              {/* Right: Controls (Lock, Move, Delete) */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={(e) => toggleLock(layer.id, e)}
                  className={`p-1 rounded transition-colors ${layer.locked ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                  title={layer.locked ? "Unlock Layer" : "Lock Layer"}
                >
                  {layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                </button>

                <button
                  onClick={(e) => moveLayer(index, 'up', e)}
                  disabled={index === 0}
                  className="p-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-20"
                  title="Move Up"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>

                <button
                  onClick={(e) => moveLayer(index, 'down', e)}
                  disabled={index === safeLayers.length - 1}
                  className="p-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-20"
                  title="Move Down"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>

                {safeLayers.length > 1 && (
                  <button
                    onClick={(e) => handleDeleteLayer(layer.id, e)}
                    className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                    title="Delete Layer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
