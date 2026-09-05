import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Building2, User, ArrowRight, DollarSign } from 'lucide-react';
import api from '../api/client';
import { StageBadge, TierBadge } from '../components/common/Badge';
import { LoadingSpinner, EmptyState, ErrorAlert } from '../components/common/LoadingAndEmpty';
import { Modal } from '../components/common/Modal';

export const Deals = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');

  // New Deal Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    accountId: '',
    value: '',
    stage: 'OPPORTUNITY',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const [dealsRes, accRes] = await Promise.all([
        api.get(`/deals?search=${search}&stage=${stageFilter}`),
        api.get('/accounts'),
      ]);
      setDeals(dealsRes.data || []);
      setAccounts(accRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, [stageFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDeals();
  };

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.accountId) {
      alert('Please fill title and select account');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/deals', formData);
      setIsModalOpen(false);
      setFormData({ title: '', accountId: '', value: '', stage: 'OPPORTUNITY' });
      navigate(`/deals/${res.data.id}`);
    } catch (err) {
      alert('Failed to create deal: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Deals 360 Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track deal lifecycles, configure quotations, and monitor revenue conversion.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs rounded-xl shadow-glow flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" /> Create Deal
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[260px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search deals or accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          />
        </form>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Stage:
          </span>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Stages</option>
            <option value="LEAD">Lead</option>
            <option value="OPPORTUNITY">Opportunity</option>
            <option value="QUOTE_DRAFT">Quote Draft</option>
            <option value="APPROVAL_REQUIRED">Approval Required</option>
            <option value="APPROVED">Approved</option>
            <option value="CONTRACT_REVIEW">Legal Review</option>
            <option value="CLOSED_WON">Closed Won</option>
            <option value="CLOSED_LOST">Closed Lost</option>
          </select>
        </div>
      </div>

      {/* Deals Table */}
      {loading ? (
        <LoadingSpinner message="Fetching deals..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={fetchDeals} />
      ) : deals.length === 0 ? (
        <EmptyState
          title="No deals found"
          description="Create a deal or convert a lead to begin building quotations."
          actionButton={
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-brand-500 text-slate-950 font-bold text-xs rounded-xl shadow-glow"
            >
              Create Deal
            </button>
          }
        />
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">Deal Title</th>
                <th className="px-6 py-4">Account / Tier</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4">Stage</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {deals.map((deal) => (
                <tr
                  key={deal.id}
                  onClick={() => navigate(`/deals/${deal.id}`)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-bold text-white text-sm hover:text-brand-300 transition-colors">
                      {deal.title}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Last active: {new Date(deal.lastActivityAt || deal.updatedAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-200">{deal.account?.name}</span>
                      {deal.account?.tier && <TierBadge tier={deal.account.tier} />}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-brand-400 text-sm">
                    ₹{(deal.value / 100000).toFixed(2)} Lakhs
                  </td>
                  <td className="px-6 py-4">
                    <StageBadge stage={deal.stage} />
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {deal.owner?.firstName} {deal.owner?.lastName}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1 text-brand-400 font-semibold hover:underline">
                      Inspect 360 <ArrowRight className="w-3 h-3" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Deal Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Deal">
        <form onSubmit={handleCreateDeal} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Deal Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Enterprise Cloud & Hardware Upgrade"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Target Account *</label>
              <select
                required
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="">Select Account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.tier})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Estimated Value (₹)</label>
              <input
                type="number"
                placeholder="500000"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold rounded-lg shadow-glow"
            >
              {submitting ? 'Creating...' : 'Create & Open Deal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
