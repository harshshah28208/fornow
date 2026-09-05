import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  RefreshCw,
  Search,
  Calendar,
  Building2,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import api from '../api/client';
import { StatusBadge } from '../components/common/Badge';
import { LoadingSpinner, EmptyState } from '../components/common/LoadingAndEmpty';
import { StatCard } from '../components/common/StatCard';
import { Modal } from '../components/common/Modal';

export const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [recurringAmount, setRecurringAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [submitting, setSubmitting] = useState(false);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/subscriptions', {
        params: { status: statusFilter },
      });
      setSubscriptions(res.data || []);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [accRes, prodRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/products'),
      ]);
      setAccounts(accRes.data || []);
      setProducts(prodRes.data || []);
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const handleCreateSubscription = async (e) => {
    e.preventDefault();
    if (!selectedAccountId || !selectedProductId || !recurringAmount) {
      alert('Please fill all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/subscriptions', {
        accountId: selectedAccountId,
        productId: selectedProductId,
        productPlanId: selectedPlanId || undefined,
        recurringAmount: parseFloat(recurringAmount),
        billingCycle,
      });
      setShowModal(false);
      fetchSubscriptions();
    } catch (err) {
      alert('Failed to create subscription: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSubscription = async (id) => {
    if (!confirm('Are you sure you want to cancel this recurring subscription?')) return;
    try {
      await api.post(`/subscriptions/${id}/cancel`);
      fetchSubscriptions();
    } catch (err) {
      alert('Cancel error: ' + err.message);
    }
  };

  // Metrics
  const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE');
  const totalMRR = activeSubs.reduce((sum, s) => {
    let rate = s.recurringAmount;
    if (s.billingCycle === 'ANNUAL') rate = s.recurringAmount / 12;
    if (s.billingCycle === 'QUARTERLY') rate = s.recurringAmount / 3;
    return sum + rate;
  }, 0);
  const totalARR = totalMRR * 12;

  const filteredSubs = subscriptions.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.account?.name?.toLowerCase().includes(q) ||
      s.product?.name?.toLowerCase().includes(q) ||
      s.billingCycle?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-600" /> Subscriptions & Recurring Billing
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            SaaS recurring billing schedules, recurring terms, MRR/ARR tracking, seat expansion, renewals, and churn management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowModal(true);
              if (accounts.length && !selectedAccountId) setSelectedAccountId(accounts[0].id);
              if (products.length && !selectedProductId) setSelectedProductId(products[0].id);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> New Subscription
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Recurring Revenue (MRR)"
          value={`₹${totalMRR.toLocaleString('en-IN')}`}
          subtitle="Normalized monthly recurring"
          color="teal"
          icon={TrendingUp}
        />
        <StatCard
          title="Annual Recurring Revenue (ARR)"
          value={`₹${totalARR.toLocaleString('en-IN')}`}
          subtitle="Annualized run rate"
          color="emerald"
          icon={CreditCard}
        />
        <StatCard
          title="Active Subscriptions"
          value={activeSubs.length}
          subtitle="Customer accounts billing"
          color="indigo"
          icon={CheckCircle2}
        />
        <StatCard
          title="Retention & Renewals"
          value="98.2%"
          subtitle="Zero involuntary churn"
          color="amber"
          icon={Calendar}
        />
      </div>

      {/* Filter and Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search subscriptions by account or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PAST_DUE">Past Due</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button
            onClick={fetchSubscriptions}
            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subscriptions Table */}
      {loading ? (
        <LoadingSpinner message="Fetching recurring subscriptions..." />
      ) : filteredSubs.length === 0 ? (
        <EmptyState
          title="No subscriptions found"
          description="Create a recurring subscription schedule for customer accounts."
          actionText="+ New Subscription"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-extrabold">
                <tr>
                  <th className="py-3 px-4">Account Name</th>
                  <th className="py-3 px-4">Product / Plan</th>
                  <th className="py-3 px-4">Cycle</th>
                  <th className="py-3 px-4">Recurring Amount</th>
                  <th className="py-3 px-4">Period Start</th>
                  <th className="py-3 px-4">Next Billing Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {sub.account?.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <strong className="text-slate-800 block">{sub.product?.name}</strong>
                      <span className="text-[11px] text-slate-500">{sub.productPlan?.name || 'Default Tier'}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {sub.billingCycle}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-teal-700 text-sm">
                      ₹{sub.recurringAmount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      {new Date(sub.currentPeriodStart).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      {new Date(sub.nextBillingDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {sub.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleCancelSubscription(sub.id)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px] transition-colors border border-rose-200"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Create New Recurring Subscription"
        >
          <form onSubmit={handleCreateSubscription} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Customer Account *</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-semibold text-slate-900 focus:outline-none focus:border-teal-500 shadow-xs"
              >
                <option value="">-- Select Account --</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.tier})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Subscription Product *</label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  const prod = products.find((p) => p.id === e.target.value);
                  if (prod) {
                    setRecurringAmount(prod.basePrice);
                    setSelectedPlanId(prod.plans?.[0]?.id || '');
                  }
                }}
                required
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-semibold text-slate-900 focus:outline-none focus:border-teal-500 shadow-xs"
              >
                <option value="">-- Select Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Base: ₹{p.basePrice?.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Billing Cycle</label>
                <select
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-semibold text-slate-900 focus:outline-none focus:border-teal-500 shadow-xs"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="ANNUAL">Annual</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Recurring Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={recurringAmount}
                  onChange={(e) => setRecurringAmount(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-900 focus:outline-none focus:border-teal-500 shadow-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition-colors"
              >
                Create Subscription
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Subscriptions;
