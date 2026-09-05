import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, CreditCard, RefreshCw, Calendar, Users } from 'lucide-react';
import api from '../api/client';
import { StatCard } from '../components/common/StatCard';
import { LoadingSpinner, ErrorAlert } from '../components/common/LoadingAndEmpty';

export const Revenue = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRevenue = async () => {
    setLoading(true);
    try {
      const res = await api.get('/revenue/analytics');
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch revenue telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, []);

  if (loading) return <LoadingSpinner message="Aggregating recognized revenue & subscription telemetry..." />;
  if (error) return <ErrorAlert message={error} onRetry={fetchRevenue} />;

  const {
    totalRecognizedRevenue,
    oneTimeRevenue,
    recurringRevenue,
    mrr,
    arr,
    activeSubscriptionsCount,
    monthlyTrend,
    repRevenueData,
    recentRecords,
  } = data || {};

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-brand-600" /> Revenue Operations & Recognized ARR
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Hybrid monetization telemetry: one-time hardware sales, implementation services, and recurring subscriptions.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Recognized"
          value={`₹${((totalRecognizedRevenue || 0) / 100000).toFixed(2)} L`}
          subtitle="Settled Payments"
          icon={DollarSign}
        />
        <StatCard
          title="Monthly Recurring (MRR)"
          value={`₹${((mrr || 0) / 100000).toFixed(2)} L`}
          subtitle={`Annual Run Rate (ARR): ₹${((arr || 0) / 100000).toFixed(2)} L`}
          icon={RefreshCw}
        />
        <StatCard
          title="One-Time Revenue"
          value={`₹${((oneTimeRevenue || 0) / 100000).toFixed(2)} L`}
          subtitle="Hardware & Services"
          icon={CreditCard}
        />
        <StatCard
          title="Active Subscriptions"
          value={activeSubscriptionsCount || 0}
          subtitle="Enterprise SaaS Licenses"
          icon={Users}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-600" /> Monthly Revenue Recognized
          </h3>
          <div className="space-y-3 pt-2">
            {monthlyTrend?.map((item) => (
              <div key={item.month} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-semibold">{item.month}</span>
                  <span className="font-mono text-brand-700 font-bold">₹{item.revenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-600"
                    style={{ width: `${Math.min(100, Math.max(15, (item.revenue / (totalRecognizedRevenue || 1)) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Sales Rep */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-600" /> Revenue by Account Executive
          </h3>
          <div className="space-y-3 pt-2">
            {repRevenueData?.map((rep) => (
              <div key={rep.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-semibold">{rep.name}</span>
                  <span className="font-mono text-brand-700 font-bold">₹{rep.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(100, Math.max(20, (rep.amount / (totalRecognizedRevenue || 1)) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Ledger Entries */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Recognized Revenue Ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200 font-semibold">
                <th className="pb-3">Client Account</th>
                <th className="pb-3">Monetization Type</th>
                <th className="pb-3">Amount Recognized</th>
                <th className="pb-3">Notes</th>
                <th className="pb-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentRecords?.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 font-semibold text-slate-900">{rec.account?.name || 'Enterprise Client'}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold text-slate-700">
                      {rec.type}
                    </span>
                  </td>
                  <td className="py-3 font-mono font-bold text-emerald-700">
                    +₹{rec.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 text-slate-600 text-[11px]">{rec.notes}</td>
                  <td className="py-3 text-right font-mono text-slate-500">
                    {new Date(rec.recognizedDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
