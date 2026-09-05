import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Building2,
  User,
  ArrowRight,
  Filter,
} from 'lucide-react';
import api from '../api/client';
import { StageBadge, TierBadge, RiskBadge, StatusBadge } from '../components/common/Badge';
import { LoadingSpinner, EmptyState, ErrorAlert } from '../components/common/LoadingAndEmpty';
import { Modal } from '../components/common/Modal';

export const Approvals = () => {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('PENDING');

  // Decision Modal State
  const [activeApproval, setActiveApproval] = useState(null);
  const [decisionType, setDecisionType] = useState('APPROVED'); // APPROVED, REJECTED, REVISION_REQUESTED
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/approvals?status=${statusFilter}`);
      setApprovals(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  const handleDecision = async () => {
    if (!activeApproval) return;
    setSubmitting(true);
    try {
      await api.post(`/approvals/${activeApproval.id}/decide`, {
        decision: decisionType,
        comments,
      });
      setActiveApproval(null);
      setComments('');
      fetchApprovals();
    } catch (err) {
      alert('Approval action rejected: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-brand-400" /> Discount Governance Approval Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review and govern multi-tier quote discount requests based on margin impact and blended risk scores.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-semibold"
          >
            <option value="PENDING">Pending Approvals</option>
            <option value="APPROVED">Approved History</option>
            <option value="REJECTED">Rejected History</option>
            <option value="ALL">All Requests</option>
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <LoadingSpinner message="Fetching approval queue..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={fetchApprovals} />
      ) : approvals.length === 0 ? (
        <EmptyState
          title="No approval requests in this view"
          description="Quotes that exceed sales rep discount ceilings will appear here automatically."
        />
      ) : (
        <div className="space-y-4">
          {approvals.map((appr) => (
            <div
              key={appr.id}
              className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition-all shadow-xl"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-white">{appr.deal?.title}</h3>
                    <StatusBadge status={appr.status} />
                    <RiskBadge riskScore={appr.riskScore} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5">
                    <span>Account: <strong className="text-slate-200">{appr.deal?.account?.name}</strong></span>
                    {appr.deal?.account?.tier && <TierBadge tier={appr.deal.account.tier} />}
                    <span>Requested by: <strong className="text-slate-200">{appr.requestedBy?.firstName} {appr.requestedBy?.lastName}</strong></span>
                    <span className="font-mono text-[11px] text-slate-400">{new Date(appr.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {appr.status === 'PENDING' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveApproval(appr);
                        setDecisionType('APPROVED');
                        setComments('Approved by authorized reviewer.');
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve Discount
                    </button>
                    <button
                      onClick={() => {
                        setActiveApproval(appr);
                        setDecisionType('REJECTED');
                        setComments('Discount too aggressive for target gross margin.');
                      }}
                      className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold rounded-xl text-xs transition-all"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        setActiveApproval(appr);
                        setDecisionType('REVISION_REQUESTED');
                        setComments('Please reduce discount to 8% or increase subscription duration.');
                      }}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-all"
                    >
                      Request Revision
                    </button>
                  </div>
                )}
              </div>

              {/* Justification Box */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1">
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Business Justification & Context</span>
                <p className="text-slate-200">{appr.reason}</p>
                {appr.comments && (
                  <p className="text-brand-300 pt-1 border-t border-slate-850 mt-1">
                    <strong>Decision Note:</strong> {appr.comments}
                  </p>
                )}
              </div>

              {/* Quote Metrics Summary */}
              {appr.quote && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-sans">Quote Total</span>
                    <strong className="text-brand-400 font-bold">₹{appr.quote.totalAmount?.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-sans">Proposed Discount</span>
                    <strong className="text-amber-400 font-bold">{appr.requestedDiscount}%</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-sans">Tier Threshold</span>
                    <strong className="text-slate-300">{appr.thresholdDiscount}% Max</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-sans">Required Role</span>
                    <strong className="text-purple-300">{appr.approverRole}</strong>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Decision Modal */}
      <Modal
        isOpen={!!activeApproval}
        onClose={() => setActiveApproval(null)}
        title={`Confirm Decision: ${decisionType}`}
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300">
            You are about to record a decision for Quote <strong>{activeApproval?.quote?.quoteNumber}</strong> ({activeApproval?.deal?.title}).
          </p>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Reason / Approver Notes *</label>
            <textarea
              rows={3}
              required
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={() => setActiveApproval(null)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleDecision}
              disabled={submitting}
              className={`px-5 py-2 font-bold rounded-lg shadow-lg text-slate-950 ${
                decisionType === 'APPROVED'
                  ? 'bg-emerald-500 hover:bg-emerald-400 shadow-glow'
                  : decisionType === 'REJECTED'
                  ? 'bg-rose-500 hover:bg-rose-400 text-white'
                  : 'bg-amber-500 hover:bg-amber-400'
              }`}
            >
              {submitting ? 'Recording...' : `Execute ${decisionType}`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
