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
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-brand-600" /> Platform Governance & Settings
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Configure discount authorization chains, user access roles, and organizational billing.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-3 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 px-3 transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'rules' ? 'border-brand-600 text-brand-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" /> Discount Governance Rules
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-3 transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'users' ? 'border-brand-600 text-brand-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Users & Permissions
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`pb-3 px-3 transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'billing' ? 'border-brand-600 text-brand-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
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
              <h3 className="text-sm font-bold text-slate-900">Configurable Discount Ceilings</h3>
              <p className="text-xs text-slate-600">Rules applied dynamically when sales reps build quotations.</p>
            </div>
            <button
              onClick={() => setIsRuleModalOpen(true)}
              className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Rule
            </button>
          </div>

          <div className="space-y-3">
            {discountRules.map((rule) => (
              <div
                key={rule.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-sm"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{rule.name}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                    <span>Customer Tier: <strong className="text-slate-800">{rule.customerTier}</strong></span>
                    <span>Category: <strong className="text-slate-800">{rule.productCategory}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                    <span className="text-emerald-800 text-[10px] block font-sans font-medium">Rep Limit</span>
                    <strong className="text-emerald-700 font-bold">≤ {rule.maxRepDiscount}%</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-center">
                    <span className="text-amber-800 text-[10px] block font-sans font-medium">Manager Limit</span>
                    <strong className="text-amber-700 font-bold">≤ {rule.maxManagerDiscount}%</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-center">
                    <span className="text-rose-800 text-[10px] block font-sans font-medium">Finance Limit</span>
                    <strong className="text-rose-700 font-bold">≤ {rule.maxFinanceDiscount}%</strong>
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
          <h3 className="text-sm font-bold text-slate-900">Active Team Members & Role Assignments</h3>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-600 bg-slate-50 border-b border-slate-200 uppercase font-semibold">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">System Role</th>
                  <th className="p-4">Historical Avg Discount</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{u.firstName} {u.lastName}</td>
                    <td className="p-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-[10px] font-mono font-bold">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-800">{u.historicalAvgDiscount || 5.0}%</td>
                    <td className="p-4 text-right text-emerald-700 font-semibold">Active</td>
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
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Current Organization Tier: {billing?.currentPlan}</h3>
            <p className="text-slate-700">
              Subscription Status: <strong className="text-emerald-700 font-mono">ACTIVE</strong> • Active Users: <strong className="text-slate-900">{billing?.activeUsersCount} / {billing?.maxUsers}</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {billing?.availablePlans?.map((plan) => (
              <div
                key={plan.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 shadow-sm ${
                  billing?.currentPlan === plan.id
                    ? 'bg-brand-50/50 border-brand-500'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <h4 className="text-base font-bold text-slate-900">{plan.name}</h4>
                  <strong className="text-xl font-mono text-brand-700 block mt-2">
                    ₹{plan.price.toLocaleString('en-IN')}<span className="text-xs text-slate-500 font-sans font-normal">/mo</span>
                  </strong>
                  <ul className="mt-4 space-y-2 text-slate-700">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleUpgradePlan(plan.id)}
                  disabled={billing?.currentPlan === plan.id}
                  className={`w-full py-2 rounded-xl font-bold transition-all text-xs ${
                    billing?.currentPlan === plan.id
                      ? 'bg-slate-100 text-slate-500 cursor-default border border-slate-200'
                      : 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm'
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
            <label className="block text-slate-700 font-semibold mb-1">Rule Name *</label>
            <input
              type="text"
              required
              value={ruleForm.name}
              onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-brand-500 shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Customer Tier</label>
              <select
                value={ruleForm.customerTier}
                onChange={(e) => setRuleForm({ ...ruleForm, customerTier: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-brand-500 shadow-sm"
              >
                <option value="ALL">All Tiers</option>
                <option value="GOLD">Gold</option>
                <option value="SILVER">Silver</option>
                <option value="BRONZE">Bronze</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Product Category</label>
              <select
                value={ruleForm.productCategory}
                onChange={(e) => setRuleForm({ ...ruleForm, productCategory: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-brand-500 shadow-sm"
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
              <label className="block text-slate-700 font-semibold mb-1">Rep Max %</label>
              <input
                type="number"
                value={ruleForm.maxRepDiscount}
                onChange={(e) => setRuleForm({ ...ruleForm, maxRepDiscount: parseFloat(e.target.value) })}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono shadow-sm"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Manager Max %</label>
              <input
                type="number"
                value={ruleForm.maxManagerDiscount}
                onChange={(e) => setRuleForm({ ...ruleForm, maxManagerDiscount: parseFloat(e.target.value) })}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono shadow-sm"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Finance Max %</label>
              <input
                type="number"
                value={ruleForm.maxFinanceDiscount}
                onChange={(e) => setRuleForm({ ...ruleForm, maxFinanceDiscount: parseFloat(e.target.value) })}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono shadow-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button type="button" onClick={() => setIsRuleModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg shadow-sm">
              Save Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
