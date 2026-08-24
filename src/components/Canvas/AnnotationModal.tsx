import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Trash2, 
  X, 
  Clock, 
  User,
  AlertCircle
} from 'lucide-react';
import type { CanvasAnnotation } from '../../types';

interface AnnotationModalProps {
  annotation: CanvasAnnotation;
  onUpdate: (updated: CanvasAnnotation) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const AnnotationModal: React.FC<AnnotationModalProps> = ({
  annotation,
  onUpdate,
  onDelete,
  onClose
}) => {
  const [commentText, setCommentText] = useState('');
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [aiCritiqueResult, setAiCritiqueResult] = useState<{
    feedback?: string;
    compositionSuggestions?: string[];
    brushTechniqueTip?: string;
  } | null>(null);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = {
      id: `c-${Date.now()}`,
      author: 'Collaborator',
      text: commentText.trim(),
      createdAt: 'Just now'
    };

    onUpdate({
      ...annotation,
      comments: [...annotation.comments, newComment]
    });
    setCommentText('');
  };

  const toggleStatus = () => {
    const nextStatus = annotation.status === 'resolved' ? 'open' : 'resolved';
    onUpdate({
      ...annotation,
      status: nextStatus
    });
  };

  const handleAskAiArtDirector = async () => {
    setIsAskingAi(true);
    try {
      const res = await fetch('/api/ai/critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteText: annotation.title,
          question: annotation.comments.map(c => c.text).join(' '),
          canvasSummary: 'Creative sketch with moodboard color palette and timeline in progress'
        })
      });
      const data = await res.json();
      setAiCritiqueResult(data);
    } catch (err) {
      console.error("AI Critique failed:", err);
    } finally {
      setIsAskingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121216]/98 border border-zinc-800/90 rounded-2xl w-full max-w-lg shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-[#0A0A0D]/90">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${annotation.status === 'resolved' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'}`}>
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-100">{annotation.title}</h3>
              <p className="text-[11px] text-zinc-400">Created by {annotation.author}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleStatus}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                annotation.status === 'resolved'
                  ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300'
                  : 'bg-[#18181F] border-zinc-800 text-zinc-300 hover:text-white hover:bg-[#22222B]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{annotation.status === 'resolved' ? 'Resolved' : 'Mark Done'}</span>
            </button>

            <button
              onClick={() => onDelete(annotation.id)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-[#1C1C24] transition-colors"
              title="Delete Pin"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-[#1C1C24] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* AI Critique Advisor Box */}
        <div className="px-4 py-3 bg-purple-950/20 border-b border-purple-900/30 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-purple-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>AI Art Director Feedback</span>
            </div>
            <button
              onClick={handleAskAiArtDirector}
              disabled={isAskingAi}
              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-[11px] font-medium transition-colors shadow-sm flex items-center gap-1"
            >
              {isAskingAi ? 'Analyzing...' : 'Generate AI Advice'}
            </button>
          </div>

          {aiCritiqueResult && (
            <div className="bg-[#0A0A0D]/90 border border-purple-800/40 rounded-xl p-3 text-xs text-zinc-300 space-y-2 animate-in fade-in shadow-inner">
              <p className="leading-relaxed text-purple-200">{aiCritiqueResult.feedback}</p>
              {aiCritiqueResult.compositionSuggestions && aiCritiqueResult.compositionSuggestions.length > 0 && (
                <ul className="list-disc list-inside text-zinc-400 space-y-0.5 text-[11px]">
                  {aiCritiqueResult.compositionSuggestions.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              )}
              {aiCritiqueResult.brushTechniqueTip && (
                <div className="text-[11px] text-amber-300/90 font-medium bg-amber-950/40 px-2 py-1 rounded-md border border-amber-900/50">
                  Tip: {aiCritiqueResult.brushTechniqueTip}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Threaded Comments List */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3 min-h-[160px] bg-[#0A0A0D] custom-scrollbar">
          {annotation.comments.map((comment) => (
            <div key={comment.id} className="flex gap-2.5 items-start bg-[#121216]/90 p-3 rounded-xl border border-zinc-800/90 shadow-sm">
              <div className="w-7 h-7 rounded-full bg-[#1C1C24] border border-zinc-700 flex items-center justify-center text-zinc-300 text-xs font-bold shrink-0">
                {comment.author.slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-semibold text-zinc-200">{comment.author}</span>
                  <span className="text-[10px] text-zinc-500">{comment.createdAt}</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed break-words">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Add Comment Input */}
        <form onSubmit={handleAddComment} className="p-3 border-t border-zinc-800/80 bg-[#0A0A0D]/95 flex items-center gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Reply to this annotation..."
            className="flex-1 bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white transition-colors shadow-md shadow-cyan-950/40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
