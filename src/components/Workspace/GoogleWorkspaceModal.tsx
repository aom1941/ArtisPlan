import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  FileText, 
  FileSpreadsheet, 
  Cloud, 
  CheckCircle2, 
  ExternalLink, 
  Upload, 
  RefreshCw, 
  X, 
  ShieldCheck, 
  LogOut, 
  Download,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import type { ProjectData } from '../../types';
import { 
  requestGoogleLogin, 
  logoutGoogle, 
  backupProjectToGoogleDrive, 
  exportProjectToGoogleDocs, 
  exportTimelineToGoogleSheets, 
  fetchDriveRecentImages,
  getStoredAccessToken
} from '../../lib/workspace';

interface GoogleWorkspaceModalProps {
  project: ProjectData;
  setProject: React.Dispatch<React.SetStateAction<ProjectData>>;
  googleUser: any;
  setGoogleUser: (user: any) => void;
  onClose: () => void;
}

export const GoogleWorkspaceModal: React.FC<GoogleWorkspaceModalProps> = ({
  project,
  setProject,
  googleUser,
  setGoogleUser,
  onClose
}) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isExportingDoc, setIsExportingDoc] = useState(false);
  const [isExportingSheet, setIsExportingSheet] = useState(false);

  const [lastDriveResult, setLastDriveResult] = useState<{ jsonName?: string; imgName?: string; link?: string } | null>(null);
  const [lastDocResult, setLastDocResult] = useState<{ docId?: string; docUrl?: string } | null>(null);
  const [lastSheetResult, setLastSheetResult] = useState<{ sheetId?: string; sheetUrl?: string } | null>(null);

  const [driveImages, setDriveImages] = useState<Array<{ id: string; name: string; thumbnailLink?: string }>>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const token = getStoredAccessToken();

  useEffect(() => {
    if (token) {
      loadDriveImages(token);
    }
  }, [token]);

  const loadDriveImages = async (authToken: string) => {
    setIsLoadingImages(true);
    try {
      const files = await fetchDriveRecentImages(authToken);
      setDriveImages(files);
    } catch (err) {
      console.warn("Could not fetch Drive images:", err);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleLogin = async () => {
    setIsAuthenticating(true);
    setStatusMessage(null);
    try {
      const res = await requestGoogleLogin();
      setGoogleUser(res.user || { name: 'Google Workspace Connected' });
      setStatusMessage('Google Workspace successfully connected!');
      if (res.token) {
        loadDriveImages(res.token);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setStatusMessage(err.message || 'Authentication was cancelled or failed.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    logoutGoogle();
    setGoogleUser(null);
    setDriveImages([]);
    setStatusMessage('Logged out from Google Workspace.');
  };

  // Google Drive Backup
  const handleBackupToDrive = async () => {
    const curToken = getStoredAccessToken();
    if (!curToken) {
      await handleLogin();
      return;
    }

    setIsBackingUp(true);
    setStatusMessage(null);
    try {
      const res = await backupProjectToGoogleDrive(curToken, project);
      setLastDriveResult({
        jsonName: res.jsonResult.fileName,
        imgName: res.imageResult?.fileName,
        link: res.jsonResult.webViewLink
      });
      setProject(prev => ({
        ...prev,
        lastCloudSync: new Date().toISOString()
      }));
      setStatusMessage('Project successfully backed up to Google Drive folder "ArtisPlan Studio Backups"!');
    } catch (err: any) {
      console.error("Drive backup failed:", err);
      setStatusMessage(`Drive Backup Error: ${err.message}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  // Google Docs Export
  const handleExportToGoogleDocs = async () => {
    const curToken = getStoredAccessToken();
    if (!curToken) {
      await handleLogin();
      return;
    }

    setIsExportingDoc(true);
    setStatusMessage(null);
    try {
      const res = await exportProjectToGoogleDocs(curToken, project);
      setLastDocResult(res);
      setStatusMessage('Google Doc created with full Project Brief, Palette Specs & Guidelines!');
    } catch (err: any) {
      console.error("Docs export failed:", err);
      setStatusMessage(`Google Docs Export Error: ${err.message}`);
    } finally {
      setIsExportingDoc(false);
    }
  };

  // Google Sheets Export
  const handleExportToGoogleSheets = async () => {
    const curToken = getStoredAccessToken();
    if (!curToken) {
      await handleLogin();
      return;
    }

    setIsExportingSheet(true);
    setStatusMessage(null);
    try {
      const res = await exportTimelineToGoogleSheets(curToken, project);
      setLastSheetResult(res);
      setStatusMessage('Google Sheet created with full Milestone Roadmap & Deliverables Tracker!');
    } catch (err: any) {
      console.error("Sheets export failed:", err);
      setStatusMessage(`Google Sheets Export Error: ${err.message}`);
    } finally {
      setIsExportingSheet(false);
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
              <h2 className="font-bold text-base text-white font-['Outfit']">Google Workspace Integration</h2>
              <p className="text-xs text-zinc-400">Google Drive, Docs, and Sheets Cloud Synchronization</p>
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
            <div className="p-3 rounded-2xl bg-cyan-950/50 border border-cyan-800/70 text-cyan-200 text-xs flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{statusMessage}</span>
              </div>
              <button onClick={() => setStatusMessage(null)} className="text-cyan-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Account Connection Card */}
          <div className="bg-[#121216]/95 border border-zinc-800/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-black/30">
            <div className="flex items-center gap-3">
              {googleUser?.picture ? (
                <img src={googleUser.picture} alt="User avatar" className="w-10 h-10 rounded-full border border-zinc-700" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#18181F] border border-zinc-800 flex items-center justify-center text-zinc-300 font-bold text-sm">
                  {googleUser?.name ? googleUser.name[0] : <ShieldCheck className="w-5 h-5 text-emerald-400" />}
                </div>
              )}
              <div>
                <h4 className="text-sm font-semibold text-white">
                  {googleUser ? (googleUser.name || 'Google Workspace Connected') : 'Not Connected to Google'}
                </h4>
                <p className="text-xs text-zinc-400">
                  {googleUser?.email || 'Connect to enable automatic Drive backups and Docs/Sheets export'}
                </p>
              </div>
            </div>

            <div>
              {googleUser ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1A1A22] hover:bg-[#242430] border border-zinc-800 text-xs text-rose-400 hover:text-rose-300 transition-colors shadow-sm"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              ) : (
                <button
                  onClick={handleLogin}
                  disabled={isAuthenticating}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold shadow-md shadow-blue-950/40 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAuthenticating ? 'animate-spin' : ''}`} />
                  <span>{isAuthenticating ? 'Connecting...' : 'Connect Google Workspace'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Integration Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Google Drive Card */}
            <div className="bg-[#121216]/95 border border-zinc-800/90 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-colors shadow-xl shadow-black/30">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                    Automatic Backups
                  </span>
                </div>
                <h3 className="font-bold text-sm text-white">Google Drive</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Backup full project JSON state and high-res canvas exports to your Drive folder.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleBackupToDrive}
                  disabled={isBackingUp}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-md shadow-blue-950/40"
                >
                  <Upload className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-bounce' : ''}`} />
                  <span>{isBackingUp ? 'Backing Up...' : 'Backup Now to Drive'}</span>
                </button>

                {lastDriveResult?.link && (
                  <a
                    href={lastDriveResult.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 text-[11px] text-blue-400 hover:underline pt-1"
                  >
                    <span>View in Google Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Google Docs Card */}
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
                <h3 className="font-bold text-sm text-white">Google Docs</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Export structured art direction briefs, lore, palette specifications, and composition rules.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleExportToGoogleDocs}
                  disabled={isExportingDoc}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-md shadow-indigo-950/40"
                >
                  <FileText className={`w-3.5 h-3.5 ${isExportingDoc ? 'animate-pulse' : ''}`} />
                  <span>{isExportingDoc ? 'Generating Doc...' : 'Export to Google Docs'}</span>
                </button>

                {lastDocResult?.docUrl && (
                  <a
                    href={lastDocResult.docUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 text-[11px] text-indigo-400 hover:underline pt-1"
                  >
                    <span>Open in Google Docs</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Google Sheets Card */}
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
                <h3 className="font-bold text-sm text-white">Google Sheets</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Export milestone deadlines, deliverable checklists, hourly budgets, and production progress.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleExportToGoogleSheets}
                  disabled={isExportingSheet}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-md shadow-emerald-950/40"
                >
                  <FileSpreadsheet className={`w-3.5 h-3.5 ${isExportingSheet ? 'animate-pulse' : ''}`} />
                  <span>{isExportingSheet ? 'Creating Sheet...' : 'Export to Google Sheets'}</span>
                </button>

                {lastSheetResult?.sheetUrl && (
                  <a
                    href={lastSheetResult.sheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-400 hover:underline pt-1"
                  >
                    <span>Open in Google Sheets</span>
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
