import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Clock,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Building2,
} from 'lucide-react';
import api from '../api/client';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge, RiskBadge } from '../components/common/Badge';
import { LoadingSpinner, EmptyState } from '../components/common/LoadingAndEmpty';

export const DealHealth = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);

  const fetchHealthData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/overview');
      setData(res.data || {});
    } catch (err) {
      console.error('Failed to load deal health data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  const handleRemediate = async (dealId, actionType) => {
    setActionInProgress(dealId);
    try {
      const res = await api.post('/dashboard/health-action', { dealId, actionType });
      alert(res.message || 'Remediation action triggered successfully!');
      fetchHealthData();
    } catch (err) {
      alert('Action error: ' + err.message);
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading) return <LoadingSpinner message="Evaluating pipeline health telemetry & risk scores..." />;

  const health = data?.healthMonitoring || {};
  const stalledDeals = health.stalledDeals || [];
  const slippageRisks = health.deliverySlippageRisk || [];
  const discountAnomalies = health.discountAnomalies || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-600" /> Deal Health & Pipeline Risk Radar
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Stage aging detection, discount variance anomalies, delivery slippage alarms, and automated rep velocity scoring.
          </p>
        </div>

        <button
          onClick={fetchHealthData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Re-scan Telemetry
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Stalled Opportunities"
          value={stalledDeals.length}
          subtitle="Inactive > 14 days"
          color={stalledDeals.length > 0 ? 'amber' : 'emerald'}
          icon={Clock}
        />
        <StatCard
          title="Fulfillment Slippage Risk"
          value={slippageRisks.length}
          subtitle="Inventory or SLA bottleneck"
          color={slippageRisks.length > 0 ? 'rose' : 'emerald'}
          icon={AlertTriangle}
        />
        <StatCard
          title="Discount Anomaly Rate"
          value={discountAnomalies.length}
          subtitle="Exceeds rep historical avg"
          color="indigo"
          icon={ShieldAlert}
        />
        <StatCard
          title="Conversion Velocity"
          value="18.4 Days"
          subtitle="Lead to Closed Won speed"
          color="teal"
          icon={TrendingUp}
        />
      </div>

      {/* Health Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Stalled Deals */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" /> Stalled Deals ({stalledDeals.length})
            </h3>
            <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Needs Follow-Up
            </span>
          </div>

          <div className="space-y-3">
            {stalledDeals.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No stalled deals detected. Great pipeline velocity!</p>
            ) : (
              stalledDeals.map((deal) => (
                <div key={deal.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{deal.title}</h4>
                      <p className="text-[11px] text-slate-500">{deal.account?.name} • Stage: {deal.stage}</p>
                    </div>
                    <strong className="text-xs font-mono text-slate-900">₹{deal.value?.toLocaleString('en-IN')}</strong>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px]">
                    <span className="text-amber-700 font-semibold">
                      Idle: {deal.daysInactive} days
                    </span>
                    <button
                      disabled={actionInProgress === deal.id}
                      onClick={() => handleRemediate(deal.id, 'NUDGE_REP')}
                      className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-800 font-bold rounded-lg border border-amber-300 shadow-xs"
                    >
                      {actionInProgress === deal.id ? 'Sending...' : '⚡ Nudge Rep'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Delivery & Fulfillment Slippage Risk */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> Delivery Slippage ({slippageRisks.length})
            </h3>
            <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              SLA Risk
            </span>
          </div>

          <div className="space-y-3">
            {slippageRisks.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">All warehouse fulfillment promises are on schedule.</p>
            ) : (
              slippageRisks.map((deal) => (
                <div key={deal.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{deal.title}</h4>
                      <p className="text-[11px] text-slate-500">{deal.account?.name}</p>
                    </div>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      High Slippage
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-tight">
                    Delivery promised: <strong className="text-slate-800">{new Date(deal.deliveryPromiseDate).toLocaleDateString()}</strong>.
                  </p>

                  <div className="flex items-center justify-end pt-2 border-t border-slate-200 text-[10px]">
                    <button
                      disabled={actionInProgress === deal.id}
                      onClick={() => handleRemediate(deal.id, 'EXPEDITE_STOCK')}
                      className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 font-bold rounded-lg border border-rose-300 shadow-xs"
                    >
                      {actionInProgress === deal.id ? 'Routing...' : '📦 Expedite Stock'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. Discount Anomaly Engine */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-600" /> Discount Anomalies ({discountAnomalies.length})
            </h3>
            <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Audit Flag
            </span>
          </div>

          <div className="space-y-3">
            {discountAnomalies.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No anomalous discount deviations detected.</p>
            ) : (
              discountAnomalies.map((deal) => (
                <div key={deal.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{deal.title}</h4>
                      <p className="text-[11px] text-slate-500">Rep: {deal.owner?.firstName} {deal.owner?.lastName}</p>
                    </div>
                    <RiskBadge score={7} />
                  </div>

                  <p className="text-[11px] text-slate-600">
                    Proposed discount exceeds rep's historical average by &gt; 10%.
                  </p>

                  <div className="flex items-center justify-end pt-2 border-t border-slate-200 text-[10px]">
                    <button
                      disabled={actionInProgress === deal.id}
                      onClick={() => handleRemediate(deal.id, 'ESCALATE_FINANCE')}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-300 shadow-xs"
                    >
                      {actionInProgress === deal.id ? 'Escalating...' : '🔒 Review Governance'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealHealth;
