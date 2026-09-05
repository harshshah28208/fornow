import React, { useState, useEffect } from 'react';
import { FileSignature, ShieldCheck, CheckCircle2, Clock, Building2, ExternalLink } from 'lucide-react';
import api from '../api/client';
import { StatusBadge } from '../components/common/Badge';
import { LoadingSpinner, EmptyState, ErrorAlert } from '../components/common/LoadingAndEmpty';
import { Modal } from '../components/common/Modal';

export const Contracts = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Legal Review Modal
  const [activeContract, setActiveContract] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [revisedTerms, setRevisedTerms] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/contracts');
      setContracts(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleLegalReview = async () => {
    if (!activeContract) return;
    setSubmittingReview(true);
    try {
      await api.post(`/contracts/${activeContract.id}/review`, {
        decision: reviewDecision,
        notes: reviewNotes,
        revisedTerms: revisedTerms || undefined,
      });
      setActiveContract(null);
      fetchContracts();
    } catch (err) {
      alert('Legal review action failed: ' + err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSignContract = async (contractId, accountName) => {
    try {
      await api.post(`/contracts/${contractId}/sign`, {
        signerName: `${accountName} Signatory`,
      });
      fetchContracts();
    } catch (err) {
      alert('Failed to sign contract: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSignature className="w-6 h-6 text-brand-600" /> Contracts & Legal Review
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Manage legal compliance, terms revisions, and electronic execution for approved deals.
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching contract repository..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={fetchContracts} />
      ) : contracts.length === 0 ? (
        <EmptyState
          title="No contracts generated yet"
          description="Contracts are automatically generated when a quotation is approved."
        />
      ) : (
        <div className="space-y-4">
          {contracts.map((c) => (
            <div
              key={c.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-slate-900">{c.contractNumber} - {c.title}</h3>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-600 mt-1.5">
                    <span>Account: <strong className="text-slate-800">{c.account?.name}</strong></span>
                    <span>Deal: <strong className="text-slate-800">{c.deal?.title}</strong></span>
                    <span className="font-mono text-slate-500">Created: {new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block font-semibold uppercase">Contract Value</span>
                    <strong className="text-base font-mono font-bold text-brand-700">
                      ₹{c.value?.toLocaleString('en-IN')}
                    </strong>
                  </div>

                  {c.status === 'LEGAL_REVIEW' && (
                    <button
                      onClick={() => {
                        setActiveContract(c);
                        setRevisedTerms(c.terms);
                        setReviewNotes('Standard terms verified and approved.');
                        setReviewDecision('APPROVED');
                      }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Legal Review
                    </button>
                  )}

                  {c.status === 'APPROVED' && (
                    <button
                      onClick={() => handleSignContract(c.id, c.account?.name)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Sign & Execute
                    </button>
                  )}
                </div>
              </div>

              {/* Terms Content Preview */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Contract Terms & SLA</span>
                <pre className="font-mono text-slate-800 whitespace-pre-wrap max-h-32 overflow-y-auto leading-relaxed text-[11px]">
                  {c.terms}
                </pre>
              </div>

              {c.legalNotes && (
                <p className="text-xs text-brand-700">
                  <strong>Legal Counsel Notes:</strong> {c.legalNotes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Legal Review Modal */}
      <Modal
        isOpen={!!activeContract}
        onClose={() => setActiveContract(null)}
        title="Conduct Legal Counsel Review"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-700">
            Reviewing contract terms for <strong className="text-slate-900">{activeContract?.account?.name}</strong> (Value: ₹{activeContract?.value?.toLocaleString('en-IN')}).
          </p>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Review Decision</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setReviewDecision('APPROVED')}
                className={`flex-1 py-2 rounded-lg font-bold border transition-all ${
                  reviewDecision === 'APPROVED'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                    : 'bg-slate-50 border-slate-300 text-slate-600'
                }`}
              >
                Approve Contract
              </button>
              <button
                type="button"
                onClick={() => setReviewDecision('CHANGES_REQUESTED')}
                className={`flex-1 py-2 rounded-lg font-bold border transition-all ${
                  reviewDecision === 'CHANGES_REQUESTED'
                    ? 'bg-amber-50 border-amber-500 text-amber-800'
                    : 'bg-slate-50 border-slate-300 text-slate-600'
                }`}
              >
                Request Changes
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Legal Review Notes *</label>
            <textarea
              rows={2}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-brand-500 text-xs shadow-sm"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Terms Modifications (Creates new version)</label>
            <textarea
              rows={6}
              value={revisedTerms}
              onChange={(e) => setRevisedTerms(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 font-mono focus:outline-none focus:border-brand-500 text-[11px] shadow-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              onClick={() => setActiveContract(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleLegalReview}
              disabled={submittingReview}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg shadow-sm transition-all"
            >
              {submittingReview ? 'Submitting...' : 'Confirm Review'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
