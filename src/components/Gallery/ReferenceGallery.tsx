import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Plus, 
  Search, 
  Filter, 
  ExternalLink, 
  Pin, 
  Copy, 
  Trash2, 
  Upload, 
  Sparkles,
  LayoutGrid,
  Check,
  FolderOpen
} from 'lucide-react';
import type { ProjectData, ReferenceImageItem } from '../../types';

interface ReferenceGalleryProps {
  project: ProjectData;
  setProject: React.Dispatch<React.SetStateAction<ProjectData>>;
  onDropToCanvas: (refItem: ReferenceImageItem) => void;
  onSetFloatingPipReference: (refItem: ReferenceImageItem) => void;
  onOpenWorkspace: () => void;
}

const CATEGORIES = [
  'All',
  'Lighting & Mood',
  'Characters',
  'Environments',
  'Props & Objects',
  'Color Studies',
  'Anatomy & Poses'
] as const;

export const ReferenceGallery: React.FC<ReferenceGalleryProps> = ({
  project,
  setProject,
  onDropToCanvas,
  onSetFloatingPipReference,
  onOpenWorkspace
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const gallery = project.referenceGallery || [];

  const filteredItems = gallery.filter(item => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesQuery = !searchQuery.trim() || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newItem: ReferenceImageItem = {
            id: `ref-${Date.now()}`,
            title: file.name.replace(/\.[^/.]+$/, ""),
            category: selectedCategory === 'All' ? 'Lighting & Mood' : (selectedCategory as any),
            url: event.target.result as string,
            tags: ['custom-upload', 'artist-ref'],
            notes: 'Imported by artist',
            createdAt: new Date().toISOString()
          };

          setProject(prev => ({
            ...prev,
            referenceGallery: [newItem, ...prev.referenceGallery]
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteItem = (id: string) => {
    setProject(prev => ({
      ...prev,
      referenceGallery: prev.referenceGallery.filter(item => item.id !== id)
    }));
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 bg-[#0A0A0D] text-zinc-100 font-sans">
      <div className="max-w-6xl mx-auto space-y-8 pb-16">
        {/* Header Hero */}
        <div className="bg-[#121216]/95 border border-zinc-800/90 rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/50 backdrop-blur-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800/80 text-amber-300 text-xs font-semibold mb-2">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Curated Reference Library & Mood Assets</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-['Outfit']">
                Organized Reference Galleries
              </h1>
              <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
                Store anatomy sheets, lighting studies, and texture swatches. Pin references as floating picture-in-picture widgets over your canvas while sketching!
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-950/40"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Reference</span>
              </button>

              <button
                onClick={onOpenWorkspace}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A1A22] hover:bg-[#242430] text-zinc-200 text-xs font-semibold border border-zinc-700/80 transition-colors shadow-sm"
              >
                <FolderOpen className="w-4 h-4 text-cyan-400" />
                <span>Import from GDrive</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-4 border-t border-zinc-800/80">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reference by title or tag (e.g. neon, lighting, costume)..."
                className="w-full bg-[#16161B] border border-zinc-800/90 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-amber-600 text-white shadow-sm shadow-amber-950/40'
                      : 'bg-[#16161B] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gallery Masonry / Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white font-['Outfit']">
              {selectedCategory} References ({filteredItems.length})
            </h2>
            <span className="text-xs text-zinc-400">
              Hover over image to Pin as Floating Window or Drop onto Canvas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group relative bg-[#121216]/95 border border-zinc-800/90 rounded-2xl overflow-hidden shadow-xl shadow-black/40 hover:border-zinc-700 transition-all transform hover:-translate-y-0.5 flex flex-col"
              >
                {/* Image Preview */}
                <div className="relative h-48 w-full overflow-hidden bg-[#0A0A0D]">
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none"
                    referrerPolicy="no-referrer"
                  />

                  {/* Floating Action Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                    <button
                      onClick={() => onSetFloatingPipReference(item)}
                      className="w-full py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Pin className="w-3.5 h-3.5" />
                      <span>Floating PiP Overlay</span>
                    </button>

                    <button
                      onClick={() => onDropToCanvas(item)}
                      className="w-full py-1.5 px-3 rounded-lg bg-[#1A1A22] hover:bg-[#242430] text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-zinc-700"
                    >
                      <Plus className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Place on Canvas</span>
                    </button>
                  </div>
                </div>

                {/* Info Footer */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                        {item.category}
                      </span>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 transition-opacity"
                        title="Delete Ref"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h4 className="text-xs font-semibold text-zinc-100 truncate">{item.title}</h4>
                    {item.notes && (
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-tight">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    {item.tags.slice(0, 3).map((t, idx) => (
                      <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-[#18181F] text-zinc-400 border border-zinc-800">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
