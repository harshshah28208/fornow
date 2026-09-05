import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  Calendar,
  DollarSign,
  User,
  Sparkles,
  FileSignature,
  Receipt,
  CreditCard,
  Clock,
  ShieldAlert,
  Plus,
  ExternalLink,
  CheckCircle2,
  Send,
  Boxes,
  Layers,
} from 'lucide-react';
import api from '../api/client';
import { StageBadge, TierBadge, RiskBadge, StatusBadge } from '../components/common/Badge';
import { LoadingSpinner, EmptyState, ErrorAlert } from '../components/common/LoadingAndEmpty';
import { Modal } from '../components/common/Modal';

export const DealDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Contract Generation Modal
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractTerms, setContractTerms] = useState('');
  const [submittingContract, setSubmittingContract] = useState(false);

  // Invoice Generation
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  // Payment Recording Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [targetInvoice, setTargetInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchDeal = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/deals/${id}`);
      setDeal(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load deal 360 view');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeal();
  }, [id]);

  const handleCreateContract = async () => {
    const latestQuote = deal?.quotes?.[0];
    if (!latestQuote) return;
    setSubmittingContract(true);
    try {
      await api.post('/contracts', {
        dealId: deal.id,
        quoteId: latestQuote.id,
        title: `Enterprise Agreement - ${deal.account.name}`,
        terms: contractTerms || undefined,
      });
      setIsContractModalOpen(false);
      fetchDeal();
      setActiveTab('contracts');
    } catch (err) {
      alert('Contract error: ' + err.message);
    } finally {
      setSubmittingContract(false);
    }
  };

  const handleGenerateInvoice = async () => {
    setGeneratingInvoice(true);
    try {
      await api.post('/invoices/generate', { dealId: deal.id });
      fetchDeal();
      setActiveTab('invoices');
    } catch (err) {
      alert('Invoice generation failed: ' + err.message);
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!targetInvoice || !paymentAmount) return;
    setSubmittingPayment(true);
    try {
      await api.post('/invoices/payment', {
        invoiceId: targetInvoice.id,
        amount: parseFloat(paymentAmount),
        paymentMethod,
      });
      setIsPaymentModalOpen(false);
      setPaymentAmount('');
      fetchDeal();
    } catch (err) {
      alert('Payment error: ' + err.message);
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (loading) return <LoadingSpinner message="Assembling complete Deal 360 lifecycle..." />;
  if (error) return <ErrorAlert message={error} onRetry={fetchDeal} />;
  if (!deal) return <EmptyState title="Deal Not Found" />;

  const latestQuote = deal.quotes?.[0];
  const latestContract = deal.contracts?.[0];

  const tabs = [
    { id: 'overview', label: 'Deal Overview' },
    { id: 'quotes', label: `Quotes & Cart (${deal.quotes?.length || 0})` },
    { id: 'approvals', label: `Approvals (${deal.approvals?.length || 0})` },
    { id: 'contracts', label: `Contracts & Legal (${deal.contracts?.length || 0})` },
    { id: 'invoices', label: `Invoices & Payments (${deal.invoices?.length || 0})` },
    { id: 'audit', label: 'Immutable Audit Trail' },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* 360 Header Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-extrabold text-white tracking-tight">{deal.title}</h1>
              <StageBadge stage={deal.stage} />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Building2 className="w-3.5 h-3.5 text-brand-400" /> {deal.account?.name}
              </span>
              {deal.account?.tier && <TierBadge tier={deal.account.tier} />}
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" /> Owner: <strong>{deal.owner?.firstName} {deal.owner?.lastName}</strong>
              </span>
            </div>
          </div>

          {/* Quick Actions based on Stage */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate(`/quotes/new?dealId=${deal.id}`)}
              className="px-3.5 py-2 bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-glow transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Quote Builder
            </button>

            {latestQuote && ['APPROVED', 'ACCEPTED'].includes(latestQuote.status) && !latestContract && (
              <button
                onClick={() => setIsContractModalOpen(true)}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <FileSignature className="w-3.5 h-3.5" /> Generate Contract
              </button>
            )}

            {latestContract?.status === 'SIGNED' && deal.invoices?.length === 0 && (
              <button
                onClick={handleGenerateInvoice}
                disabled={generatingInvoice}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Receipt className="w-3.5 h-3.5" /> {generatingInvoice ? 'Generating...' : 'Generate Invoice'}
              </button>
            )}
          </div>
        </div>

        {/* Telemetry Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase font-semibold">Deal Value</span>
            <strong className="text-brand-400 font-mono text-sm">₹{deal.value.toLocaleString('en-IN')}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase font-semibold">Gross Margin</span>
            <strong className="text-emerald-400 font-mono text-sm">{deal.marginPercent || 30.5}%</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase font-semibold">Win Probability</span>
            <strong className="text-slate-200 font-mono text-sm">{deal.probability}%</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase font-semibold">Blended Risk</span>
            <div className="mt-0.5">
              <RiskBadge riskScore={latestQuote?.blendedRiskScore || 0} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto text-xs font-semibold">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-3 transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-brand-500 text-brand-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">Deal Governance Summary</h3>
            <p className="text-slate-300 leading-relaxed">
              This deal is governed under <strong>{deal.account?.tier} Tier</strong> pricing rules. All quotations require automated blended discount evaluation across hardware and services lines.
            </p>

            {latestQuote && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Latest Quotation: {latestQuote.quoteNumber}</span>
                  <StatusBadge status={latestQuote.status} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-slate-400 text-[11px] pt-2 border-t border-slate-800">
                  <div>Subtotal: <strong className="text-white">₹{latestQuote.subtotal.toLocaleString('en-IN')}</strong></div>
                  <div>Discount: <strong className="text-amber-400">{latestQuote.discountPercent}%</strong></div>
                  <div>Total: <strong className="text-brand-400">₹{latestQuote.totalAmount.toLocaleString('en-IN')}</strong></div>
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white">Customer Portal Link</h3>
            <p className="text-slate-400 text-[11px]">
              Share this dedicated portal link with the client to view quotes, request line revisions, and counter terms without back-and-forth emails.
            </p>
            {latestQuote && (
              <a
                href={`/portal/${latestQuote.id}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-3 bg-brand-500/15 hover:bg-brand-500/25 text-brand-300 border border-brand-500/30 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Customer Portal View
              </a>
            )}
          </div>
        </div>
      )}

      {/* Quotes Tab */}
      {activeTab === 'quotes' && (
        <div className="space-y-4 text-xs">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white text-sm">Quotation History</h3>
            <button
              onClick={() => navigate(`/quotes/new?dealId=${deal.id}`)}
              className="px-3 py-1.5 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold rounded-lg shadow-glow flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Build New Revision
            </button>
          </div>

          {deal.quotes?.map((q) => (
            <div key={q.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    {q.quoteNumber} <StatusBadge status={q.status} />
                  </h4>
                  <span className="text-[11px] text-slate-400">Version {q.version} • Created {new Date(q.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total Amount</span>
                  <strong className="text-base font-mono font-bold text-brand-400">₹{q.totalAmount.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="pb-2">Product</th>
                    <th className="pb-2">Qty</th>
                    <th className="pb-2">Unit Price</th>
                    <th className="pb-2">Discount</th>
                    <th className="pb-2">Warehouse</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {q.items?.map((it) => (
                    <tr key={it.id}>
                      <td className="py-2 text-slate-200 font-semibold">{it.product?.name} ({it.billingModel})</td>
                      <td className="py-2 font-mono">{it.quantity}</td>
                      <td className="py-2 font-mono">₹{it.unitPrice.toLocaleString('en-IN')}</td>
                      <td className="py-2 font-mono text-amber-400">{it.discountPercent}%</td>
                      <td className="py-2 text-slate-300">{it.warehouse?.name || 'Auto Splitting'}</td>
                      <td className="py-2 font-mono text-right text-brand-300 font-bold">₹{it.totalAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Customer Negotiation notes if any */}
              {q.customerFeedback && (
                <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 text-[11px] text-purple-200">
                  <strong>Customer Counter Proposal / Feedback:</strong> {q.customerFeedback}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Approvals Tab */}
      {activeTab === 'approvals' && (
        <div className="space-y-4 text-xs">
          <h3 className="font-bold text-white text-sm">Discount Approval Governance</h3>
          {deal.approvals?.length === 0 ? (
            <p className="text-slate-400 py-4">No approval requests generated for this deal.</p>
          ) : (
            deal.approvals.map((appr) => (
              <div key={appr.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white">Discount Request: {appr.requestedDiscount}%</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Required Approver Role: <strong className="text-brand-300 font-mono">{appr.approverRole}</strong></p>
                  </div>
                  <StatusBadge status={appr.status} />
                </div>
                <p className="text-slate-300 text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {appr.reason}
                </p>
                {appr.comments && (
                  <p className="text-[11px] text-brand-300">
                    <strong>Approver Feedback:</strong> {appr.comments}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Contracts Tab */}
      {activeTab === 'contracts' && (
        <div className="space-y-4 text-xs">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white text-sm">Legal Contracts</h3>
            {latestContract?.status === 'APPROVED' && (
              <button
                onClick={async () => {
                  try {
                    await api.post(`/contracts/${latestContract.id}/sign`, {
                      signerName: deal.account?.name + ' Executive',
                    });
                    fetchDeal();
                  } catch (e) {
                    alert(e.message);
                  }
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-md"
              >
                Execute Electronic Signature
              </button>
            )}
          </div>

          {deal.contracts?.map((c) => (
            <div key={c.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">{c.contractNumber} - {c.title}</h4>
                  <span className="text-[11px] text-slate-400">Status: <StatusBadge status={c.status} /></span>
                </div>
                <strong className="font-mono text-brand-400 text-sm">₹{c.value.toLocaleString('en-IN')}</strong>
              </div>
              <pre className="p-3 rounded-xl bg-slate-950 text-slate-300 text-[11px] font-mono whitespace-pre-wrap border border-slate-800">
                {c.terms}
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-4 text-xs">
          <h3 className="font-bold text-white text-sm">Invoices & Payment Settlement</h3>
          {deal.invoices?.map((inv) => (
            <div key={inv.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">{inv.invoiceNumber}</h4>
                  <span className="text-[11px] text-slate-400">Due Date: {new Date(inv.dueDate).toLocaleDateString()}</span>
                </div>
                <StatusBadge status={inv.status} />
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono">
                <div>Total: <strong className="text-white">₹{inv.totalAmount.toLocaleString('en-IN')}</strong></div>
                <div>Paid: <strong className="text-emerald-400">₹{inv.amountPaid.toLocaleString('en-IN')}</strong></div>
                <div>Due: <strong className="text-rose-400">₹{inv.amountDue.toLocaleString('en-IN')}</strong></div>
              </div>

              {inv.amountDue > 0 && (
                <button
                  onClick={() => {
                    setTargetInvoice(inv);
                    setPaymentAmount(String(inv.amountDue));
                    setIsPaymentModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold rounded-lg shadow-glow"
                >
                  Record Payment
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Audit Trail Tab */}
      {activeTab === 'audit' && (
        <div className="space-y-3 text-xs">
          <h3 className="font-bold text-white text-sm">Immutable Deal Audit Log</h3>
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
            {deal.auditLogs?.map((log) => (
              <div key={log.id} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <strong className="text-brand-300 font-mono text-[11px]">{log.action}</strong>
                  <p className="text-[10px] text-slate-400">By {log.user?.email || 'System'}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contract Generation Modal */}
      <Modal isOpen={isContractModalOpen} onClose={() => setIsContractModalOpen(false)} title="Generate Legal Agreement">
        <div className="space-y-4 text-xs">
          <p className="text-slate-300">
            A binding legal contract will be created from the latest approved quotation and sent to <strong>Legal Review</strong>.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setIsContractModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">Cancel</button>
            <button onClick={handleCreateContract} disabled={submittingContract} className="px-4 py-2 bg-brand-500 text-slate-950 font-bold rounded-lg shadow-glow">
              {submittingContract ? 'Generating...' : 'Submit to Legal Review'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Payment Recording Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Record Invoice Payment">
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Payment Amount (₹) *</label>
            <input
              type="number"
              required
              max={targetInvoice?.amountDue}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Max payable amount: ₹{targetInvoice?.amountDue?.toLocaleString('en-IN')}</span>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="BANK_TRANSFER">Bank Wire / NEFT / RTGS</option>
              <option value="CREDIT_CARD">Corporate Credit Card</option>
              <option value="UPI">UPI Payment</option>
              <option value="CHECK">Commercial Check</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">Cancel</button>
            <button type="submit" disabled={submittingPayment} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg shadow-glow">
              {submittingPayment ? 'Processing...' : 'Settle Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
