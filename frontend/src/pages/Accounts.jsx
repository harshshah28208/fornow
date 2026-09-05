import React, { useState, useEffect } from 'react';
import { Building2, Plus, Phone, Globe, DollarSign, Users, ExternalLink, ShieldCheck } from 'lucide-react';
import api from '../api/client';
import { TierBadge } from '../components/common/Badge';
import { LoadingSpinner, EmptyState, ErrorAlert } from '../components/common/LoadingAndEmpty';
import { Modal } from '../components/common/Modal';

export const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    tier: 'GOLD',
    segment: 'ENTERPRISE',
    phone: '',
    website: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounts');
      setAccounts(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/accounts', formData);
      setIsModalOpen(false);
      setFormData({ name: '', industry: '', tier: 'GOLD', segment: 'ENTERPRISE', phone: '', website: '' });
      fetchAccounts();
    } catch (err) {
      alert('Failed to create account: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand-400" /> Account 360 & Customer Tiers
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Maintain customer tier classifications (Bronze, Silver, Gold) and discount ceilings.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs rounded-xl shadow-glow flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading customer accounts..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={fetchAccounts} />
      ) : accounts.length === 0 ? (
        <EmptyState title="No accounts yet" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-brand-500/40 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{acc.name}</h3>
                    <p className="text-xs text-slate-400">{acc.industry || 'Enterprise Client'}</p>
                  </div>
                  <TierBadge tier={acc.tier} />
                </div>

                <div className="space-y-1 text-xs text-slate-400 pt-1">
                  {acc.website && (
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <a href={acc.website} target="_blank" rel="noreferrer" className="text-brand-400 hover:underline truncate">
                        {acc.website}
                      </a>
                    </div>
                  )}
                  {acc.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{acc.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-xs font-mono">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block font-sans">Total Revenue</span>
                  <strong className="text-emerald-400 font-bold">₹{((acc.totalRevenue || 0) / 100000).toFixed(2)} L</strong>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block font-sans">Active Deals</span>
                  <strong className="text-brand-400 font-bold">{acc.activeDealsCount || 0} Open</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Customer Account">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Company / Account Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Customer Tier</label>
              <select
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="GOLD">Gold (15% Max Ceiling)</option>
                <option value="SILVER">Silver (10% Max Ceiling)</option>
                <option value="BRONZE">Bronze (5% Max Ceiling)</option>
                <option value="PLATINUM">Platinum (20% Max Ceiling)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Industry</label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-brand-500 text-slate-950 font-bold rounded-lg shadow-glow">
              {submitting ? 'Saving...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
