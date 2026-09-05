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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand-600" /> Account 360 & Customer Tiers
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Maintain customer tier classifications (Bronze, Silver, Gold, Platinum) and discount ceilings.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
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
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-brand-400 transition-all space-y-4 flex flex-col justify-between shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{acc.name}</h3>
                    <p className="text-xs text-slate-500">{acc.industry || 'Enterprise Client'}</p>
                  </div>
                  <TierBadge tier={acc.tier} />
                </div>

                <div className="space-y-1 text-xs text-slate-600 pt-1">
                  {acc.website && (
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <a href={acc.website} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline truncate">
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

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs font-mono">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[10px] block font-sans font-medium">Total Revenue</span>
                  <strong className="text-emerald-700 font-bold text-sm">₹{((acc.totalRevenue || 0) / 100000).toFixed(2)} L</strong>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[10px] block font-sans font-medium">Active Deals</span>
                  <strong className="text-brand-700 font-bold text-sm">{acc.activeDealsCount || 0} Open</strong>
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
            <label className="block text-slate-700 font-semibold mb-1">Company / Account Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-brand-500 shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Customer Tier</label>
              <select
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-brand-500 shadow-sm"
              >
                <option value="GOLD">Gold (15% Max Ceiling)</option>
                <option value="SILVER">Silver (10% Max Ceiling)</option>
                <option value="BRONZE">Bronze (5% Max Ceiling)</option>
                <option value="PLATINUM">Platinum (20% Max Ceiling)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Industry</label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-brand-500 shadow-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg shadow-sm">
              {submitting ? 'Saving...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
