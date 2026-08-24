import React, { useState } from 'react';
import {
  HardDrive,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  Upload,
  X,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import type { ProjectData } from '../../types';
import {
  isNextcloudConfigured,
  backupProjectToNextcloud,
  exportProjectBriefToNextcloud,
  exportTimelineToNextcloud,
  NextcloudExportResult,
} from '../../lib/workspace';
import { NEXTCLOUD_URL } from '../../lib/nextcloudSync';

interface NextcloudWorkspaceModalProps {
  project: ProjectData;
  setProject: React.Dispatch<React.SetStateAction<ProjectData>>;
  onClose: () => void;
}

export const NextcloudWorkspaceModal: React.FC<NextcloudWorkspaceModalProps> = ({
  project,
  setProject,
  onClose,
}) => {
  const configured = isNextcloudConfigured();

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isExportingBrief, setIsExportingBrief] = useState(false);
  const [isExportingTimeline, setIsExportingTimeline] = useState(false);

  const [lastBackupResult, setLastBackupResult] = useState<NextcloudExportResult | null>(null);
  const [lastBriefResult, setLastBriefResult] = useState<NextcloudExportResult | null>(null);
  const [lastTimelineResult, setLastTimelineResult] = useState<NextcloudExportResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusIsError, setStatusIsError] = useState(false);

  const handleBackup = async () => {
    setIsBackingUp(true);
    setStatusMessage(null);
    try {
      const res = await backupProjectToNextcloud(project);
      setLastBackupResult(res.jsonResult);
      setProject(prev => ({ ...prev, lastCloudSync: new Date().toISOString() }));
      setStatusMessage('Project backed up to Nextcloud (/ArtisPlan/exports)!');
      setStatusIsError(false);
    } catch (err: any) {
      setStatusMessage(`Nextcloud Backup Error: ${err.message}`);
      setStatusIsError(true);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleExportBrief = async () => {
    setIsExportingBrief(true);
    setStatusMessage(null);
    try {
      const res = await exportProjectBriefToNextcloud(project);
      setLastBriefResult(res);
      setStatusMessage('Project brief exported as Markdown!');
      setStatusIsError(false);
    } catch (err: any) {
      setStatusMessage(`Brief Export Error: ${err.message}`);
      setStatusIsError(true);
    } finally {
      setIsExportingBrief(false);
    }
  };

  const handleExportTimeline = async () => {
    setIsExportingTimeline(true);
    setStatusMessage(null);
    try {
      const res = await exportTimelineToNextcloud(project);
      setLastTimelineResult(res);
      setStatusMessage('Milestone timeline exported as CSV!');
      setStatusIsError(false);
    } catch (err: any) {
      setStatusMessage(`Timeline Export Error: ${err.message}`);
      setStatusIsError(true);
    } finally {
      setIsExportingTimeline(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121216]/98 border border-zinc-800/90 rounded-3xl w-full max-w-3xl shadow-2xl shadow-black/70 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-[#0A0A0D]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-emerald-500 to-amber-500 flex items-center justify-center shadow-lg shadow-black/40">
              <HardDrive className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white font-['Outfit']">Nextcloud Integration</h2>
              <p className="text-xs text-zinc-400">Self-hosted backup, brief & timeline export</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-[#1C1C24] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#0A0A0D]">
          {/* Status Message Notification */}
          {statusMessage && (
            <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between animate-in fade-in ${
              statusIsError
                ? 'bg-rose-950/50 border-rose-800/70 text-rose-200'
                : 'bg-cyan-950/50 border-cyan-800/70 text-cyan-200'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${statusIsError ? 'text-rose-400' : 'text-cyan-400'}`} />
                <span>{statusMessage}</span>
              </div>
              <button onClick={() => setStatusMessage(null)} className="hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Configuration Status Card — no login flow, config comes from VITE_NEXTCLOUD_* env vars */}
          <div className="bg-[#121216]/95 border border-zinc-800/90 rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-black/30">
            <div className="w-10 h-10 rounded-full bg-[#18181F] border border-zinc-800 flex items-center justify-center shrink-0">
              {configured ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                {configured ? 'Nextcloud Configured' : 'Nextcloud Not Configured'}
              </h4>
              <p className="text-xs text-zinc-400">
                {configured
                  ? `Connected to ${NEXTCLOUD_URL}`
                  : 'Set VITE_NEXTCLOUD_URL, VITE_NEXTCLOUD_USER and VITE_NEXTCLOUD_APP_PASSWORD in .env.local to enable backup and export.'}
              </p>
            </div>
          </div>

          {/* Integration Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nextcloud Backup Card */}
            <div className="bg-[#121216]/95 border border-zinc-800/90 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-colors shadow-xl shadow-black/30">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                    Full Snapshot
                  </span>
                </div>
                <h3 className="font-bold text-sm text-white">Nextcloud Backup</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Backup the full project JSON state to /ArtisPlan/exports on your Nextcloud instance.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleBackup}
                  disabled={isBackingUp || !configured}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-md shadow-blue-950/40"
                >
                  <Upload className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-bounce' : ''}`} />
                  <span>{isBackingUp ? 'Backing Up...' : 'Backup Now'}</span>
                </button>

                {lastBackupResult?.url && (
                  <a
                    href={lastBackupResult.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 text-[11px] text-blue-400 hover:underline pt-1"
                  >
                    <span>Open in Nextcloud</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Project Brief Card */}
            <div className="bg-[#121216]/95 border border-zinc-800/90 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-colors shadow-xl shadow-black/30">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                    Project Brief
                  </span>
                </div>
                <h3 className="font-bold text-sm text-white">Markdown Export</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Export a structured art direction brief, palette specification, and composition rules.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleExportBrief}
                  disabled={isExportingBrief || !configured}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-md shadow-indigo-950/40"
                >
                  <FileText className={`w-3.5 h-3.5 ${isExportingBrief ? 'animate-pulse' : ''}`} />
                  <span>{isExportingBrief ? 'Generating...' : 'Export Brief'}</span>
                </button>

                {lastBriefResult?.url && (
                  <a
                    href={lastBriefResult.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 text-[11px] text-indigo-400 hover:underline pt-1"
                  >
                    <span>Open in Nextcloud</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Timeline Export Card */}
            <div className="bg-[#121216]/95 border border-zinc-800/90 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-colors shadow-xl shadow-black/30">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Timeline Roadmap
                  </span>
                </div>
                <h3 className="font-bold text-sm text-white">CSV Export</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Export milestone deadlines, deliverable checklists, and production progress as CSV.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleExportTimeline}
                  disabled={isExportingTimeline || !configured}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-md shadow-emerald-950/40"
                >
                  <FileSpreadsheet className={`w-3.5 h-3.5 ${isExportingTimeline ? 'animate-pulse' : ''}`} />
                  <span>{isExportingTimeline ? 'Exporting...' : 'Export Timeline'}</span>
                </button>

                {lastTimelineResult?.url && (
                  <a
                    href={lastTimelineResult.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-400 hover:underline pt-1"
                  >
                    <span>Open in Nextcloud</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
