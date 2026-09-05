import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles, Building2, CheckCircle2, Send, MessageSquare, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../api/client';
import { StatusBadge } from '../components/common/Badge';
import { LoadingSpinner, ErrorAlert } from '../components/common/LoadingAndEmpty';

export const CustomerPortal = () => {
  const { quoteId } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Negotiation Form
  const [feedback, setFeedback] = useState('');
  const [counterDiscount, setCounterDiscount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState(null);

  const fetchPortalQuote = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/portal/quotes/${quoteId}`);
      setQuote(res.data);
    } catch (err) {
      setError(err.message || 'Quotation link invalid or expired');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalQuote();
  }, [quoteId]);

  const handleNegotiate = async (isAccepted) => {
    setSubmitting(true);
    try {
      const res = await api.post(`/portal/quotes/${quoteId}/negotiate`, {
        feedback,
        counterDiscountPercent: counterDiscount ? parseFloat(counterDiscount) : undefined,
        isAccepted,
      });
      setSubmittedMessage(res.message);
      fetchPortalQuote();
    } catch (err) {
      alert('Action error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Securing customer negotiation portal..." />;
  if (error) return <ErrorAlert message={error} onRetry={fetchPortalQuote} />;
  if (!quote) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-12 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center font-extrabold text-white text-lg shadow-sm">
              360
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-slate-900">DealFlow360 Customer Portal</h1>
              <p className="text-xs text-slate-600">Interactive Quotation Review & Real-Time Negotiation</p>
            </div>
          </div>
          <StatusBadge status={quote.status} />
        </div>

        {submittedMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{submittedMessage}</span>
          </div>
        )}

        {/* Quote Overview Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Quotation Number</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                  Customer Tier: {quote.deal?.account?.tier || 'BRONZE'}
                  {quote.deal?.account?.tierLockedByAdmin ? ' (🔒 Admin Locked)' : ' (Self-Configured)'}
                </span>
              </div>
              <h2 className="text-xl font-mono font-bold text-slate-900 mt-0.5">{quote.quoteNumber}</h2>
              <p className="text-xs text-slate-600 mt-1">
                Prepared for <strong className="text-slate-900">{quote.deal?.account?.name}</strong> • Rep: {quote.deal?.owner?.firstName} {quote.deal?.owner?.lastName}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Total Proposed Amount</span>
              <strong className="text-2xl font-mono font-extrabold text-teal-700">
                ₹{quote.totalAmount?.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Quotation Line Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200 font-semibold">
                    <th className="pb-2.5">Product & Scope</th>
                    <th className="pb-2.5">Billing Type</th>
                    <th className="pb-2.5">Quantity</th>
                    <th className="pb-2.5">Unit Price</th>
                    <th className="pb-2.5 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {quote.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-sans font-semibold text-slate-900">{item.product?.name}</td>
                      <td className="py-3 text-[11px] text-slate-600 font-sans">{item.billingModel}</td>
                      <td className="py-3 text-slate-800">{item.quantity}</td>
                      <td className="py-3 text-slate-800">₹{item.unitPrice?.toLocaleString('en-IN')}</td>
                      <td className="py-3 text-right text-brand-700 font-bold">₹{item.totalAmount?.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Customer Interactive Negotiation Panel (PDF Page 8, B8) */}
        {/* ------------------------------------------------------------- */}
        {quote.status !== 'ACCEPTED' && (
          <div className="bg-white p-6 rounded-2xl border border-brand-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Propose Changes or Counter Terms</h3>
                <p className="text-[11px] text-slate-600">
                  Negotiate directly within this portal. Proposing a custom discount automatically re-routes the quotation into the internal approval chain.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Counter Discount Proposal % (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 15"
                  value={counterDiscount}
                  onChange={(e) => setCounterDiscount(e.target.value)}
                  className="w-48 bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono text-sm focus:outline-none focus:border-brand-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Line-Level Comments & Feedback</label>
                <textarea
                  rows={3}
                  placeholder="e.g. We would like to proceed with 5 Developer Workstations if delivery SLA can be guaranteed within 10 days."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-brand-500 text-xs shadow-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleNegotiate(false)}
                disabled={submitting || (!feedback && !counterDiscount)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all border border-slate-200"
              >
                <Send className="w-3.5 h-3.5" /> Submit Counter Proposal
              </button>

              <button
                onClick={() => handleNegotiate(true)}
                disabled={submitting}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold rounded-xl shadow-sm text-xs flex items-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" /> Confirm & Accept Terms
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
