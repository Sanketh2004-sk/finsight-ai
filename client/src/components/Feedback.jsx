import React, { Component } from 'react';
import { AlertCircle, FileQuestion, RefreshCw } from 'lucide-react';

// ── 1. LOADING SPINNER ──────────────────────────────────────
export const LoadingSpinner = ({ message = 'Loading financial data...' }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center">
    <div className="relative w-12 h-12 mb-4">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      <div className="absolute top-1 left-1 w-10 h-10 border-4 border-indigo-300/10 border-b-indigo-300 rounded-full animate-spin animate-duration-1000 reverse"></div>
    </div>
    <p className="text-xs text-slate-400 font-semibold">{message}</p>
  </div>
);

// ── 2. EMPTY STATE ──────────────────────────────────────────
export const EmptyState = ({ 
  title = 'No records found', 
  description = 'Add some entries to get started.', 
  icon: Icon = FileQuestion,
  actionButton 
}) => (
  <div className="glass-panel p-8 text-center rounded-2xl border border-glassBorder flex flex-col items-center justify-center max-w-md mx-auto my-6 animate-in fade-in duration-300">
    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/20">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-sm font-bold text-white mb-1 font-heading">{title}</h3>
    <p className="text-xs text-slate-400 max-w-xs mb-4 leading-relaxed">{description}</p>
    {actionButton}
  </div>
);

// ── 3. ERROR BOUNDARY ───────────────────────────────────────
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050811] flex items-center justify-center p-6">
          <div className="glass-panel p-8 rounded-2xl border border-red-500/20 max-w-md w-full text-center shadow-2xl">
            <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400 mx-auto mb-5 border border-red-500/25">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2 font-heading">Something went wrong</h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              We encountered an unexpected error. Please try refreshing the application.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-lg btn-primary text-xs font-bold text-white inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
