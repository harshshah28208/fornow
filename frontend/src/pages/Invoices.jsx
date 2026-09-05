import React, { useState, useEffect } from 'react';
import { Receipt, DollarSign, CreditCard, CheckCircle2, Clock, Building2, Filter } from 'lucide-react';
import api from '../api/client';
import { StatusBadge } from '../components/common/Badge';
import { LoadingSpinner, EmptyState, ErrorAlert } from '../components/common/LoadingAndEmpty';
import { Modal } from '../components/common/Modal';

export const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Payment Recording Modal
  const [targetInvoice, setTargetInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [reference, setReference] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/invoices?status=${statusFilter}`);
      setInvoices(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!targetInvoice || !paymentAmount) return;
    setSubmittingPayment(true);
    try {
      await api.post('/invoices/payment', {
        invoiceId: targetInvoice.id,
        amount: parseFloat(paymentAmount),
        paymentMethod,
        reference,
      });
      setTargetInvoice(null);
      setPaymentAmount('');
      setReference('');
      fetchInvoices();
    } catch (err) {
      alert('Payment recording failed: ' + err.message);
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-brand-600" /> Invoicing & Payment Settlements
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Hybrid billing invoices, partial payment reconciliation, and real-time revenue collection.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-brand-500 font-semibold shadow-sm"
          >
            <option value="ALL">All Invoices</option>
            <option value="ISSUED">Issued</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid in Full</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching invoices..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={fetchInvoices} />
      ) : invoices.length === 0 ? (
        <EmptyState
          title="No invoices found"
          description="Invoices are generated from approved contracts and won deals."
        />
      ) : (
        <div className="space-y-4">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-slate-900 font-mono">{inv.invoiceNumber}</h3>
                    <StatusBadge status={inv.status} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-600 mt-1.5">
                    <span>Account: <strong className="text-slate-800">{inv.account?.name}</strong></span>
                    <span>Due Date: <strong className="text-slate-800 font-mono">{new Date(inv.dueDate).toLocaleDateString()}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {inv.amountDue > 0 && (
                    <button
                      onClick={() => {
                        setTargetInvoice(inv);
                        setPaymentAmount(String(inv.amountDue));
                        setReference(`PAY-TXN-${Math.floor(100000 + Math.random() * 900000)}`);
                      }}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Record Payment
                    </button>
                  )}
                </div>
              </div>

              {/* Financial Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block font-sans font-medium">Subtotal</span>
                  <strong className="text-slate-900 text-sm">₹{inv.subtotal.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-sans font-medium">Total Billed</span>
                  <strong className="text-slate-900 text-sm">₹{inv.totalAmount.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span className="text-emerald-700 text-[10px] block font-sans font-medium">Amount Paid</span>
                  <strong className="text-emerald-700 font-bold text-sm">₹{inv.amountPaid.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-sans font-medium">Remaining Due</span>
                  <strong className={inv.amountDue > 0 ? 'text-rose-700 font-bold text-sm' : 'text-slate-600 font-bold text-sm'}>
                    ₹{inv.amountDue.toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              {/* Payments History */}
              {inv.payments?.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Payment Transactions</span>
                  <div className="space-y-1.5">
                    {inv.payments.map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-slate-800 font-semibold">{p.paymentNumber} ({p.paymentMethod})</span>
                          {p.reference && <span className="text-slate-500 text-[10px]">Ref: {p.reference}</span>}
                        </div>
                        <strong className="text-emerald-700 font-bold">+₹{p.amount.toLocaleString('en-IN')}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payment Recording Modal */}
      <Modal
        isOpen={!!targetInvoice}
        onClose={() => setTargetInvoice(null)}
        title={`Record Payment for ${targetInvoice?.invoiceNumber}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <p className="text-slate-700">
            Client: <strong className="text-slate-900">{targetInvoice?.account?.name}</strong> • Total Billed: ₹{targetInvoice?.totalAmount?.toLocaleString('en-IN')} • Current Due: ₹{targetInvoice?.amountDue?.toLocaleString('en-IN')}
          </p>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Payment Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              required
              max={targetInvoice?.amountDue}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 font-mono focus:outline-none focus:border-brand-500 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-brand-500 shadow-sm"
            >
              <option value="BANK_TRANSFER">Bank Wire / RTGS / NEFT</option>
              <option value="CREDIT_CARD">Corporate Credit Card</option>
              <option value="UPI">UPI Digital Payment</option>
              <option value="CHECK">Commercial Check</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Reference / Transaction ID</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 font-mono focus:outline-none focus:border-brand-500 shadow-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setTargetInvoice(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingPayment}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-all"
            >
              {submittingPayment ? 'Processing...' : 'Confirm & Settle Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
