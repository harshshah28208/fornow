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

  if (loading) return <LoadingSpinner message="Assembling complete Deal 360 lifecycle from PostgreSQL..." />;
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
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{deal.title}</h1>
              <StageBadge stage={deal.stage} />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
              <span className="flex items-center gap-1.5 text-slate-800 font-bold">
                <Building2 className="w-4 h-4 text-teal-600" /> {deal.account?.name}
              </span>
              {deal.account?.tier && <TierBadge tier={deal.account.tier} />}
              <span className="flex items-center gap-1 font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" /> Owner: <strong className="text-slate-700">{deal.owner?.firstName} {deal.owner?.lastName}</strong>
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate(`/quotes/new?dealId=${deal.id}`)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Quote Builder
            </button>

            {latestQuote && ['APPROVED', 'ACCEPTED'].includes(latestQuote.status) && !latestContract && (
              <button
                onClick={() => setIsContractModalOpen(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <FileSignature className="w-3.5 h-3.5" /> Generate Contract
              </button>
            )}

            {latestContract?.status === 'SIGNED' && deal.invoices?.length === 0 && (
              <button
                onClick={handleGenerateInvoice}
                disabled={generatingInvoice}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <Receipt className="w-3.5 h-3.5" /> {generatingInvoice ? 'Generating...' : 'Generate Invoice'}
              </button>
            )}
          </div>
        </div>

        {/* Telemetry Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[10px] block uppercase font-bold">Deal Value</span>
            <strong className="text-teal-700 font-mono text-base font-black">₹{deal.value.toLocaleString('en-IN')}</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[10px] block uppercase font-bold">Gross Margin</span>
            <strong className="text-emerald-700 font-mono text-base font-black">{deal.marginPercent || 30.5}%</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[10px] block uppercase font-bold">Win Probability</span>
            <strong className="text-slate-900 font-mono text-base font-black">{deal.probability}%</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[10px] block uppercase font-bold">Blended Risk</span>
            <div className="mt-0.5">
              <RiskBadge riskScore={latestQuote?.blendedRiskScore || 0} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto text-xs font-bold">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-3 transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-teal-600 text-teal-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-900">Deal Governance Summary</h3>
            <p className="text-slate-600 leading-relaxed font-medium">
              This deal is governed under <strong>{deal.account?.tier} Tier</strong> pricing discipline. All quotation lines are dynamically evaluated against category ceilings.
            </p>

            {latestQuote && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Latest Quotation: {latestQuote.quoteNumber}</span>
                  <StatusBadge status={latestQuote.status} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-slate-600 text-[11px] pt-2 border-t border-slate-200">
                  <div>Subtotal: <strong className="text-slate-900">₹{latestQuote.subtotal.toLocaleString('en-IN')}</strong></div>
                  <div>Discount: <strong className="text-amber-800 font-bold">{latestQuote.discountPercent}%</strong></div>
                  <div>Total: <strong className="text-teal-700 font-bold">₹{latestQuote.totalAmount.toLocaleString('en-IN')}</strong></div>
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-900">Customer Negotiation Portal</h3>
            <p className="text-slate-500 text-[11px]">
              Share this dedicated portal link with the client so they can view the live quote, propose counter-offers, and sign off online.
            </p>
            {latestQuote && (
              <a
                href={`/portal/${latestQuote.quoteNumber}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Customer Portal View
              </a>
            )}
          </div>
        </div>
      )}

      {/* Tab: Quotes */}
      {activeTab === 'quotes' && (
        <div className="space-y-4 text-xs">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-slate-900 text-sm">Quotation History</h3>
            <button
              onClick={() => navigate(`/quotes/new?dealId=${deal.id}`)}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Build New Revision
            </button>
          </div>

          {deal.quotes?.map((q) => (
            <div key={q.id} className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {q.quoteNumber} <StatusBadge status={q.status} />
                  </h4>
                  <span className="text-[11px] text-slate-500">Version {q.version} • Created {new Date(q.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block font-semibold">Total Amount</span>
                  <strong className="text-lg font-mono font-bold text-teal-700">₹{q.totalAmount.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200 font-semibold">
                    <th className="pb-2">Product</th>
                    <th className="pb-2">Qty</th>
                    <th className="pb-2">Unit Price</th>
                    <th className="pb-2">Discount</th>
                    <th className="pb-2">Warehouse</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {q.items?.map((it) => (
                    <tr key={it.id}>
                      <td className="py-2.5 text-slate-800 font-semibold">{it.product?.name} ({it.billingModel})</td>
                      <td className="py-2.5 font-mono">{it.quantity}</td>
                      <td className="py-2.5 font-mono">₹{it.unitPrice.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 font-mono font-bold text-amber-800">{it.discountPercent}%</td>
                      <td className="py-2.5 text-slate-600">{it.warehouse?.name || 'Auto Split Allocation'}</td>
                      <td className="py-2.5 font-mono text-right text-teal-700 font-bold">₹{it.totalAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Customer Negotiation notes if any */}
              {q.customerFeedback && (
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-[11px] text-purple-900">
                  <strong>Customer Counter Proposal / Feedback:</strong> {q.customerFeedback}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Approvals */}
      {activeTab === 'approvals' && (
        <div className="space-y-4 text-xs">
          <h3 className="font-extrabold text-slate-900 text-sm">Discount Approval Governance</h3>
          {deal.approvals?.length === 0 ? (
            <p className="text-slate-500 py-4">No approval requests generated for this deal.</p>
          ) : (
            deal.approvals.map((appr) => (
              <div key={appr.id} className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">Discount Request: {appr.requestedDiscount}%</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Required Approver Role: <strong className="text-purple-800 font-mono font-bold">{appr.approverRole}</strong></p>
                  </div>
                  <StatusBadge status={appr.status} />
                </div>
                <p className="text-slate-700 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium">
                  {appr.reason}
                </p>
                {appr.comments && (
                  <p className="text-[11px] text-teal-800 font-semibold">
                    <strong>Approver Feedback:</strong> {appr.comments}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Contracts */}
      {activeTab === 'contracts' && (
        <div className="space-y-4 text-xs">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-slate-900 text-sm">Legal Contracts</h3>
            {latestContract?.status === 'APPROVED' && (
              <button
                onClick={async () => {
                  try {
                    await api.post(`/contracts/${latestContract.id}/sign`, {
                      signerName: deal.account?.name + ' Executive Signatory',
                    });
                    fetchDeal();
                  } catch (e) {
                    alert(e.message);
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
              >
                Execute Electronic Signature
              </button>
            )}
          </div>

          {deal.contracts?.map((c) => (
            <div key={c.id} className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{c.contractNumber} - {c.title}</h4>
                  <span className="text-[11px] text-slate-500">Status: <StatusBadge status={c.status} /></span>
                </div>
                <strong className="font-mono text-teal-700 text-sm">₹{c.value.toLocaleString('en-IN')}</strong>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-50 text-slate-700 text-[11px] font-mono whitespace-pre-wrap border border-slate-200 leading-relaxed">
                {c.terms}
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Invoices */}
      {activeTab === 'invoices' && (
        <div className="space-y-4 text-xs">
          <h3 className="font-extrabold text-slate-900 text-sm">Invoices & Payment Settlement</h3>
          {deal.invoices?.map((inv) => (
            <div key={inv.id} className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm font-mono">{inv.invoiceNumber}</h4>
                  <span className="text-[11px] text-slate-500">Due Date: {new Date(inv.dueDate).toLocaleDateString()}</span>
                </div>
                <StatusBadge status={inv.status} />
              </div>

              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs">
                <div>Total: <strong className="text-slate-900">₹{inv.totalAmount.toLocaleString('en-IN')}</strong></div>
                <div>Paid: <strong className="text-emerald-700 font-bold">₹{inv.amountPaid.toLocaleString('en-IN')}</strong></div>
                <div>Due: <strong className="text-rose-700 font-bold">₹{inv.amountDue.toLocaleString('en-IN')}</strong></div>
              </div>

              {inv.amountDue > 0 && (
                <button
                  onClick={() => {
                    setTargetInvoice(inv);
                    setPaymentAmount(String(inv.amountDue));
                    setIsPaymentModalOpen(true);
                  }}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Record Payment
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Audit */}
      {activeTab === 'audit' && (
        <div className="space-y-3 text-xs">
          <h3 className="font-extrabold text-slate-900 text-sm">Immutable Deal Audit Log</h3>
          <div className="glass-panel p-4 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-xs">
            {deal.auditLogs?.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <strong className="text-teal-800 font-mono text-xs">{log.action}</strong>
                  <p className="text-[10px] text-slate-500">By {log.user?.email || 'System Engine'}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contract Generation Modal */}
      <Modal isOpen={isContractModalOpen} onClose={() => setIsContractModalOpen(false)} title="Generate Legal Agreement">
        <div className="space-y-4 text-xs">
          <p className="text-slate-700">
            A binding legal contract will be created from the latest approved quotation and sent to <strong>Legal Review</strong>.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setIsContractModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
            <button onClick={handleCreateContract} disabled={submittingContract} className="px-4 py-2 bg-teal-600 text-white font-bold rounded-xl shadow-sm">
              {submittingContract ? 'Generating...' : 'Submit to Legal Review'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Payment Recording Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Record Invoice Payment">
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Payment Amount (₹) *</label>
            <input
              type="number"
              required
              max={targetInvoice?.amountDue}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-teal-600 font-mono"
            />
            <span className="text-[10px] text-slate-500 mt-1 block font-medium">Max payable amount: ₹{targetInvoice?.amountDue?.toLocaleString('en-IN')}</span>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-teal-600 font-medium"
            >
              <option value="BANK_TRANSFER">Bank Wire / NEFT / RTGS</option>
              <option value="CREDIT_CARD">Corporate Credit Card</option>
              <option value="UPI">UPI Payment</option>
              <option value="CHECK">Commercial Check</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button>
            <button type="submit" disabled={submittingPayment} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm">
              {submittingPayment ? 'Processing...' : 'Settle Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
