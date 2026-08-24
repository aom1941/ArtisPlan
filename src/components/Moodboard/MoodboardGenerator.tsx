import React, { useState } from 'react';
import { 
  Sparkles, 
  Palette, 
  Layers, 
  Copy, 
  Check, 
  Download, 
  Compass, 
  Lightbulb, 
  Brush, 
  Plus, 
  Image as ImageIcon,
  Share2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import type { MoodboardData, ProjectData } from '../../types';

interface MoodboardGeneratorProps {
  project: ProjectData;
  setProject: React.Dispatch<React.SetStateAction<ProjectData>>;
  onApplyPaletteToCanvas: (paletteHexes: string[]) => void;
  onPinMoodboardToCanvas: (moodboard: MoodboardData) => void;
  onOpenWorkspace: () => void;
}

export const MoodboardGenerator: React.FC<MoodboardGeneratorProps> = ({
  project,
  setProject,
  onApplyPaletteToCanvas,
  onPinMoodboardToCanvas,
  onOpenWorkspace
}) => {
  const [prompt, setPrompt] = useState(project.moodboard.title || 'Cyberpunk Alchemist Laboratory in Neo-Tokyo');
  const [aesthetic, setAesthetic] = useState(project.moodboard.aesthetic || 'Concept Art / Painterly');
  const [mood, setMood] = useState(project.moodboard.mood || 'Mystical & Atmospheric');
  const [targetMedium, setTargetMedium] = useState('Digital Painting');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [paletteApplied, setPaletteApplied] = useState(false);

  const moodboard = project.moodboard;

  const handleGenerateMoodboard = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/moodboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          aesthetic,
          targetMedium,
          mood
        })
      });
      const data = await res.json();
      if (data && data.palette) {
        const updatedMoodboard: MoodboardData = {
          id: `mb-${Date.now()}`,
          title: data.title || prompt,
          summary: data.summary || '',
          aesthetic,
          mood,
          palette: data.palette || [],
          keywords: data.keywords || [],
          compositionTips: data.compositionTips || [],
          lightingStyle: data.lightingStyle || '',
          textureFocus: data.textureFocus || '',
          suggestedReferences: data.suggestedReferences || [],
          images: moodboard.images || [],
          createdAt: new Date().toISOString()
        };

        setProject(prev => ({
          ...prev,
          moodboard: updatedMoodboard
        }));
      }
    } catch (err) {
      console.error("Failed to generate moodboard:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  const handleApplyPalette = () => {
    const hexes = moodboard.palette.map(p => p.hex);
    onApplyPaletteToCanvas(hexes);
    setPaletteApplied(true);
    setTimeout(() => setPaletteApplied(false), 2000);
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 bg-[#0A0A0D] text-zinc-100 font-sans">
      <div className="max-w-6xl mx-auto space-y-8 pb-16">
        {/* Top Hero & Prompt Section */}
        <div className="bg-[#121216]/95 border border-zinc-800/90 rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/50 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute -right-24 -top-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-24 -bottom-24 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-800/80 text-purple-300 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gemini Visual Mood Board & Palette Engine</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-['Outfit']">
                Creative Art Director & Mood Board
              </h1>
              <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Synthesize color harmony, lighting schemes, texture direction, and compositional guides for your artwork.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleApplyPalette}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1A22] hover:bg-[#242430] text-xs font-semibold text-zinc-200 border border-zinc-700/80 transition-colors shadow-sm"
              >
                {paletteApplied ? <Check className="w-4 h-4 text-emerald-400" /> : <Palette className="w-4 h-4 text-cyan-400" />}
                <span>{paletteApplied ? 'Palette Locked to Canvas!' : 'Sync to Canvas Swatches'}</span>
              </button>

              <button
                onClick={() => onPinMoodboardToCanvas(moodboard)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-colors shadow-md shadow-purple-950/40"
              >
                <Plus className="w-4 h-4" />
                <span>Pin to Canvas</span>
              </button>
            </div>
          </div>

          {/* Generator Form Controls */}
          <form onSubmit={handleGenerateMoodboard} className="space-y-4 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Project Concept Prompt</label>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Floating Island Sanctuary at Twilight with Bioluminescent Flora"
                  className="w-full bg-[#16161B] border border-zinc-800/90 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Aesthetic Style</label>
                <select
                  value={aesthetic}
                  onChange={(e) => setAesthetic(e.target.value)}
                  className="w-full bg-[#16161B] border border-zinc-800/90 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-purple-500"
                >
                  <option value="Concept Art / Painterly">Concept Art / Painterly</option>
                  <option value="Anime Stylized & Cel-Shading">Anime & Cel-Shading</option>
                  <option value="Cyberpunk & Neon Noir">Cyberpunk & Neon Noir</option>
                  <option value="Impasto Oil & Expressive Brush">Impasto Oil & Expressive</option>
                  <option value="Dark Fantasy & Chiaroscuro">Dark Fantasy & Chiaroscuro</option>
                  <option value="Gouache & Textured Storybook">Gouache & Storybook</option>
                  <option value="Cinematic Matte Painting">Cinematic Matte Painting</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Emotional Mood</label>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full bg-[#16161B] border border-zinc-800/90 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-purple-500"
                >
                  <option value="Dramatic & Atmospheric">Dramatic & Atmospheric</option>
                  <option value="Dreamy & Ethereal">Dreamy & Ethereal</option>
                  <option value="High-Energy & Electric">High-Energy & Electric</option>
                  <option value="Moody, Melancholic & Eerie">Moody & Melancholic</option>
                  <option value="Warm, Nostalgic & Cozy">Warm & Nostalgic</option>
                  <option value="Mythic & Majestic">Mythic & Majestic</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="font-medium text-zinc-300">Keywords:</span>
                {moodboard.keywords.slice(0, 4).map((kw, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-[#18181F] text-zinc-300 border border-zinc-800 text-[11px]">
                    #{kw}
                  </span>
                ))}
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-rose-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white text-xs font-bold shadow-lg shadow-purple-950/30 transition-all transform active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Synthesizing Mood Board...' : 'Generate New Mood Board'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Color Palette Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-rose-400" />
              <h2 className="text-lg font-bold text-white font-['Outfit']">Harmonic Color Script & Swatches</h2>
            </div>
            <span className="text-xs text-zinc-400">Click any swatch to copy HEX code</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {moodboard.palette.map((color, idx) => (
              <div
                key={idx}
                onClick={() => copyColor(color.hex)}
                className="bg-[#121216]/95 border border-zinc-800/90 rounded-2xl p-3 shadow-lg shadow-black/40 hover:border-zinc-700 cursor-pointer transition-all transform hover:-translate-y-0.5 group"
              >
                <div
                  className="w-full h-24 rounded-xl shadow-inner mb-3 relative overflow-hidden flex items-end p-2"
                  style={{ backgroundColor: color.hex }}
                >
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-white backdrop-blur">
                    {color.role}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-100 truncate">{color.name}</h4>
                    <span className="font-mono text-[11px] text-zinc-400">{color.hex}</span>
                  </div>
                  <div className="text-zinc-500 group-hover:text-white">
                    {copiedHex === color.hex ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Direction & Specifications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Lighting Direction */}
          <div className="bg-[#121216]/90 border border-zinc-800/90 rounded-2xl p-5 space-y-2 shadow-lg shadow-black/30">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
              <Lightbulb className="w-4 h-4" />
              <span>Lighting & Value Key</span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {moodboard.lightingStyle || 'High-contrast key lighting with soft fill.'}
            </p>
          </div>

          {/* Texture & Brushwork */}
          <div className="bg-[#121216]/90 border border-zinc-800/90 rounded-2xl p-5 space-y-2 shadow-lg shadow-black/30">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
              <Brush className="w-4 h-4" />
              <span>Brushwork & Texture Focus</span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {moodboard.textureFocus || 'Dry gouache brush strokes with crisp specular highlights.'}
            </p>
          </div>

          {/* Composition Rules */}
          <div className="bg-[#121216]/90 border border-zinc-800/90 rounded-2xl p-5 space-y-2 shadow-lg shadow-black/30">
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs uppercase tracking-wider">
              <Compass className="w-4 h-4" />
              <span>Composition Advice</span>
            </div>
            <ul className="space-y-1 text-xs text-zinc-300 list-disc list-inside">
              {moodboard.compositionTips.map((tip, i) => (
                <li key={i} className="leading-relaxed">{tip}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Visual Reference Pinboard */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white font-['Outfit']">Reference Inspiration Pinboard</h2>
            </div>
            <button
              onClick={onOpenWorkspace}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
            >
              <span>Import from Google Drive</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {moodboard.images.map((img) => (
              <div key={img.id} className="group relative rounded-2xl overflow-hidden border border-zinc-800/90 bg-[#121216] shadow-xl shadow-black/40">
                <img 
                  src={img.url} 
                  alt={img.caption} 
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-4 flex flex-col justify-end">
                  <p className="text-xs font-semibold text-white truncate">{img.caption}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {img.tags.map((t, idx) => (
                      <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-zinc-200 backdrop-blur">
                        {t}
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
