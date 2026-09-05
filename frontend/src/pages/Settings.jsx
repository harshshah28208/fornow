import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Sliders, Users, Shield, CreditCard, Plus, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import { LoadingSpinner, ErrorAlert } from '../components/common/LoadingAndEmpty';
import { Modal } from '../components/common/Modal';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState('rules');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [org, setOrg] = useState(null);
  const [discountRules, setDiscountRules] = useState([]);
  const [users, setUsers] = useState([]);
  const [billing, setBilling] = useState(null);

  // New Rule Modal
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    customerTier: 'ALL',
    productCategory: 'ALL',
    maxRepDiscount: 5,
    maxManagerDiscount: 15,
    maxFinanceDiscount: 30,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [orgRes, rulesRes, usersRes, billRes] = await Promise.all([
        api.get('/settings/organization'),
        api.get('/settings/discount-rules'),
        api.get('/settings/users'),
        api.get('/settings/billing'),
      ]);
      setOrg(orgRes.data);
      setDiscountRules(rulesRes.data || []);
      setUsers(usersRes.data || []);
      setBilling(billRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRule = async (e) => {
    e.preventDefault();
    try {
      await api.post('/settings/discount-rules', ruleForm);
      setIsRuleModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed to create discount rule: ' + err.message);
    }
  };

  const handleUpgradePlan = async (planId) => {
    try {
      await api.post('/settings/billing/plan', { planId });
      alert(`Organization successfully upgraded to ${planId}`);
      fetchData();
    } catch (err) {
      alert('Upgrade error: ' + err.message);
    }
  };

  if (loading) return <LoadingSpinner message="Loading governance rules & settings..." />;
  if (error) return <ErrorAlert message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-brand-400" /> Platform Governance & Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure discount authorization chains, user access roles, and organizational billing.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-3 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 px-3 transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'rules' ? 'border-brand-500 text-brand-400 font-bold' : 'border-transparent text-slate-400'
          }`}
        >
          <Sliders className="w-4 h-4" /> Discount Governance Rules
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-3 transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'users' ? 'border-brand-500 text-brand-400 font-bold' : 'border-transparent text-slate-400'
          }`}
        >
          <Users className="w-4 h-4" /> Users & Permissions
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`pb-3 px-3 transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'billing' ? 'border-brand-500 text-brand-400 font-bold' : 'border-transparent text-slate-400'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Organization Subscription & Plans
        </button>
      </div>

      {/* Discount Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white">Configurable Discount Ceilings</h3>
              <p className="text-xs text-slate-400">Rules applied dynamically when sales reps build quotations.</p>
            </div>
            <button
              onClick={() => setIsRuleModalOpen(true)}
              className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold rounded-lg text-xs shadow-glow flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Rule
            </button>
          </div>

          <div className="space-y-3">
            {discountRules.map((rule) => (
              <div
                key={rule.id}
                className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">{rule.name}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span>Customer Tier: <strong className="text-slate-200">{rule.customerTier}</strong></span>
                    <span>Category: <strong className="text-slate-200">{rule.productCategory}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-center">
                    <span className="text-slate-400 text-[10px] block font-sans">Rep Limit</span>
                    <strong className="text-emerald-400 font-bold">≤ {rule.maxRepDiscount}%</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-center">
                    <span className="text-slate-400 text-[10px] block font-sans">Manager Limit</span>
                    <strong className="text-amber-400 font-bold">≤ {rule.maxManagerDiscount}%</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-center">
                    <span className="text-slate-400 text-[10px] block font-sans">Finance Limit</span>
                    <strong className="text-rose-400 font-bold">≤ {rule.maxFinanceDiscount}%</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white">Active Team Members & Role Assignments</h3>
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 bg-slate-950/60 border-b border-slate-800 uppercase font-semibold">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">System Role</th>
                  <th className="p-4">Historical Avg Discount</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-bold text-white">{u.firstName} {u.lastName}</td>
                    <td className="p-4 text-slate-300 font-mono text-[11px]">{u.email}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-[10px] font-mono font-bold">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-300">{u.historicalAvgDiscount || 5.0}%</td>
                    <td className="p-4 text-right text-emerald-400 font-semibold">Active</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6 text-xs">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-white">Current Organization Tier: {billing?.currentPlan}</h3>
            <p className="text-slate-300">
              Subscription Status: <strong className="text-emerald-400 font-mono">ACTIVE</strong> • Active Users: <strong>{billing?.activeUsersCount} / {billing?.maxUsers}</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {billing?.availablePlans?.map((plan) => (
              <div
                key={plan.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                  billing?.currentPlan === plan.id
                    ? 'bg-brand-950/20 border-brand-500/50 shadow-glow'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div>
                  <h4 className="text-base font-bold text-white">{plan.name}</h4>
                  <strong className="text-xl font-mono text-brand-400 block mt-2">
                    ₹{plan.price.toLocaleString('en-IN')}<span className="text-xs text-slate-400">/mo</span>
                  </strong>
                  <ul className="mt-4 space-y-2 text-slate-300">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleUpgradePlan(plan.id)}
                  disabled={billing?.currentPlan === plan.id}
                  className={`w-full py-2 rounded-xl font-bold transition-all ${
                    billing?.currentPlan === plan.id
                      ? 'bg-slate-800 text-slate-400 cursor-default'
                      : 'bg-brand-500 hover:bg-brand-400 text-slate-950 shadow-glow'
                  }`}
                >
                  {billing?.currentPlan === plan.id ? 'Current Plan' : 'Select Plan'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Rule Modal */}
      <Modal isOpen={isRuleModalOpen} onClose={() => setIsRuleModalOpen(false)} title="Create Discount Governance Rule">
        <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Rule Name *</label>
            <input
              type="text"
              required
              value={ruleForm.name}
              onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Customer Tier</label>
              <select
                value={ruleForm.customerTier}
                onChange={(e) => setRuleForm({ ...ruleForm, customerTier: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="ALL">All Tiers</option>
                <option value="GOLD">Gold</option>
                <option value="SILVER">Silver</option>
                <option value="BRONZE">Bronze</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Product Category</label>
              <select
                value={ruleForm.productCategory}
                onChange={(e) => setRuleForm({ ...ruleForm, productCategory: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="ALL">All Categories</option>
                <option value="HARDWARE">Hardware</option>
                <option value="SERVICES">Services</option>
                <option value="SUBSCRIPTION">Subscription</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Rep Max %</label>
              <input
                type="number"
                value={ruleForm.maxRepDiscount}
                onChange={(e) => setRuleForm({ ...ruleForm, maxRepDiscount: parseFloat(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Manager Max %</label>
              <input
                type="number"
                value={ruleForm.maxManagerDiscount}
                onChange={(e) => setRuleForm({ ...ruleForm, maxManagerDiscount: parseFloat(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Finance Max %</label>
              <input
                type="number"
                value={ruleForm.maxFinanceDiscount}
                onChange={(e) => setRuleForm({ ...ruleForm, maxFinanceDiscount: parseFloat(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button type="button" onClick={() => setIsRuleModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-brand-500 text-slate-950 font-bold rounded-lg shadow-glow">
              Save Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
