import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Users,
  Building2,
  Send,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import api from '../api/client';
import { StatCard } from '../components/common/StatCard';
import { StageBadge, RiskBadge, StatusBadge } from '../components/common/Badge';
import { LoadingSpinner, ErrorAlert } from '../components/common/LoadingAndEmpty';
import { Modal } from '../components/common/Modal';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionModal, setActionModal] = useState({ isOpen: false, deal: null, type: '' });
  const [actionMessage, setActionMessage] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard/overview');
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleTriggerHealthAction = async () => {
    if (!actionModal.deal) return;
    setSubmittingAction(true);
    try {
      await api.post('/dashboard/health-action', {
        dealId: actionModal.deal.id,
        actionType: actionModal.type,
        customMessage: actionMessage,
      });
      setActionModal({ isOpen: false, deal: null, type: '' });
      setActionMessage('');
      fetchDashboardData();
    } catch (err) {
      alert('Action error: ' + err.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) return <LoadingSpinner message="Calculating real-time deal telemetry & risk scores..." />;
  if (error) return <ErrorAlert message={error} onRetry={fetchDashboardData} />;

  const { metrics, healthAlerts, charts, pendingApprovals, recentDeals } = data || {};

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Executive Revenue Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time pipeline telemetry, multi-tier approval tracking, and self-governing deal health monitoring.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/quotes/new')}
            className="px-4 py-2 bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-glow transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Build New Quotation
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Pipeline"
          value={`₹${((metrics?.totalPipeline || 0) / 100000).toFixed(2)} L`}
          subtitle={`${metrics?.openDealsCount || 0} Open Opportunities`}
          icon={TrendingUp}
          trend="+18.4%"
          trendPositive={true}
        />
        <StatCard
          title="Won Revenue"
          value={`₹${((metrics?.wonRevenue || 0) / 100000).toFixed(2)} L`}
          subtitle={`Win Rate: ${metrics?.winRate || 0}%`}
          icon={DollarSign}
          trend="+12.0%"
          trendPositive={true}
        />
        <StatCard
          title="Pending Approvals"
          value={metrics?.pendingApprovalsCount || 0}
          subtitle="Awaiting Manager/Finance"
          icon={ShieldAlert}
          badge={
            (metrics?.pendingApprovalsCount || 0) > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold animate-pulse">
                Action Required
              </span>
            ) : null
          }
        />
        <StatCard
          title="Collected Revenue"
          value={`₹${((metrics?.totalCollected || 0) / 100000).toFixed(2)} L`}
          subtitle={`Outstanding: ₹${((metrics?.outstandingInvoices || 0) / 100000).toFixed(2)} L`}
          icon={CheckCircle2}
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Deal Health & Anomaly Alerts (PDF Page 8, B9) */}
      {/* ------------------------------------------------------------- */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Deal Health & Anomaly Radar</h3>
              <p className="text-[11px] text-slate-400">
                Automated detection for stalled deals, discount threshold violations, and delivery promise slippage.
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
            {healthAlerts?.totalAlertsCount || 0} Alerts Active
          </span>
        </div>

        {healthAlerts?.totalAlertsCount === 0 ? (
          <p className="text-xs text-emerald-400 py-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> All deals are healthy, on schedule, and within discount governance thresholds.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {/* Stalled Deals */}
            {healthAlerts?.stalledDeals?.map((deal) => (
              <div
                key={deal.id}
                className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 hover:border-amber-500/60 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      Stalled Deal ({deal.daysInactive} days inactive)
                    </span>
                    <h4 className="text-xs font-bold text-white mt-1.5 line-clamp-1">{deal.title}</h4>
                    <p className="text-[11px] text-slate-400">{deal.accountName}</p>
                  </div>
                  <StageBadge stage={deal.stage} />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-slate-800">
                  <span>Rep: <strong>{deal.ownerName}</strong></span>
                  <span className="font-mono font-bold text-brand-400">₹{(deal.value / 100000).toFixed(2)} L</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      setActionModal({ isOpen: true, deal, type: 'NUDGE_REP' });
                      setActionMessage(`Hi ${deal.ownerName}, deal "${deal.title}" has been inactive for ${deal.daysInactive} days. Please update the customer or log next steps.`);
                    }}
                    className="flex-1 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                  >
                    <Send className="w-3 h-3" /> Nudge Rep
                  </button>
                  <button
                    onClick={() => navigate(`/deals/${deal.id}`)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-all"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            ))}

            {/* Discount Anomalies */}
            {healthAlerts?.discountAnomalies?.map((anomaly) => (
              <div
                key={anomaly.id}
                className="p-4 rounded-xl bg-slate-900/90 border border-rose-500/30 hover:border-rose-500/60 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                      Discount Anomaly Alert
                    </span>
                    <h4 className="text-xs font-bold text-white mt-1.5 line-clamp-1">{anomaly.title}</h4>
                    <p className="text-[11px] text-slate-400">{anomaly.accountName}</p>
                  </div>
                  <RiskBadge riskScore={anomaly.blendedRiskScore} />
                </div>
                <p className="text-[11px] text-rose-300/90 leading-tight">
                  Discount of <strong>{anomaly.discountGiven}%</strong> requested by {anomaly.ownerName} (Rep Average: {anomaly.repAvgDiscount}%).
                </p>
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setActionModal({ isOpen: true, deal: anomaly, type: 'ESCALATE_MANAGER' });
                      setActionMessage(`Escalating discount anomaly on deal "${anomaly.title}". Rep proposed ${anomaly.discountGiven}% (historical avg ${anomaly.repAvgDiscount}%).`);
                    }}
                    className="flex-1 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                  >
                    <ShieldAlert className="w-3 h-3" /> Escalate
                  </button>
                  <button
                    onClick={() => navigate(`/deals/${anomaly.id}`)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-all"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid: Pending Approvals & Pipeline Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals Table */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-brand-400" /> Pending Discount Approvals
            </h3>
            <button
              onClick={() => navigate('/approvals')}
              className="text-xs text-brand-400 hover:underline flex items-center gap-1 font-semibold"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {pendingApprovals?.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No pending approvals at this time.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="pb-3 font-semibold">Deal / Customer</th>
                    <th className="pb-3 font-semibold">Requested By</th>
                    <th className="pb-3 font-semibold">Discount %</th>
                    <th className="pb-3 font-semibold">Blended Risk</th>
                    <th className="pb-3 font-semibold">Required Role</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {pendingApprovals?.map((appr) => (
                    <tr key={appr.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3">
                        <p className="font-bold text-white">{appr.deal?.title}</p>
                        <p className="text-[10px] text-slate-400">{appr.deal?.account?.name}</p>
                      </td>
                      <td className="py-3 text-slate-300">
                        {appr.requestedBy?.firstName} {appr.requestedBy?.lastName}
                      </td>
                      <td className="py-3 font-mono font-bold text-amber-400">{appr.requestedDiscount}%</td>
                      <td className="py-3">
                        <RiskBadge riskScore={appr.riskScore} />
                      </td>
                      <td className="py-3 font-mono text-[11px] text-brand-300">{appr.approverRole}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => navigate('/approvals')}
                          className="px-3 py-1 bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/30 rounded-md font-semibold text-[11px] transition-all"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pipeline Summary Bar Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-400" /> Pipeline by Stage
          </h3>
          <div className="space-y-3 pt-2">
            {charts?.pipelineByStage?.map((item) => (
              <div key={item.stage} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">{item.stage.replace(/_/g, ' ')}</span>
                  <span className="font-mono text-slate-400">{item.count} deals</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-600 to-teal-400"
                    style={{ width: `${Math.min(100, item.count * 25)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Modal for Nudge / Escalation */}
      <Modal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, deal: null, type: '' })}
        title={actionModal.type === 'NUDGE_REP' ? 'Send Rep Automated Nudge' : 'Escalate to Sales Management'}
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300">
            Target Deal: <strong className="text-white">{actionModal.deal?.title}</strong>
          </p>
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Notification Message</label>
            <textarea
              rows={3}
              value={actionMessage}
              onChange={(e) => setActionMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setActionModal({ isOpen: false, deal: null, type: '' })}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleTriggerHealthAction}
              disabled={submittingAction}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold rounded-lg shadow-glow"
            >
              {submittingAction ? 'Sending...' : 'Transmit Action'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
