import React from 'react';
import { Loader2, FolderOpen, AlertCircle } from 'lucide-react';

export const LoadingSpinner = ({ message = 'Loading data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
      <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
};

export const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No items found',
  description = 'Get started by creating a new entry.',
  actionButton,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center glass-panel rounded-2xl border border-dashed border-slate-800 my-4 space-y-3">
      <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-base font-bold text-white">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm">{description}</p>
      {actionButton && <div className="pt-2">{actionButton}</div>}
    </div>
  );
};

export const ErrorAlert = ({ message, onRetry }) => {
  return (
    <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 flex items-center justify-between my-4">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
        <p className="text-sm">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1 text-xs font-semibold bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded-lg transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
};
