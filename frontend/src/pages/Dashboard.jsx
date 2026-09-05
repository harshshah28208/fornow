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
  Layers,
  ChevronRight,
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

  if (loading) return <LoadingSpinner message="Calculating real-time deal telemetry & risk scores from PostgreSQL..." />;
  if (error) return <ErrorAlert message={error} onRetry={fetchDashboardData} />;

  const { metrics, healthAlerts, charts, pendingApprovals, recentDeals } = data || {};

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Executive Revenue Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time pipeline telemetry, multi-tier approval tracking, and self-governing deal health monitoring.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/quotes/new')}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Build New Quotation
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* STEP-BY-STEP QUICK START GUIDE (Making it easy to understand) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-teal-100">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-black text-xs flex items-center justify-center">
              ✓
            </span>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-900">
              Quick Test Workflow Guide (End-to-End Deal Engine)
            </h3>
          </div>
          <span className="text-[11px] font-bold text-teal-700">7 Interactive Steps</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 pt-3 text-[11px]">
          <div
            onClick={() => navigate('/leads')}
            className="p-2.5 rounded-xl bg-white border border-teal-200 hover:border-teal-400 cursor-pointer transition-all shadow-xs"
          >
            <span className="font-bold text-teal-700 block">1. Leads</span>
            <p className="text-slate-600 text-[10px] mt-0.5">Capture & 1-Click Convert</p>
          </div>

          <div
            onClick={() => navigate('/deals')}
            className="p-2.5 rounded-xl bg-white border border-teal-200 hover:border-teal-400 cursor-pointer transition-all shadow-xs"
          >
            <span className="font-bold text-teal-700 block">2. Opportunities</span>
            <p className="text-slate-600 text-[10px] mt-0.5">Open Deal 360 View</p>
          </div>

          <div
            onClick={() => navigate('/quotes/new')}
            className="p-2.5 rounded-xl bg-white border border-teal-200 hover:border-teal-400 cursor-pointer transition-all shadow-xs"
          >
            <span className="font-bold text-teal-700 block">3. Build Quote</span>
            <p className="text-slate-600 text-[10px] mt-0.5">Discounts & Upsells</p>
          </div>

          <div
            onClick={() => navigate('/approvals')}
            className="p-2.5 rounded-xl bg-white border border-teal-200 hover:border-teal-400 cursor-pointer transition-all shadow-xs"
          >
            <span className="font-bold text-teal-700 block">4. Approvals</span>
            <p className="text-slate-600 text-[10px] mt-0.5">Manager & Finance</p>
          </div>

          <div
            onClick={() => navigate('/contracts')}
            className="p-2.5 rounded-xl bg-white border border-teal-200 hover:border-teal-400 cursor-pointer transition-all shadow-xs"
          >
            <span className="font-bold text-teal-700 block">5. Legal Review</span>
            <p className="text-slate-600 text-[10px] mt-0.5">Review & Sign Contract</p>
          </div>

          <div
            onClick={() => navigate('/invoices')}
            className="p-2.5 rounded-xl bg-white border border-teal-200 hover:border-teal-400 cursor-pointer transition-all shadow-xs"
          >
            <span className="font-bold text-teal-700 block">6. Invoicing</span>
            <p className="text-slate-600 text-[10px] mt-0.5">Settle Real Payments</p>
          </div>

          <div
            onClick={() => navigate('/revenue')}
            className="p-2.5 rounded-xl bg-white border border-teal-200 hover:border-teal-400 cursor-pointer transition-all shadow-xs"
          >
            <span className="font-bold text-teal-700 block">7. Revenue</span>
            <p className="text-slate-600 text-[10px] mt-0.5">Recognized MRR & ARR</p>
          </div>
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
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold animate-pulse">
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
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm bg-white">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Deal Health & Anomaly Radar</h3>
              <p className="text-[11px] text-slate-500">
                Automated detection for stalled deals, discount threshold violations, and delivery promise slippage.
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono font-bold">
            {healthAlerts?.totalAlertsCount || 0} Alerts Active
          </span>
        </div>

        {healthAlerts?.totalAlertsCount === 0 ? (
          <p className="text-xs text-emerald-700 py-3 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> All deals are healthy, on schedule, and within discount governance thresholds.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {/* Stalled Deals */}
            {healthAlerts?.stalledDeals?.map((deal) => (
              <div
                key={deal.id}
                className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 hover:border-amber-400 transition-all space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 px-2 py-0.5 rounded bg-amber-100 border border-amber-300">
                      Stalled Deal ({deal.daysInactive} days inactive)
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1.5 line-clamp-1">{deal.title}</h4>
                    <p className="text-[11px] text-slate-600 font-medium">{deal.accountName}</p>
                  </div>
                  <StageBadge stage={deal.stage} />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-700 pt-1 border-t border-amber-200">
                  <span>Rep: <strong>{deal.ownerName}</strong></span>
                  <span className="font-mono font-bold text-teal-700">₹{(deal.value / 100000).toFixed(2)} L</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      setActionModal({ isOpen: true, deal, type: 'NUDGE_REP' });
                      setActionMessage(`Hi ${deal.ownerName}, deal "${deal.title}" has been inactive for ${deal.daysInactive} days. Please update the customer or log next steps.`);
                    }}
                    className="flex-1 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all"
                  >
                    <Send className="w-3 h-3" /> Nudge Rep
                  </button>
                  <button
                    onClick={() => navigate(`/deals/${deal.id}`)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all shadow-xs"
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
                className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 hover:border-rose-400 transition-all space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-900 px-2 py-0.5 rounded bg-rose-100 border border-rose-300">
                      Discount Anomaly Alert
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1.5 line-clamp-1">{anomaly.title}</h4>
                    <p className="text-[11px] text-slate-600 font-medium">{anomaly.accountName}</p>
                  </div>
                  <RiskBadge riskScore={anomaly.blendedRiskScore} />
                </div>
                <p className="text-[11px] text-rose-800 leading-tight font-medium">
                  Discount of <strong>{anomaly.discountGiven}%</strong> requested by {anomaly.ownerName} (Rep Average: {anomaly.repAvgDiscount}%).
                </p>
                <div className="flex items-center gap-2 pt-1 border-t border-rose-200">
                  <button
                    onClick={() => {
                      setActionModal({ isOpen: true, deal: anomaly, type: 'ESCALATE_MANAGER' });
                      setActionMessage(`Escalating discount anomaly on deal "${anomaly.title}". Rep proposed ${anomaly.discountGiven}% (historical avg ${anomaly.repAvgDiscount}%).`);
                    }}
                    className="flex-1 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all"
                  >
                    <ShieldAlert className="w-3 h-3" /> Escalate
                  </button>
                  <button
                    onClick={() => navigate(`/deals/${anomaly.id}`)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all shadow-xs"
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
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-200 space-y-4 bg-white shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-teal-600" /> Pending Discount Approvals
            </h3>
            <button
              onClick={() => navigate('/approvals')}
              className="text-xs text-teal-700 hover:underline flex items-center gap-1 font-bold"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {pendingApprovals?.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No pending approvals at this time.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200 font-semibold">
                    <th className="pb-3">Deal / Customer</th>
                    <th className="pb-3">Requested By</th>
                    <th className="pb-3">Discount %</th>
                    <th className="pb-3">Blended Risk</th>
                    <th className="pb-3">Required Role</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingApprovals?.map((appr) => (
                    <tr key={appr.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3">
                        <p className="font-bold text-slate-900">{appr.deal?.title}</p>
                        <p className="text-[10px] text-slate-500">{appr.deal?.account?.name}</p>
                      </td>
                      <td className="py-3 text-slate-700 font-medium">
                        {appr.requestedBy?.firstName} {appr.requestedBy?.lastName}
                      </td>
                      <td className="py-3 font-mono font-bold text-amber-800">{appr.requestedDiscount}%</td>
                      <td className="py-3">
                        <RiskBadge riskScore={appr.riskScore} />
                      </td>
                      <td className="py-3 font-mono text-[11px] font-bold text-purple-800">{appr.approverRole}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => navigate('/approvals')}
                          className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-md font-bold text-[11px] transition-all"
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
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-4 bg-white shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600" /> Pipeline by Stage
          </h3>
          <div className="space-y-3 pt-2">
            {charts?.pipelineByStage?.map((item) => (
              <div key={item.stage} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-semibold">{item.stage.replace(/_/g, ' ')}</span>
                  <span className="font-mono text-slate-500 font-bold">{item.count} deals</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal-600"
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
          <p className="text-slate-700">
            Target Deal: <strong className="text-slate-900">{actionModal.deal?.title}</strong>
          </p>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Notification Message</label>
            <textarea
              rows={3}
              value={actionMessage}
              onChange={(e) => setActionMessage(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-teal-600 text-xs"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setActionModal({ isOpen: false, deal: null, type: '' })}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleTriggerHealthAction}
              disabled={submittingAction}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-sm"
            >
              {submittingAction ? 'Sending...' : 'Transmit Action'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
