import React from 'react';
import { Loader2, FolderOpen, AlertCircle } from 'lucide-react';

export const LoadingSpinner = ({ message = 'Loading data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-500 space-y-3">
      <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      <p className="text-xs font-bold text-slate-700">{message}</p>
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
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 my-4 space-y-3 shadow-xs">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-base font-extrabold text-slate-900">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm">{description}</p>
      {actionButton && <div className="pt-2">{actionButton}</div>}
    </div>
  );
};

export const ErrorAlert = ({ message, onRetry }) => {
  return (
    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between my-4 shadow-xs">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
        <p className="text-xs font-semibold">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1 text-xs font-bold bg-rose-200 hover:bg-rose-300 text-rose-900 rounded-lg transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
};
