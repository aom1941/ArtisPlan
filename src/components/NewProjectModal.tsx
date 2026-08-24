import React, { useState } from 'react';
import { 
  FolderOpen, 
  Plus, 
  Trash2, 
  X, 
  Check, 
  Palette, 
  Clock, 
  Sparkles,
  ArrowRight,
  Download,
  Upload
} from 'lucide-react';
import type { ProjectData } from '../types';
import { createDefaultProject } from '../lib/storage';

interface NewProjectModalProps {
  currentProject: ProjectData;
  projectList: Array<{ id: string; title: string; updatedAt: string }>;
  onSelectProject: (id: string) => void;
  onCreateNewProject: (title: string, description: string) => void;
  onClose: () => void;
  onImportJson: (project: ProjectData) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  currentProject,
  projectList,
  onSelectProject,
  onCreateNewProject,
  onClose,
  onImportJson
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [activeTab, setActiveTab] = useState<'switch' | 'create'>('switch');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateNewProject(newTitle.trim(), newDescription.trim());
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentProject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${currentProject.title.replace(/[^a-zA-Z0-9]/g, '_')}_artisplan.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && parsed.id && parsed.strokes) {
            onImportJson(parsed);
          }
        } catch (err) {
          alert('Invalid ArtisPlan JSON project file.');
        }
      };
      reader.readAsText(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121216]/98 border border-zinc-800/90 rounded-3xl w-full max-w-xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-[#0A0A0D]/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#18181F] text-rose-400 border border-zinc-800 shadow-inner">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white font-['Outfit']">Project Manager</h2>
              <p className="text-xs text-zinc-400">Switch existing artwork or start a new studio project</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-[#1C1C24] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Header */}
        <div className="flex border-b border-zinc-800/80 bg-[#0A0A0D]/60">
          <button
            onClick={() => setActiveTab('switch')}
            className={`flex-1 py-3 text-xs font-semibold text-center transition-colors border-b-2 ${
              activeTab === 'switch' ? 'border-rose-500 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Your Saved Projects ({projectList.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 text-xs font-semibold text-center transition-colors border-b-2 ${
              activeTab === 'create' ? 'border-rose-500 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Create New Project
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-[#0A0A0D] custom-scrollbar">
          {activeTab === 'switch' ? (
            <div className="space-y-3">
              <div className="space-y-2">
                {projectList.map((p) => {
                  const isCurrent = p.id === currentProject.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => onSelectProject(p.id)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-[#18181F] border-rose-500/80 text-white shadow-lg shadow-black/40'
                          : 'bg-[#121216]/90 border-zinc-800/90 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isCurrent ? 'bg-rose-500/20 text-rose-400' : 'bg-[#1C1C24] text-zinc-400 border border-zinc-800'}`}>
                          <Palette className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs text-white">{p.title}</h4>
                          <span className="text-[10px] text-zinc-500">
                            Updated {new Date(p.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-semibold">
                          Active
                        </span>
                      ) : (
                        <ArrowRight className="w-4 h-4 text-zinc-500" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Import / Export JSON tools */}
              <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                <button
                  onClick={handleExportJson}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Active Project (.JSON)</span>
                </button>

                <label className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-cyan-400 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Project File</span>
                  <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                </label>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Project Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Floating Castle Environment Study"
                  required
                  autoFocus
                  className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-rose-500 transition-colors shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Brief Creative Vision</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe lighting mood, style goals, and deliverables..."
                  rows={3}
                  className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-rose-500 resize-none transition-colors shadow-inner"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-rose-950/40 transition-all"
              >
                Create Project & Launch Canvas
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
