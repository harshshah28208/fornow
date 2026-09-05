import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Filter, Clock, User } from 'lucide-react';
import api from '../api/client';
import { LoadingSpinner, EmptyState, ErrorAlert } from '../components/common/LoadingAndEmpty';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/audit-logs?entity=${entityFilter}&search=${search}`);
      setLogs(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter]);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-brand-400" /> Immutable System Audit Trail
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Cryptographically recorded state changes, discount requests, approval decisions, and contract executions.
        </p>
      </div>

      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[260px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit actions, entity IDs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Entities</option>
            <option value="QUOTE">Quotations</option>
            <option value="DEAL">Deals</option>
            <option value="APPROVAL">Approvals</option>
            <option value="CONTRACT">Contracts</option>
            <option value="PAYMENT">Payments</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching tamper-evident audit logs..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={fetchLogs} />
      ) : logs.length === 0 ? (
        <EmptyState title="No audit logs recorded" />
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                <th className="p-4">Action Type</th>
                <th className="p-4">Entity</th>
                <th className="p-4">User</th>
                <th className="p-4">State Telemetry</th>
                <th className="p-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-bold text-brand-300">{log.action}</td>
                  <td className="p-4 text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">
                      {log.entity}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300 font-sans">
                    {log.user ? `${log.user.firstName} ${log.user.lastName} (${log.user.role})` : 'System Engine'}
                  </td>
                  <td className="p-4 text-slate-400 max-w-xs truncate">
                    {log.newState || log.previousState || '-'}
                  </td>
                  <td className="p-4 text-right text-slate-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
