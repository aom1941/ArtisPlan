import React from 'react';
import { AlertTriangle, RefreshCw, Download, LifeBuoy } from 'lucide-react';
import { StorageService } from '../lib/storage';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRecover = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleEmergencyExport = () => {
    try {
      const current = StorageService.loadCurrentProject();
      const blob = new Blob([JSON.stringify(current, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emergency_backup_${current.id || 'project'}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Could not export backup: ' + String(e));
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950 p-6 text-neutral-100">
          <div className="max-w-lg w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center space-x-3 text-amber-400">
              <AlertTriangle className="w-8 h-8 flex-shrink-0" />
              <div>
                <h1 className="text-xl font-bold text-neutral-100">Canvas Encountered an Issue</h1>
                <p className="text-xs text-neutral-400">Your local project data is preserved safely.</p>
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-xs font-mono text-neutral-300 max-h-40 overflow-y-auto">
              <p className="text-red-400 font-semibold mb-1">{this.state.error?.name}: {this.state.error?.message}</p>
              {this.state.error?.stack && (
                <p className="text-neutral-500 whitespace-pre-wrap text-[11px]">{this.state.error.stack}</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleRecover}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-cyan-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                Reload & Recover
              </button>
              <button
                onClick={this.handleEmergencyExport}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-xl text-sm border border-neutral-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Project JSON
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 pt-2 border-t border-neutral-800">
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Auto-saved state is in local browser storage</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
