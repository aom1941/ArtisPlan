import React, { useState } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Sparkles, 
  FileSpreadsheet, 
  Trash2, 
  Edit3, 
  CheckSquare, 
  Square,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Layers
} from 'lucide-react';
import type { ProjectData, ProjectMilestone } from '../../types';

interface TimelineTrackerProps {
  project: ProjectData;
  setProject: React.Dispatch<React.SetStateAction<ProjectData>>;
  onExportToGoogleSheets: () => void;
  isExportingSheet: boolean;
}

export const TimelineTracker: React.FC<TimelineTrackerProps> = ({
  project,
  setProject,
  onExportToGoogleSheets,
  isExportingSheet
}) => {
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [deadlineWeeks, setDeadlineWeeks] = useState(4);
  const [scopeDescription, setScopeDescription] = useState('Full keyframe concept art with moodboard, thumbnails, clean lines, and final render.');

  const timeline = project.timeline;

  // Calculate overall progress
  const allTasks = timeline.milestones.flatMap(m => m.tasks || []);
  const allCompletedTasks = timeline.milestones.flatMap(m => m.completedTasks || []);
  const progressPercent = allTasks.length > 0 ? Math.round((allCompletedTasks.length / allTasks.length) * 100) : 0;

  const toggleTaskCompleted = (milestoneId: string, taskTitle: string) => {
    setProject(prev => ({
      ...prev,
      timeline: {
        ...prev.timeline,
        milestones: prev.timeline.milestones.map(m => {
          if (m.id !== milestoneId) return m;
          const completed = m.completedTasks || [];
          const isDone = completed.includes(taskTitle);
          const newCompleted = isDone 
            ? completed.filter(t => t !== taskTitle)
            : [...completed, taskTitle];
          
          // Auto update status if all done
          let newStatus = m.status;
          if (newCompleted.length === m.tasks.length && m.tasks.length > 0) {
            newStatus = 'completed';
          } else if (newCompleted.length > 0) {
            newStatus = 'in-progress';
          }

          return {
            ...m,
            completedTasks: newCompleted,
            status: newStatus
          };
        })
      }
    }));
  };

  const handleGenerateAiTimeline = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/ai/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: project.title,
          projectType: project.timeline.projectType || 'Concept Art & Illustration',
          deadlineWeeks,
          scopeDescription
        })
      });
      const data = await res.json();
      if (data && data.milestones) {
        setProject(prev => ({
          ...prev,
          timeline: {
            ...prev.timeline,
            totalEstimatedHours: data.totalEstimatedHours || 40,
            milestones: data.milestones,
            updatedAt: new Date().toISOString()
          }
        }));
      }
    } catch (err) {
      console.error("Failed to generate AI timeline:", err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAddMilestone = () => {
    const newMs: ProjectMilestone = {
      id: `ms-${Date.now()}`,
      phase: `Phase ${timeline.milestones.length + 1}`,
      title: 'New Milestone',
      description: 'Describe stage objectives...',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'pending',
      color: '#3B82F6',
      tasks: ['New deliverable task'],
      completedTasks: []
    };

    setProject(prev => ({
      ...prev,
      timeline: {
        ...prev.timeline,
        milestones: [...prev.timeline.milestones, newMs]
      }
    }));
  };

  const handleDeleteMilestone = (id: string) => {
    setProject(prev => ({
      ...prev,
      timeline: {
        ...prev.timeline,
        milestones: prev.timeline.milestones.filter(m => m.id !== id)
      }
    }));
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 bg-[#0A0A0D] text-zinc-100 font-sans">
      <div className="max-w-6xl mx-auto space-y-8 pb-16">
        {/* Header Hero Banner */}
        <div className="bg-[#121216]/95 border border-zinc-800/90 rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/50 backdrop-blur-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800/80 text-blue-300 text-xs font-semibold mb-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Production Gantt & Milestone Roadmap</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-['Outfit']">
                Project Timeline & Deliverables Tracker
              </h1>
              <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
                Break creative projects into structured stages: Research, Thumbnails, Color Script, Detailing, and Master Delivery.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onExportToGoogleSheets}
                disabled={isExportingSheet}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{isExportingSheet ? 'Syncing to Sheets...' : 'Export to Google Sheets'}</span>
              </button>

              <button
                onClick={handleAddMilestone}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A1A22] hover:bg-[#242430] text-zinc-200 text-xs font-semibold border border-zinc-700/80 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Milestone</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-800/80">
            <div className="bg-[#0A0A0D]/80 border border-zinc-800/80 rounded-2xl p-4">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span>Overall Completion</span>
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-white font-mono">{progressPercent}%</span>
                <span className="text-xs text-zinc-400">({allCompletedTasks.length}/{allTasks.length} tasks)</span>
              </div>
              <div className="w-full bg-[#1A1A22] h-2 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="bg-[#0A0A0D]/80 border border-zinc-800/80 rounded-2xl p-4">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span>Total Workload</span>
                <Clock className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-white font-mono">{timeline.totalEstimatedHours}</span>
                <span className="text-xs text-zinc-400">Estimated Studio Hours</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-2">Average ~{Math.round(timeline.totalEstimatedHours / Math.max(1, timeline.milestones.length))}h per phase</p>
            </div>

            <div className="bg-[#0A0A0D]/80 border border-zinc-800/80 rounded-2xl p-4">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span>Active Milestones</span>
                <Layers className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-white font-mono">{timeline.milestones.length}</span>
                <span className="text-xs text-zinc-400">Phases in Roadmap</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-2">
                {timeline.milestones.filter(m => m.status === 'completed').length} completed, {timeline.milestones.filter(m => m.status === 'in-progress').length} in progress
              </p>
            </div>
          </div>
        </div>

        {/* AI Planner Assistant Section */}
        <div className="bg-[#121216]/95 border border-purple-900/50 rounded-2xl p-5 backdrop-blur-xl shadow-xl shadow-black/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Gemini AI Art Production Schedule Generator</span>
            </div>
            <p className="text-xs text-zinc-400 max-w-xl">
              Automatically calculate milestone dates, deliverable checklists, and realistic hourly budgets customized to your artwork.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={deadlineWeeks}
              onChange={(e) => setDeadlineWeeks(Number(e.target.value))}
              className="bg-[#16161B] border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-200"
            >
              <option value={2}>2 Weeks Sprint</option>
              <option value={4}>4 Weeks Standard</option>
              <option value={8}>8 Weeks Major Project</option>
            </select>

            <button
              onClick={handleGenerateAiTimeline}
              disabled={isGeneratingAi}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-purple-950/30 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAi ? 'Generating Schedule...' : 'Regenerate Plan with AI'}</span>
            </button>
          </div>
        </div>

        {/* Milestones Card List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <span>Project Milestones & Task Progress</span>
          </h2>

          <div className="space-y-4">
            {timeline.milestones.map((milestone, idx) => {
              const completedCount = (milestone.completedTasks || []).length;
              const isAllDone = completedCount === milestone.tasks.length && milestone.tasks.length > 0;

              return (
                <div
                  key={milestone.id}
                  className="bg-[#121216]/95 border border-zinc-800/90 rounded-2xl p-5 shadow-xl shadow-black/40 space-y-4 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-10 rounded-full"
                        style={{ backgroundColor: milestone.color }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            {milestone.phase}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                            milestone.status === 'completed' 
                              ? 'bg-emerald-950 border border-emerald-800 text-emerald-300' 
                              : milestone.status === 'in-progress'
                              ? 'bg-blue-950 border border-blue-800 text-blue-300'
                              : 'bg-[#18181F] text-zinc-400 border border-zinc-800'
                          }`}>
                            {milestone.status}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white mt-0.5">{milestone.title}</h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{milestone.startDate} → {milestone.endDate}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteMilestone(milestone.id)}
                        className="p-1.5 text-zinc-600 hover:text-rose-400 hover:bg-[#1C1C24] rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed pl-6">
                    {milestone.description}
                  </p>

                  {/* Sub-tasks Checklist */}
                  <div className="pl-6 pt-2 border-t border-zinc-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                      <span>Deliverable Tasks Checklist</span>
                      <span>{completedCount}/{milestone.tasks.length} Completed</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {milestone.tasks.map((task, tIdx) => {
                        const isDone = (milestone.completedTasks || []).includes(task);
                        return (
                          <div
                            key={tIdx}
                            onClick={() => toggleTaskCompleted(milestone.id, task)}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors text-xs ${
                              isDone
                                ? 'bg-[#0A0A0D]/70 border-emerald-900/50 text-zinc-500 line-through'
                                : 'bg-[#16161B] border-zinc-800/80 text-zinc-200 hover:border-zinc-700'
                            }`}
                          >
                            {isDone ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-zinc-600 shrink-0" />
                            )}
                            <span className="truncate">{task}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
